import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleTelegramUpdate } from '@/lib/notifications/bot-handlers'
import { sendTelegramMessage } from '@/lib/notifications/telegram'
import { api } from '@/lib/api'

// Mock dependencies
vi.mock('@/lib/notifications/telegram', () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(true)
}))

vi.mock('@/lib/api', () => ({
  api: {
    getStudents: vi.fn().mockResolvedValue([]),
    getStudentByPhone: vi.fn(),
    updateStudent: vi.fn().mockResolvedValue({}),
    getLessons: vi.fn().mockResolvedValue([])
  }
}))

describe('Telegram Bot Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/start command', () => {
    it('should send welcome message with contact sharing button', async () => {
      const update = {
        update_id: 1,
        message: {
          chat: { id: 123 },
          text: '/start'
        }
      }

      await handleTelegramUpdate(update)

      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to ITLand'),
        '123',
        expect.any(Object)
      )
    })
  })

  describe('Contact Sharing (Login)', () => {
    it('should link student when phone number matches', async () => {
      const mockStudent = { id: 's1', fullName: 'Alice', lessonBalance: 5 }
      vi.mocked(api.getStudentByPhone).mockResolvedValue(mockStudent as any)

      const update = {
        update_id: 2,
        message: {
          chat: { id: 123 },
          contact: { phone_number: '+1234567890' }
        }
      }

      await handleTelegramUpdate(update)

      expect(api.getStudentByPhone).toHaveBeenCalledWith('+1234567890')
      expect(api.updateStudent).toHaveBeenCalledWith('s1', { telegramChatId: '123' })
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Success'),
        '123'
      )
    })

    it('should send failure message when no student matches', async () => {
      vi.mocked(api.getStudentByPhone).mockResolvedValue(null)

      const update = {
        update_id: 3,
        message: {
          chat: { id: 123 },
          contact: { phone_number: '+0000000000' }
        }
      }

      await handleTelegramUpdate(update)

      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Authentication Failed'),
        '123'
      )
    })
  })

  describe('/status command', () => {
    it('should show student status if linked', async () => {
      const mockStudents = [
        { id: 's1', fullName: 'Alice', telegramChatId: '123', status: 'active', lessonBalance: 5 }
      ]
      vi.mocked(api.getStudents).mockResolvedValue(mockStudents as any)

      const update = {
        update_id: 4,
        message: {
          chat: { id: 123 },
          text: '/status'
        }
      }

      await handleTelegramUpdate(update)
      
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('Alice'),
        '123'
      )
    })

    it('should show not logged in message if not linked', async () => {
      vi.mocked(api.getStudents).mockResolvedValue([])

      const update = {
        update_id: 5,
        message: {
          chat: { id: 999 },
          text: '/status'
        }
      }

      await handleTelegramUpdate(update)
      
      expect(sendTelegramMessage).toHaveBeenCalledWith(
        expect.stringContaining('not logged in'),
        '999'
      )
    })
  })
})
