// Core Types for Teacher Admin Panel

export interface Student {
  id: string
  fullName: string
  age?: number
  parentName?: string
  contactPhone?: string
  contactWhatsapp?: string
  contactEmail?: string
  timezone: string
  lessonType: "1-on-1" | "group"
  subjects: string[]
  lessonPrice: number
  paymentModel: "per-lesson" | "package" | "monthly"
  status: "active" | "paused" | "finished"
  notes?: string
  tags: string[]
  lessonBalance: number // Number of paid lessons remaining
  createdAt: string
  updatedAt: string
  password?: string
  preferences?: {
    theme?: "indigo" | "rose" | "emerald" | "amber" | "violet"
    avatarEmoji?: string
    greetingStyle?: "default" | "motivator" | "space" | "cyber"
    confettiEnabled?: boolean
    showMotivation?: boolean
  }
}

export type RecurrenceType = "one-time" | "weekly" | "specific-days" | "makeup"

export interface Lesson {
  id: string
  studentIds: string[]
  date: string
  time: string
  duration: number // in minutes
  status: "upcoming" | "completed" | "cancelled-student" | "cancelled-teacher" | "rescheduled" | "no-show" | "reschedule-requested"
  paymentStatus: "paid" | "unpaid" | "package"
  notes?: string
  subject?: string
  createdAt: string
  // Recurrence fields
  recurrenceType?: RecurrenceType
  recurrenceEndDate?: string // End date for recurring lessons
  recurrenceDays?: number[] // 0-6 for Sunday-Saturday (for specific-days type)
  recurrenceParentId?: string // Links generated lessons to their parent recurring lesson
  isMakeup?: boolean // True if this is a makeup lesson
  meetingLink?: string
  timezone?: string // Added as per instruction
  auditInfo?: {
    rescheduledFrom?: string
    penaltyCharged?: boolean
    reason?: string
    actionTakenAt?: string
  }
  cancellationReason?: string
}

export interface RescheduleRequest {
  id: string
  lessonId: string
  studentId: string
  proposedSlots: { date: string; time: string }[]
  reason?: string
  status: "pending" | "approved" | "rejected"
  timezone?: string
  createdAt: string
}

export interface Payment {
  id: string
  studentId: string
  amount: number
  method: "cash" | "transfer" | "card" | "other"
  date: string
  lessonIds: string[]
  notes?: string
  createdAt: string
}

export interface Package {
  id: string
  studentId: string
  totalLessons: number
  remainingLessons: number
  amount: number
  purchaseDate: string
  expiryDate?: string
  status: "active" | "expired" | "completed"
}

export interface Homework {
  id: string
  lessonId?: string
  studentId: string
  title: string
  description?: string
  dueDate: string // ISO string
  timezone: string
  status: "assigned" | "submitted" | "checked"
  feedback?: string
  attachments: string[]
  submissionText?: string
  submittedAt?: string
  createdAt: string
}

export interface Material {
  id: string
  title: string
  description?: string
  type: "file" | "link"
  url: string
  tags: string[]
  createdAt: string
}

export type UserRole = "teacher" | "assistant"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  preferences?: {
    theme?: "indigo" | "rose" | "emerald" | "amber" | "violet"
    avatarEmoji?: string
    greetingStyle?: "default" | "motivator" | "space" | "cyber"
    confettiEnabled?: boolean
    showMotivation?: boolean
  }
}
