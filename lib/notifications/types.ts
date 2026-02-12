export interface NotificationEvent {
  type: 'lesson_cancelled' | 'lesson_rescheduled' | 'homework_submitted' | 'balance_zero' | 'no_upcoming_lessons' | 'payment_received' | 'student_registered' | 'new_message'
  studentName: string
  studentId: string
  details: string
  timestamp: string
  actionUrl?: string
}

export interface TelegramMessage {
  chat_id: string
  text: string
  parse_mode?: 'Markdown' | 'HTML'
}
