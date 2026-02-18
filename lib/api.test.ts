import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './api'
import { supabase } from './supabase'

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
    }))
  }
}))

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStudents', () => {
    it('should fetch and map students correctly', async () => {
      const mockData = [
        { id: '1', full_name: 'John Doe', subjects: ['Math'], lesson_price: 50 }
      ]
      
      const mockFrom = vi.mocked(supabase.from)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null })
      } as any)

      const students = await api.getStudents()
      
      expect(students).toHaveLength(1)
      expect(students[0].fullName).toBe('John Doe')
      expect(students[0].lessonPrice).toBe(50)
      expect(mockFrom).toHaveBeenCalledWith('students')
    })

    it('should throw error on fetch failure', async () => {
      const mockFrom = vi.mocked(supabase.from)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      } as any)

      await expect(api.getStudents()).rejects.toThrow('DB Error')
    })
  })

  describe('createLesson', () => {
    it('should insert lesson and map response', async () => {
      const newLesson = {
        studentIds: ['s1'],
        date: '2024-02-19',
        time: '10:00',
        duration: 60,
        status: 'upcoming' as const,
        paymentStatus: 'unpaid' as const,
      }
      
      const mockResponse = { ...newLesson, id: 'l1', student_ids: ['s1'] }
      
      const mockFrom = vi.mocked(supabase.from)
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResponse, error: null })
      } as any)

      const result = await api.createLesson(newLesson)
      
      expect(result.id).toBe('l1')
      expect(result.studentIds).toEqual(['s1'])
      expect(mockFrom).toHaveBeenCalledWith('lessons')
    })
  })
})
