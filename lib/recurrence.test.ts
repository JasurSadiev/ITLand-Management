import { describe, it, expect } from 'vitest'
import { generateRecurringLessons } from './lessons'
import type { Lesson } from './types'

describe('generateRecurringLessons', () => {
  const baseLesson: Omit<Lesson, "id" | "createdAt"> = {
    studentIds: ['test-student'],
    date: '2024-02-19', // A Monday
    time: '10:00',
    duration: 60,
    status: 'upcoming',
    paymentStatus: 'unpaid',
    recurrenceType: 'one-time',
    timezone: 'UTC',
  }

  it('should return a single lesson if recurrenceType is "one-time"', () => {
    const lessons = generateRecurringLessons(baseLesson)
    expect(lessons).toHaveLength(1)
    expect(lessons[0].date).toBe('2024-02-19')
  })

  it('should generate weekly lessons until end date', () => {
    const weeklyLesson = {
      ...baseLesson,
      recurrenceType: 'weekly' as const,
      recurrenceEndDate: '2024-03-04', // 3 Mondays: Feb 19, Feb 26, Mar 4
    }
    const lessons = generateRecurringLessons(weeklyLesson)
    expect(lessons).toHaveLength(3)
    expect(lessons.map(l => l.date)).toEqual(['2024-02-19', '2024-02-26', '2024-03-04'])
  })

  it('should generate exactly 1 weekly lesson if end date is before second week', () => {
    const weeklyLesson = {
      ...baseLesson,
      recurrenceType: 'weekly' as const,
      recurrenceEndDate: '2024-02-25', // Sunday before second Monday
    }
    const lessons = generateRecurringLessons(weeklyLesson)
    expect(lessons).toHaveLength(1)
    expect(lessons[0].date).toBe('2024-02-19')
  })

  it('should generate lessons for specific days of week (Mon, Wed, Fri)', () => {
    const specificDaysLesson = {
      ...baseLesson,
      recurrenceType: 'specific-days' as const,
      recurrenceDays: [1, 3, 5], // Mon, Wed, Fri
      recurrenceEndDate: '2024-03-01', // Friday
    }
    // Feb: 19(M), 21(W), 23(F), 26(M), 28(W)
    // Mar: 01(F)
    const lessons = generateRecurringLessons(specificDaysLesson)
    expect(lessons).toHaveLength(6)
    expect(lessons.map(l => l.date)).toEqual([
      '2024-02-19', '2024-02-21', '2024-02-23', 
      '2024-02-26', '2024-02-28', '2024-03-01'
    ])
  })

  it('should handle start date not in recurrenceDays for specific-days and skip correctly', () => {
    const specificDaysLesson = {
      ...baseLesson,
      date: '2024-02-20', // Tuesday
      recurrenceType: 'specific-days' as const,
      recurrenceDays: [1, 3], // Mon, Wed
      recurrenceEndDate: '2024-02-28',
    }
    // Next matches: Feb 21 (Wed), 26 (Mon), 28 (Wed)
    const lessons = generateRecurringLessons(specificDaysLesson)
    expect(lessons).toHaveLength(3)
    expect(lessons.map(l => l.date)).toEqual(['2024-02-21', '2024-02-26', '2024-02-28'])
  })

  it('should return return single lesson if end date is same as start date', () => {
    const weeklyLesson = {
      ...baseLesson,
      recurrenceType: 'weekly' as const,
      recurrenceEndDate: '2024-02-19',
    }
    const lessons = generateRecurringLessons(weeklyLesson)
    expect(lessons).toHaveLength(1)
    expect(lessons[0].date).toBe('2024-02-19')
  })

  it('should ignore end date and return single lesson for one-time type', () => {
    const oneTimeWithEnd = {
      ...baseLesson,
      recurrenceType: 'one-time' as const,
      recurrenceEndDate: '2024-12-31',
    }
    const lessons = generateRecurringLessons(oneTimeWithEnd)
    expect(lessons).toHaveLength(1)
    expect(lessons[0].date).toBe('2024-02-19')
  })

  it('should return a single lesson for "makeup" type (handles as one-time)', () => {
    const makeupLesson = {
      ...baseLesson,
      recurrenceType: 'makeup' as any, // makeup is handled outside by mapping, but helper should be safe
    }
    const lessons = generateRecurringLessons(makeupLesson)
    expect(lessons).toHaveLength(1)
    expect(lessons[0].date).toBe('2024-02-19')
  })

  it('should handle leap years correctly (Weekly)', () => {
    // 2024 is a leap year. Feb 22 (Thu) -> Feb 29 (Thu) -> Mar 7 (Thu)
    const leapYearLesson = {
      ...baseLesson,
      date: '2024-02-22',
      recurrenceType: 'weekly' as const,
      recurrenceEndDate: '2024-03-07',
    }
    const lessons = generateRecurringLessons(leapYearLesson)
    expect(lessons).toHaveLength(3)
    expect(lessons.map(l => l.date)).toEqual(['2024-02-22', '2024-02-29', '2024-03-07'])
  })

  it('should handle specific days crossing month boundaries', () => {
    // Oct 30 (Wed) -> Oct 31 (Thu) -> Nov 1 (Fri)
    const monthBoundaryLesson = {
      ...baseLesson,
      date: '2024-10-30',
      recurrenceType: 'specific-days' as const,
      recurrenceDays: [3, 4, 5], // Wed, Thu, Fri
      recurrenceEndDate: '2024-11-01',
    }
    const lessons = generateRecurringLessons(monthBoundaryLesson)
    expect(lessons).toHaveLength(3)
    expect(lessons.map(l => l.date)).toEqual(['2024-10-30', '2024-10-31', '2024-11-01'])
  })

  it('should preserve all lesson metadata across generated instances', () => {
    const complexLesson = {
      ...baseLesson,
      time: '23:30',
      duration: 45,
      subject: 'Advanced Python',
      notes: 'Testing preservation',
      telegramSent: true,
      recurrenceType: 'weekly' as const,
      recurrenceEndDate: '2024-03-04',
    }
    const lessons = generateRecurringLessons(complexLesson)
    expect(lessons).toHaveLength(3)
    lessons.forEach(l => {
      expect(l.time).toBe('23:30')
      expect(l.duration).toBe(45)
      expect(l.subject).toBe('Advanced Python')
      expect(l.notes).toBe('Testing preservation')
      expect(l.telegramSent).toBe(true)
    })
  })
})
