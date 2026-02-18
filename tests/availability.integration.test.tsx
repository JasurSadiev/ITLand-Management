import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AvailabilityPage from '@/app/settings/availability/page'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getTeacherAvailability: vi.fn(),
    updateTeacherAvailability: vi.fn(),
    addBlackoutSlot: vi.fn(),
    deleteBlackoutSlot: vi.fn()
  }
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn()
  })
}))

// Mock UI components
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
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}))

vi.mock('@/components/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />
}))

vi.mock('@/components/header', () => ({
  Header: ({ title }: any) => <h1>{title}</h1>
}))

describe('Availability Integration', () => {
  const mockWorkingHours = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', active: true }
  ]
  const mockUser = {
    id: 'teacher-1',
    timezone: 'UTC',
    workingHours: mockWorkingHours,
    blackoutSlots: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getTeacherAvailability).mockResolvedValue(mockUser as any)
  })

  it('should load and display availability settings', async () => {
    render(<AvailabilityPage />)

    expect(await screen.findByText('Availability Settings')).toBeInTheDocument()
    expect(screen.getByText('Monday')).toBeInTheDocument()
    
    // Check for Monday's slot times
    const timeInputs = screen.getAllByDisplayValue('09:00')
    expect(timeInputs.length).toBeGreaterThan(0)
  })

  it('should allow adding and removing shifts', async () => {
    render(<AvailabilityPage />)
    
    await screen.findByText('Availability Settings')

    // Find "Add Shift" for Tuesday (dayIndex 2 is Tuesday in our DAYS array)
    // Actually Monday is index 1. Tuesday is index 2.
    // The DAYS array: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const addButtons = screen.getAllByText(/Add Shift/i)
    // Monday is index 1 in the rendered list of DAYS
    // Let's find the one next to "Tuesday"
    const tuesdaySection = screen.getByText('Tuesday').closest('div')?.parentElement
    const tuesdayAddButton = tuesdaySection?.querySelector('button') as HTMLButtonElement
    
    fireEvent.click(tuesdayAddButton)

    // Verify a new shift appears for Tuesday
    // Default times are 09:00 to 17:00
    await waitFor(() => {
        const slots = screen.getAllByDisplayValue('09:00')
        // We had one for Monday, now we should have one for Tuesday too (if Tuesday didn't have any)
        expect(slots.length).toBe(2)
    })
  })

  it('should save availability changes', async () => {
    render(<AvailabilityPage />)
    
    await screen.findByText('Availability Settings')

    // Change Monday's start time
    const startTimeInput = screen.getByDisplayValue('09:00')
    fireEvent.change(startTimeInput, { target: { value: '10:00' } })

    // Click Save
    const saveButton = screen.getByText(/Save Changes/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(api.updateTeacherAvailability).toHaveBeenCalledWith(
        expect.objectContaining({
          workingHours: expect.arrayContaining([
            expect.objectContaining({
              dayOfWeek: 1,
              startTime: '10:00'
            })
          ])
        })
      )
      expect(toast.success).toHaveBeenCalledWith('Availability saved successfully!')
    })
  })
})
