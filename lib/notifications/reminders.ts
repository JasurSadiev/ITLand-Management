import type { Lesson } from '../types'
import { sendTelegramMessage } from './telegram'
import { api } from '../api'

/**
 * Filter lessons that start in approximately 30 minutes.
 * Compares lesson date+time (stored as local time in lesson.timezone) against `now`.
 */
export function filterLessonsForReminders(lessons: Lesson[], now: Date): Lesson[] {
  return lessons.filter(lesson => {
    if (lesson.status !== 'upcoming' || lesson.telegramSent) return false

    // Parse lesson date/time as UTC (stored without timezone offset in DB)
    const lessonDate = new Date(`${lesson.date}T${lesson.time}:00`)
    const diffMs = lessonDate.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)

    // Match if 28–32 minutes away (2-minute tolerance window)
    return diffMins >= 28 && diffMins <= 32
  })
}

/**
 * Format a friendly reminder message for the student
 */
export function formatReminderMessage(studentName: string, lessonTime: string, subject?: string): string {
  return `⏰ *Upcoming Lesson Reminder*\n\n` +
         `Hello ${studentName}! Your ${subject ? `*${subject}* ` : ''}lesson is starting in *30 minutes*.\n\n` +
         `🕐 *Time:* ${lessonTime}\n` +
         `💻 Get your materials ready!`
}

/**
 * Check all upcoming lessons and send reminders to students with linked Telegram accounts.
 * Call this endpoint every 5 minutes via a cron job: GET /api/notifications/reminders
 */
export async function checkAndSendReminders(): Promise<number> {
  const now = new Date()
  
  let upcomingLessons: Lesson[]
  try {
    upcomingLessons = await api.getUpcomingLessons()
  } catch (err) {
    console.error('[Reminders] Failed to fetch upcoming lessons:', err)
    return 0
  }

  const toRemind = filterLessonsForReminders(upcomingLessons, now)
  console.log(`[Reminders] Found ${toRemind.length} lessons needing reminders out of ${upcomingLessons.length} upcoming.`)

  let sentCount = 0
  for (const lesson of toRemind) {
    for (const studentId of lesson.studentIds) {
      try {
        const student = await api.getStudentById(studentId)
        if (!student) continue

        if (student.telegramChatId) {
          const message = formatReminderMessage(student.fullName, lesson.time, lesson.subject)
          const sent = await sendTelegramMessage(message, student.telegramChatId)
          if (sent) {
            console.log(`[Reminders] Sent reminder to ${student.fullName} (chatId: ${student.telegramChatId})`)
            sentCount++
          }
        } else {
          console.log(`[Reminders] Student ${student.fullName} has no Telegram linked, skipping.`)
        }
      } catch (err) {
        console.error(`[Reminders] Error processing student ${studentId}:`, err)
      }
    }

    // Mark lesson as reminder sent to avoid duplicates
    try {
      await api.updateLesson(lesson.id, { telegramSent: true })
    } catch (err) {
      console.error(`[Reminders] Failed to mark lesson ${lesson.id} as sent:`, err)
    }
  }

  return sentCount
}
