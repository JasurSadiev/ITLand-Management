import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LessonForm } from '@/components/calendar/lesson-form'
import type { Student, User } from '@/lib/types'

// Mock sub-components that are complex or not relevant to this integration test
vi.mock('@/components/calendar/availability-picker', () => ({
  AvailabilityPicker: () => <div data-testid="availability-picker" />
}))

// Mock UI components that use portals or complex logic
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, id }: any) => (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      data-testid="mock-select"
      id={id}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children, id }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <>{children}</>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  CalendarIcon: () => <div />,
  X: () => <div />,
  Check: () => <div />,
  CheckIcon: () => <div />,
  ChevronLeft: () => <div />,
  ChevronRight: () => <div />,
}))

describe('Scheduling Integration', () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined)
  const mockOnOpenChange = vi.fn()
  
  const mockStudents: Student[] = [
    { id: 's1', fullName: 'Alice Smith', status: 'active', subjects: ['Math'], lessonPrice: 50 } as Student,
    { id: 's2', fullName: 'Bob Jones', status: 'active', subjects: ['Physics'], lessonPrice: 60 } as Student,
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow selecting multiple students and submitting a one-time lesson', async () => {
    render(
      <LessonForm
        open={true}
        onOpenChange={mockOnOpenChange}
        students={mockStudents}
        onSave={mockOnSave}
      />
    )

    // Select first student
    const aliceCheckbox = screen.getByText('Alice Smith')
    fireEvent.click(aliceCheckbox)

    // Select second student
    const bobCheckbox = screen.getByText('Bob Jones')
    fireEvent.click(bobCheckbox)

    // Set Subject - Math is available because Alice has it
    const mathOption = screen.getByRole('option', { name: 'Math' })
    const subjectSelect = mathOption.parentElement as HTMLSelectElement
    fireEvent.change(subjectSelect, { target: { value: 'Math' } })

    // Click Schedule
    const submitButton = screen.getByText(/Schedule Lesson/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          studentIds: ['s1', 's2'],
          subject: 'Math',
          recurrenceType: 'one-time'
        }),
        false // generateRecurring flag for one-time
      )
    })

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should allow scheduling a weekly recurring lesson', async () => {
    render(
      <LessonForm
        open={true}
        onOpenChange={mockOnOpenChange}
        students={mockStudents}
        onSave={mockOnSave}
      />
    )

    // Select student
    const aliceCheckbox = screen.getByText('Alice Smith')
    fireEvent.click(aliceCheckbox)

    // Select recurrence type: Weekly
    const weeklyOption = screen.getByRole('option', { name: /Weekly/i })
    const lessonTypeSelect = weeklyOption.parentElement as HTMLSelectElement
    fireEvent.change(lessonTypeSelect, { target: { value: 'weekly' } })

    // Set Subject - since selectedSubjects > 0, it's a select
    const mathOption = screen.getByRole('option', { name: 'Math' })
    const subjectSelect = mathOption.parentElement as HTMLSelectElement
    fireEvent.change(subjectSelect, { target: { value: 'Math' } })

    // Click Schedule
    const submitButton = screen.getByText(/Schedule Lesson/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          studentIds: ['s1'],
          subject: 'Math',
          recurrenceType: 'weekly'
        }),
        true // generateRecurring flag for recurring
      )
    })

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should disable submit button if no student is selected', () => {
    render(
      <LessonForm
        open={true}
        onOpenChange={mockOnOpenChange}
        students={mockStudents}
        onSave={mockOnSave}
      />
    )

    const submitButton = screen.getByText('Schedule Lesson')
    expect(submitButton).toBeDisabled()
  })
})
