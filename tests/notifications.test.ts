import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notify, notifications } from '@/lib/notifications/notifier'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { filterLessonsForReminders, formatReminderMessage } from '@/lib/notifications/reminders'

// Mock telegram.ts
vi.mock('@/lib/notifications/telegram', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(true)
}))

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getUpcomingLessons: vi.fn(),
    updateLesson: vi.fn(),
    getStudentByPhone: vi.fn(),
    getStudentById: vi.fn()
  }
}))

describe('Telegram Notification System (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID = 'teacher-chat-id'
  })

  describe('Routing Logic', () => {
    it('should route to teacher by default', async () => {
      const student = { fullName: 'Alice', id: 's1' }
      await notifications.lessonCancelled(student, 'Math at 10:00', true)
      expect(sendTelegramMessage).toHaveBeenCalledWith(
          expect.stringContaining('Lesson Cancelled'),
          undefined
      )
    })

    it('should route to specific student chatId when present', async () => {
      const student = { fullName: 'Alice', id: 's1', telegramChatId: 'alice-chat-id' }
      await notifications.lessonCancelled(student, 'Math at 10:00')
      
      expect(sendTelegramMessage).toHaveBeenCalledWith(
          expect.any(String),
          'alice-chat-id'
      )
    })
  })

  describe('Integrated Event Alerts', () => {
    const student = { fullName: 'Alice', id: 's1', telegramChatId: 'alice-chat-id' }

    it('should format lesson cancelled alert correctly', async () => {
      await notifications.lessonCancelled(student as any, 'Math on Monday')
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Lesson Cancelled'),
        'alice-chat-id'
      )
    })

    it('should format lesson rescheduled alert correctly', async () => {
      await notifications.lessonRescheduled(student as any, 'Math moved to Tuesday')
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Lesson Rescheduled'),
        'alice-chat-id'
      )
    })

    it('should format payment received alert correctly', async () => {
      await notifications.paymentReceived(student as any, 50)
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Payment of $50 received'),
        'alice-chat-id'
      )
    })
  })

  describe('Reminder Logic', () => {
      it('should filter lessons starting in ~30 minutes', () => {
          const now = new Date('2024-03-20T10:00:00')
          const lessons: any[] = [
              { id: '1', date: '2024-03-20', time: '10:30', status: 'upcoming', telegramSent: false }, // Match
              { id: '2', date: '2024-03-20', time: '11:00', status: 'upcoming', telegramSent: false }, // Fail (60m)
              { id: '3', date: '2024-03-20', time: '10:30', status: 'cancelled-student', telegramSent: false }, // Fail (status)
              { id: '4', date: '2024-03-20', time: '10:30', status: 'upcoming', telegramSent: true }, // Fail (already sent)
              { id: '5', date: '2024-03-20', time: '10:31', status: 'upcoming', telegramSent: false }, // Match (31m)
          ]

          const results = filterLessonsForReminders(lessons, now)
          expect(results).toHaveLength(2)
          expect(results.map(r => r.id)).toContain('1')
          expect(results.map(r => r.id)).toContain('5')
      })

      it('should format a friendly reminder message', () => {
          const message = formatReminderMessage('Alice', '10:30', 'Math')
          expect(message).toContain('Alice')
          expect(message).toContain('Math')
          expect(message).toContain('30 minutes')
          expect(message).toContain('10:30')
      })
  })

  describe('Student Linking Formatting', () => {
      it('should handle different phone formats (SKELETON)', () => {
          // Placeholder for when we implement the cleaner matching logic
          expect(true).toBe(true)
      })
  })
})
