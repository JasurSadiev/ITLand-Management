import { sendTelegramMessage } from './telegram'
import type { NotificationEvent } from './types'
import type { Student } from '../types'

/**
 * Format notification message for Telegram
 */
function formatMessage(event: NotificationEvent): string {
  const emoji = getEventEmoji(event.type)
  const title = getEventTitle(event.type)
  
  let message = `${emoji} *${title}*\n\n`
  message += `👤 *Student:* ${event.studentName}\n`
  message += `📋 *Details:* ${event.details}\n`
  message += `🕐 *Time:* ${new Date(event.timestamp).toLocaleString()}\n`
  
  if (event.actionUrl) {
    message += `\n🔗 [View Details](${event.actionUrl})`
  }
  
  return message
}

/**
 * Get emoji for event type
 */
function getEventEmoji(type: NotificationEvent['type']): string {
  const emojiMap: Record<NotificationEvent['type'], string> = {
    lesson_cancelled: '❌',
    lesson_rescheduled: '📅',
    homework_submitted: '📝',
    balance_zero: '⚠️',
    no_upcoming_lessons: '⏰',
    payment_received: '💰',
    student_registered: '🎉',
    new_message: '💬'
  }
  return emojiMap[type]
}

/**
 * Get title for event type
 */
function getEventTitle(type: NotificationEvent['type']): string {
  const titleMap: Record<NotificationEvent['type'], string> = {
    lesson_cancelled: 'Lesson Cancelled',
    lesson_rescheduled: 'Lesson Rescheduled',
    homework_submitted: 'Homework Submitted',
    balance_zero: 'Balance Alert',
    no_upcoming_lessons: 'No Upcoming Lessons',
    payment_received: 'Payment Received',
    student_registered: 'New Student Registered',
    new_message: 'New Message'
  }
  return titleMap[type]
}

/**
 * Send notification for an event
 */
export async function notify(event: NotificationEvent): Promise<boolean> {
  // If targetChatId is not provided, we can't send anything
  if (!event.targetChatId && !process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
    console.warn(`[Notifier] Missing targetChatId for event: ${event.type}. Skipping.`)
    return false
  }

  const message = formatMessage(event)
  return await sendTelegramMessage(message, event.targetChatId)
}

/**
 * Quick notification helpers
 */
export const notifications = {
  chatMessageReceived: (studentName: string, studentId: string, content: string) =>
    notify({
      type: 'new_message',
      studentName,
      studentId,
      details: content,
      timestamp: new Date().toISOString(),
      actionUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/chat`
    }),

  lessonCancelled: (student: { fullName: string, id: string, telegramChatId?: string }, lessonDetails: string, isTeacherTarget: boolean = false) => 
    notify({
      type: 'lesson_cancelled',
      studentName: student.fullName,
      studentId: student.id,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: isTeacherTarget ? `${window.location.origin}/calendar` : `${window.location.origin}/student/schedule`,
      targetChatId: isTeacherTarget ? undefined : student.telegramChatId // undefined defaults to teacher chat ID in sendTelegramMessage
    }),

  lessonRescheduled: (student: { fullName: string, id: string, telegramChatId?: string }, lessonDetails: string, isTeacherTarget: boolean = false) => 
    notify({
      type: 'lesson_rescheduled',
      studentName: student.fullName,
      studentId: student.id,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/student/schedule`,
      targetChatId: student.telegramChatId
    }),

  homeworkSubmitted: (studentName: string, studentId: string, homeworkTitle: string) => 
    notify({
      type: 'homework_submitted',
      studentName,
      studentId,
      details: `Homework: "${homeworkTitle}"`,
      timestamp: new Date().toISOString(),
      actionUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/homework`
      // targetChatId: undefined (Teacher only)
    }),

  homeworkChecked: (student: Student, homeworkTitle: string) =>
    notify({
      type: 'homework_submitted', // Re-using type for badge/title for now or we could add homework_checked if we want to be pedantic
      studentName: student.fullName,
      studentId: student.id,
      details: `Teacher checked your homework: "${homeworkTitle}"`,
      timestamp: new Date().toISOString(),
      actionUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/student/homework`,
      targetChatId: student.telegramChatId
    }),

  balanceZero: (student: Student) => 
    notify({
      type: 'balance_zero',
      studentName: student.fullName,
      studentId: student.id,
      details: 'Student balance has reached 0. Please follow up.',
      timestamp: new Date().toISOString(),
      actionUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/students/${student.id}`,
      targetChatId: student.telegramChatId
    }),

  paymentReceived: (student: Student, amount: number) => 
    notify({
      type: 'payment_received',
      studentName: student.fullName,
      studentId: student.id,
      details: `Payment of $${amount} received. Thank you!`,
      timestamp: new Date().toISOString(),
      actionUrl: student.telegramChatId ? `${window.location.origin}/student` : `${window.location.origin}/payments`,
      targetChatId: student.telegramChatId
    }),

  noUpcomingLessons: (studentName: string, studentId: string) => 
    notify({
      type: 'no_upcoming_lessons',
      studentName,
      studentId,
      details: 'No lessons scheduled in the next 7 days',
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/lessons`
    }),

  studentRegistered: (studentName: string, studentId: string) => 
    notify({
      type: 'student_registered',
      studentName,
      studentId,
      details: 'New student has registered',
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/students/${studentId}`
    })
}
