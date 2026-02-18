import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StudentForm } from '@/components/students/student-form'
import type { Student } from '@/lib/types'

// Mock Radix UI Dialog as it uses Portals
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="mock-dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}))

// Robust Select mock for JSDOM
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, id }: any) => (
    <select 
      value={value} 
      onChange={(e) => onValueChange?.(e.target.value)} 
      id={id}
      data-testid="mock-select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="" disabled>{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  X: () => <div data-testid="mock-x-icon" />,
  Plus: () => <div />,
  Calendar: () => <div />,
}))

describe('Student Registration Integration', () => {
  const mockOnSave = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow filling out the form and submitting a new student', async () => {
    render(
      <StudentForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    )

    // Basic Information
    fireEvent.change(screen.getByLabelText(/Full Name \*/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText(/Parent Name/i), { target: { value: 'Jane Doe' } })
    
    // Select Timezone (using the id we added)
    const timezoneSelect = screen.getByLabelText(/Timezone/i)
    fireEvent.change(timezoneSelect, { target: { value: 'Europe/London' } })

    // Contact & Login
    fireEvent.change(screen.getByLabelText(/Email \(Login\) \*/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'securepass123' } })
    
    // Lesson Settings
    const lessonTypeSelect = screen.getByLabelText(/Lesson Type/i)
    fireEvent.change(lessonTypeSelect, { target: { value: 'group' } })

    fireEvent.change(screen.getByLabelText(/Lesson Price \(\$\)/i), { target: { value: '75' } })

    const paymentModelSelect = screen.getByLabelText(/Payment Model/i)
    fireEvent.change(paymentModelSelect, { target: { value: 'monthly' } })

    const statusSelect = screen.getByLabelText(/Status/i)
    fireEvent.change(statusSelect, { target: { value: 'active' } })

    // Add a Custom Subject
    const subjectInput = screen.getByPlaceholderText(/Add custom subject/i)
    fireEvent.change(subjectInput, { target: { value: 'Advanced Algorithms' } })
    fireEvent.click(screen.getByLabelText('Add subject'))

    // Submit the form
    const submitButton = screen.getByText('Add Student')
    fireEvent.click(submitButton)

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      fullName: 'John Doe',
      age: 25,
      parentName: 'Jane Doe',
      timezone: 'Europe/London',
      contactEmail: 'john@example.com',
      password: 'securepass123',
      lessonType: 'group',
      lessonPrice: 75,
      paymentModel: 'monthly',
      status: 'active',
      subjects: expect.arrayContaining(['Advanced Algorithms'])
    }))

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show "Edit Student" title when student is provided', () => {
    const mockStudent: Student = {
      id: 's1',
      fullName: 'Existing Student',
      email: 'existing@example.com',
      status: 'active',
      lessonPrice: 50,
      createdAt: new Date().toISOString()
    } as any

    render(
      <StudentForm
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
        student={mockStudent}
      />
    )

    expect(screen.getByText('Edit Student')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing Student')).toBeInTheDocument()
  })
})
