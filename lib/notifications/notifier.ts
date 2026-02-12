import { sendTelegramMessage } from './telegram'
import type { NotificationEvent } from './types'

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
  const message = formatMessage(event)
  return await sendTelegramMessage(message)
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

  lessonCancelled: (studentName: string, studentId: string, lessonDetails: string) => 
    notify({
      type: 'lesson_cancelled',
      studentName,
      studentId,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/lessons`
    }),

  lessonRescheduled: (studentName: string, studentId: string, lessonDetails: string) => 
    notify({
      type: 'lesson_rescheduled',
      studentName,
      studentId,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/lessons`
    }),

  homeworkSubmitted: (studentName: string, studentId: string, homeworkTitle: string) => 
    notify({
      type: 'homework_submitted',
      studentName,
      studentId,
      details: `Homework: "${homeworkTitle}"`,
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/homework`
    }),

  balanceZero: (studentName: string, studentId: string) => 
    notify({
      type: 'balance_zero',
      studentName,
      studentId,
      details: 'Student balance has reached 0. Please follow up.',
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/students/${studentId}`
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

  paymentReceived: (studentName: string, studentId: string, amount: number) => 
    notify({
      type: 'payment_received',
      studentName,
      studentId,
      details: `Payment of $${amount} received`,
      timestamp: new Date().toISOString(),
      actionUrl: `${window.location.origin}/payments`
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
