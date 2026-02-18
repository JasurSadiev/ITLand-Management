import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatPage from '@/app/chat/page'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getChatSummaries: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn()
  }
}))

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  }
}))

// Mock context
vi.mock('@/lib/context', () => ({
  useCustomization: () => ({
    sidebarCollapsed: false
  })
}))

// Mock UI components
vi.mock('@/components/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />
}))

vi.mock('@/components/header', () => ({
  Header: ({ title }: any) => <h1>{title}</h1>
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: any) => <span>{children}</span>
}))

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div />,
  Send: () => <div aria-label="Send" />,
  Phone: () => <div />,
  Video: () => <div />,
  MoreVertical: () => <div />,
  Paperclip: () => <div />,
  Smile: () => <div />
}))

describe('Chat Integration', () => {
  const mockStudents = [
    { id: 'student-1', fullName: 'Alice Smith', unreadCount: 2, lastMessage: { content: 'Hello teacher', createdAt: new Date().toISOString() } },
    { id: 'student-2', fullName: 'Bob Johnson', unreadCount: 0, lastMessage: null }
  ]

  const mockMessages = [
    { id: 'm1', studentId: 'student-1', teacherId: 'teacher-1', sender: 'student', content: 'Hello teacher', read: false, createdAt: new Date().toISOString() }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getChatSummaries).mockResolvedValue(mockStudents as any)
    vi.mocked(api.getMessages).mockResolvedValue(mockMessages as any)
  })

  it('should load student list and show unread badges', async () => {
    render(<ChatPage />)

    const aliceElements = await screen.findAllByText('Alice Smith')
    expect(aliceElements[0]).toBeInTheDocument()
    
    const bobElements = await screen.findAllByText('Bob Johnson')
    expect(bobElements[0]).toBeInTheDocument()
    
    // Check for unread badge for Alice
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should load messages when a student is selected', async () => {
    render(<ChatPage />)
    
    const aliceElements = await screen.findAllByText('Alice Smith')
    fireEvent.click(aliceElements[0])

    await waitFor(() => {
      expect(api.getMessages).toHaveBeenCalledWith('student-1')
      expect(screen.getByText('Hello teacher')).toBeInTheDocument()
    })
    
    // Should mark as read
    expect(api.markAsRead).toHaveBeenCalledWith(['m1'])
  })

  it('should allow sending a message', async () => {
    vi.mocked(api.sendMessage).mockResolvedValue({
        id: 'm2',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        sender: 'teacher',
        content: 'Hi Alice!',
        read: false,
        createdAt: new Date().toISOString()
    } as any)

    render(<ChatPage />)
    
    const aliceElements = await screen.findAllByText('Alice Smith')
    fireEvent.click(aliceElements[0])

    const input = await screen.findByPlaceholderText(/Type your message/i)
    fireEvent.change(input, { target: { value: 'Hi Alice!' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Send/i }))

    await waitFor(() => {
        expect(api.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            studentId: 'student-1',
            sender: 'teacher',
            content: 'Hi Alice!'
        }))
        expect(screen.getByText('Hi Alice!')).toBeInTheDocument()
    })
  })
})
