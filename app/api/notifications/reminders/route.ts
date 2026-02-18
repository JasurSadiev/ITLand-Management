import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";
import { sendWazzupMessage } from "@/lib/whatsapp";
import { format, addHours, isWithinInterval, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  // 1. Verify Secret to prevent unauthorized triggers
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch all upcoming lessons
    const lessons = await api.getLessons();
    const students = await api.getStudents();
    
    const now = new Date();
    const oneHourFromNow = addHours(now, 1);
    
    // 3. Find lessons starting in the next 1 hour that haven't been notified
    const upcoming = lessons.filter(lesson => {
      if (lesson.status !== "upcoming" || lesson.whatsappSent) return false;
      
      const lessonDateTime = parseISO(`${lesson.date}T${lesson.time}:00`);
      // Check if lesson is within the next 1 hour (and not in the past)
      return lessonDateTime > now && lessonDateTime <= oneHourFromNow;
    });

    const results = [];

    for (const lesson of upcoming) {
      // Find students for this lesson
      const lessonStudents = students.filter(s => lesson.studentIds.includes(s.id));
      
      for (const student of lessonStudents) {
        let sentAny = false;

        // 1. WhatsApp Reminder
        if (student.contactWhatsapp) {
          const message = `Hello ${student.fullName}! 🎓 This is a reminder that your ${lesson.subject || "lesson"} starts in 1 hour at ${lesson.time}. See you there! 🚀`;
          const response = await sendWazzupMessage(student.contactWhatsapp, message);
          if (response.success) sentAny = true;
        }

        // 2. Telegram Reminder
        if (student.telegramChatId) {
          const { sendTelegramMessage } = await import("@/lib/notifications/telegram");
          const tgMessage = `🔔 *Lesson Reminder*\n\nHello ${student.fullName}! This is a reminder that your *${lesson.subject || "lesson"}* starts in 1 hour at *${lesson.time}*. 🎓\n\nSee you soon! 🚀`;
          const tgSuccess = await sendTelegramMessage(tgMessage, student.telegramChatId);
          if (tgSuccess) sentAny = true;
        }
        
        if (sentAny) {
          // Mark as sent
          await api.updateLesson(lesson.id, { whatsappSent: true, telegramSent: true });
          results.push({ student: student.fullName, status: "sent" });
        } else {
          results.push({ student: student.fullName, status: "failed" });
        }
      }
    }

    return NextResponse.json({ 
      processed: upcoming.length,
      results 
    });

  } catch (error) {
    console.error("Reminder Job Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
