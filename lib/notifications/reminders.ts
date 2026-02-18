import { Lesson, Student } from '../types'
import { notify } from './notifier'
import { api } from '../api'

/**
 * Filter lessons that start in approximately 30 minutes
 */
export function filterLessonsForReminders(lessons: Lesson[], now: Date): Lesson[] {
  return lessons.filter(lesson => {
    if (lesson.status !== 'upcoming' || lesson.telegramSent) return false

    const lessonDate = new Date(`${lesson.date}T${lesson.time}`)
    const diffMs = lessonDate.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)

    // Match if exactly 30 minutes away (or within a 2 min window to be safe)
    return diffMins >= 28 && diffMins <= 32
  })
}

/**
 * Format reminder message
 */
export function formatReminderMessage(studentName: string, lessonTime: string, subject?: string): string {
  return `⏰ *Upcoming Lesson Reminder*\n\n` +
         `Hello ${studentName}! Your ${subject ? `*${subject}* ` : ''}lesson is starting in *30 minutes*.\n\n` +
         `🕐 *Time:* ${lessonTime}\n` +
         `💻 Get your materials ready!`
}

/**
 * Send reminders for all eligible lessons
 */
export async function checkAndSendReminders(): Promise<number> {
  const now = new Date()
  const upcomingLessons = await api.getUpcomingLessons()
  const toRemind = filterLessonsForReminders(upcomingLessons, now)

  let sentCount = 0
  for (const lesson of toRemind) {
    // For each lesson, we need the student(s)
    for (const studentId of lesson.studentIds) {
      const student = await api.getStudentById(studentId)
      if (student && student.telegramChatId) {
        const message = formatReminderMessage(student.fullName, lesson.time, lesson.subject)
        await notify({
          type: 'no_upcoming_lessons', // Use a generic type or add 'reminder'
          studentName: student.fullName,
          studentId: student.id,
          details: `Lesson starting at ${lesson.time}`,
          timestamp: new Date().toISOString(),
          targetChatId: student.telegramChatId
        })
        
        // Mark as sent
        await api.updateLesson(lesson.id, { telegramSent: true })
        sentCount++
      }
    }
  }

  return sentCount
}
