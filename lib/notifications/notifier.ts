import { sendTelegramMessage } from './telegram'
import type { NotificationEvent } from './types'
import type { Student } from '../types'

const origin = () => typeof window !== 'undefined' ? window.location.origin : ''

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
  if (!event.targetChatId && !process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID) {
    console.warn(`[Notifier] Missing targetChatId for event: ${event.type}. Skipping.`)
    return false
  }

  const message = formatMessage(event)
  return await sendTelegramMessage(message, event.targetChatId)
}

/**
 * Quick notification helpers
 * 
 * Routing rules:
 * - Teacher cancels lesson → notify STUDENT (student.telegramChatId)
 * - Student cancels lesson → notify TEACHER (default NEXT_PUBLIC_TELEGRAM_CHAT_ID, no targetChatId)
 * - Student reschedules → notify TEACHER
 * - Teacher approves reschedule → notify STUDENT
 */
export const notifications = {
  chatMessageReceived: (studentName: string, studentId: string, content: string) =>
    notify({
      type: 'new_message',
      studentName,
      studentId,
      details: content,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/chat`
      // No targetChatId → goes to teacher's default chat
    }),

  /**
   * Teacher cancelled a lesson → notify the student
   */
  lessonCancelledByTeacher: (student: Student, lessonDetails: string) =>
    notify({
      type: 'lesson_cancelled',
      studentName: student.fullName,
      studentId: student.id,
      details: `Your lesson has been cancelled: ${lessonDetails}`,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/student/schedule`,
      targetChatId: student.telegramChatId // Send to student
    }),

  /**
   * Student cancelled a lesson → notify the teacher
   */
  lessonCancelledByStudent: (student: Student, lessonDetails: string) =>
    notify({
      type: 'lesson_cancelled',
      studentName: student.fullName,
      studentId: student.id,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/calendar`,
      // No targetChatId → goes to teacher's default chat
    }),

  /**
   * @deprecated Use lessonCancelledByTeacher or lessonCancelledByStudent instead
   */
  lessonCancelled: (student: Student | { fullName: string, id: string, telegramChatId?: string }, lessonDetails: string, isTeacherTarget: boolean = false) =>
    notify({
      type: 'lesson_cancelled',
      studentName: student.fullName,
      studentId: student.id,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: isTeacherTarget ? `${origin()}/calendar` : `${origin()}/student/schedule`,
      targetChatId: isTeacherTarget ? undefined : (student as Student).telegramChatId
    }),

  /**
   * Student requested reschedule → notify the teacher
   */
  lessonRescheduled: (student: Student | { fullName: string, id: string, telegramChatId?: string }, lessonDetails: string, isTeacherTarget: boolean = false) =>
    notify({
      type: 'lesson_rescheduled',
      studentName: student.fullName,
      studentId: student.id,
      details: lessonDetails,
      timestamp: new Date().toISOString(),
      actionUrl: isTeacherTarget ? `${origin()}/calendar` : `${origin()}/student/schedule`,
      targetChatId: isTeacherTarget ? undefined : (student as Student).telegramChatId
    }),

  /**
   * Teacher approved reschedule → notify the student
   */
  rescheduleApproved: (student: Student, newDateTime: string) =>
    notify({
      type: 'lesson_rescheduled',
      studentName: student.fullName,
      studentId: student.id,
      details: `Your reschedule request was approved! New time: ${newDateTime}`,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/student/schedule`,
      targetChatId: student.telegramChatId // Send to student
    }),

  homeworkSubmitted: (studentName: string, studentId: string, homeworkTitle: string) =>
    notify({
      type: 'homework_submitted',
      studentName,
      studentId,
      details: `Homework: "${homeworkTitle}"`,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/homework`
      // No targetChatId → goes to teacher
    }),

  homeworkChecked: (student: Student, homeworkTitle: string) =>
    notify({
      type: 'homework_submitted',
      studentName: student.fullName,
      studentId: student.id,
      details: `Teacher checked your homework: "${homeworkTitle}"`,
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/student/homework`,
      targetChatId: student.telegramChatId
    }),

  balanceZero: (student: Student) =>
    notify({
      type: 'balance_zero',
      studentName: student.fullName,
      studentId: student.id,
      details: 'Student balance has reached 0. Please follow up.',
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/students/${student.id}`,
      // No targetChatId → goes to teacher
    }),

  paymentReceived: (student: Student, amount: number) =>
    notify({
      type: 'payment_received',
      studentName: student.fullName,
      studentId: student.id,
      details: `Payment of $${amount} received. Thank you!`,
      timestamp: new Date().toISOString(),
      actionUrl: student.telegramChatId ? `${origin()}/student` : `${origin()}/payments`,
      targetChatId: student.telegramChatId
    }),

  noUpcomingLessons: (studentName: string, studentId: string) =>
    notify({
      type: 'no_upcoming_lessons',
      studentName,
      studentId,
      details: 'No lessons scheduled in the next 7 days',
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/lessons`
    }),

  studentRegistered: (studentName: string, studentId: string) =>
    notify({
      type: 'student_registered',
      studentName,
      studentId,
      details: 'New student has registered',
      timestamp: new Date().toISOString(),
      actionUrl: `${origin()}/students/${studentId}`
    })
}
