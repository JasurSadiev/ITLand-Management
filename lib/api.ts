import { supabase } from "./supabase"
import type { Student, Lesson, Payment, Package, Homework, Material, RescheduleRequest } from "./types"

// Helper to map DB snake_case to frontend camelCase
const mapStudentFromDB = (data: any): Student => ({
  id: data.id,
  fullName: data.full_name,
  age: data.age,
  parentName: data.parent_name,
  contactPhone: data.contact_phone,
  contactWhatsapp: data.contact_whatsapp,
  contactEmail: data.contact_email,
  password: data.password_text,
  timezone: data.timezone,
  lessonType: data.lesson_type,
  subjects: data.subjects || [],
  lessonPrice: data.lesson_price,
  paymentModel: data.payment_model,
  status: data.status,
  notes: data.notes,
  tags: data.tags || [],
  lessonBalance: data.lesson_balance || 0,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

const mapLessonFromDB = (data: any): Lesson => ({
  id: data.id,
  studentIds: data.student_ids || [],
  date: data.date,
  time: data.time,
  duration: data.duration,
  status: data.status,
  paymentStatus: data.payment_status,
  subject: data.subject,
  notes: data.notes,
  recurrenceType: data.recurrence_type,
  recurrenceEndDate: data.recurrence_end_date,
  recurrenceDays: data.recurrence_days,
  recurrenceParentId: data.recurrence_parent_id,
  isMakeup: data.is_makeup,
  meetingLink: data.meeting_link,
  timezone: data.timezone,
  auditInfo: data.audit_info ? {
    rescheduledFrom: data.audit_info.rescheduled_from,
    penaltyCharged: data.audit_info.penalty_charged,
    reason: data.audit_info.reason,
    actionTakenAt: data.audit_info.action_taken_at,
  } : undefined,
  cancellationReason: data.cancellation_reason,
  createdAt: data.created_at,
})

const mapPaymentFromDB = (data: any): Payment => ({
  id: data.id,
  studentId: data.student_id,
  amount: data.amount,
  method: data.method,
  date: data.date,
  lessonIds: data.lesson_ids || [],
  notes: data.notes,
  createdAt: data.created_at,
})

export const api = {
  // Students
  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return data.map(mapStudentFromDB)
  },

  createStudent: async (student: Omit<Student, "id" | "createdAt" | "updatedAt">): Promise<Student> => {
    const { data, error } = await supabase
      .from("students")
      .insert({
        full_name: student.fullName,
        age: student.age,
        parent_name: student.parentName,
        contact_phone: student.contactPhone,
        contact_whatsapp: student.contactWhatsapp,
        contact_email: student.contactEmail,
        password_text: student.password,
        timezone: student.timezone,
        lesson_type: student.lessonType,
        subjects: student.subjects,
        lesson_price: student.lessonPrice,
        payment_model: student.paymentModel,
        status: student.status,
        notes: student.notes,
        tags: student.tags,
        lesson_balance: student.lessonBalance,
      })
      .select()
      .single()
    if (error) throw error
    return mapStudentFromDB(data)
  },

  updateStudent: async (id: string, updates: Partial<Student>): Promise<Student> => {
    const dbUpdates: any = {}
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
    if (updates.age !== undefined) dbUpdates.age = updates.age
    if (updates.parentName !== undefined) dbUpdates.parent_name = updates.parentName
    if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone
    if (updates.contactWhatsapp !== undefined) dbUpdates.contact_whatsapp = updates.contactWhatsapp
    if (updates.contactEmail !== undefined) dbUpdates.contact_email = updates.contactEmail
    if (updates.password !== undefined) dbUpdates.password_text = updates.password
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
    if (updates.lessonType !== undefined) dbUpdates.lesson_type = updates.lessonType
    if (updates.subjects !== undefined) dbUpdates.subjects = updates.subjects
    if (updates.lessonPrice !== undefined) dbUpdates.lesson_price = updates.lessonPrice
    if (updates.paymentModel !== undefined) dbUpdates.payment_model = updates.paymentModel
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.lessonBalance !== undefined) dbUpdates.lesson_balance = updates.lessonBalance

    const { data, error } = await supabase
      .from("students")
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return mapStudentFromDB(data)
  },

  deleteStudent: async (id: string) => {
    // 1. Fetch all lessons involving this student
    const { data: lessons, error: fetchError } = await supabase
      .from("lessons")
      .select("*")
      .contains("student_ids", [id])
    
    if (fetchError) throw fetchError

    // 2. Process lessons
    if (lessons && lessons.length > 0) {
      const lessonsToDelete: string[] = []
      const lessonsToUpdate: { id: string; student_ids: string[] }[] = []

      for (const lesson of lessons) {
        if (lesson.student_ids.length === 1 && lesson.student_ids[0] === id) {
          // Only this student -> Delete lesson
          lessonsToDelete.push(lesson.id)
        } else {
          // Multiple students -> Remove this student
          const newStudentIds = lesson.student_ids.filter((studentId: string) => studentId !== id)
          lessonsToUpdate.push({ id: lesson.id, student_ids: newStudentIds })
        }
      }

      // Perform updates and deletions
      if (lessonsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("lessons")
          .delete()
          .in("id", lessonsToDelete)
        if (deleteError) throw deleteError
      }

      for (const update of lessonsToUpdate) {
        const { error: updateError } = await supabase
          .from("lessons")
          .update({ student_ids: update.student_ids })
          .eq("id", update.id)
        if (updateError) throw updateError
      }
    }
    const { error } = await supabase.from("students").delete().eq("id", id)
    if (error) throw error
  },

  // Lessons
  getLessons: async (filters?: { studentId?: string }): Promise<Lesson[]> => {
    let query = supabase.from("lessons").select("*").order("date", { ascending: false })
    if (filters?.studentId) {
      query = query.contains("student_ids", [filters.studentId])
    }
    const { data, error } = await query
    if (error) throw error
    return data.map(mapLessonFromDB)
  },

  createLesson: async (lesson: Omit<Lesson, "id" | "createdAt">): Promise<Lesson> => {
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        student_ids: lesson.studentIds,
        date: lesson.date,
        time: lesson.time,
        duration: lesson.duration,
        status: lesson.status,
        payment_status: lesson.paymentStatus,
        subject: lesson.subject,
        notes: lesson.notes,
        recurrence_type: lesson.recurrenceType,
        recurrence_end_date: lesson.recurrenceEndDate,
        recurrence_days: lesson.recurrenceDays,
        recurrence_parent_id: lesson.recurrenceParentId,
        is_makeup: lesson.isMakeup,
        meeting_link: lesson.meetingLink,
        timezone: lesson.timezone,
      })
      .select()
      .single()
    if (error) throw error
    return mapLessonFromDB(data)
  },

  createLessons: async (lessons: Omit<Lesson, "id" | "createdAt">[]): Promise<Lesson[]> => {
    const { data, error } = await supabase
      .from("lessons")
      .insert(
        lessons.map(lesson => ({
          student_ids: lesson.studentIds,
          date: lesson.date,
          time: lesson.time,
          duration: lesson.duration,
          status: lesson.status,
          payment_status: lesson.paymentStatus,
          subject: lesson.subject,
          notes: lesson.notes,
          recurrence_type: lesson.recurrenceType,
          recurrence_end_date: lesson.recurrenceEndDate,
          recurrence_days: lesson.recurrenceDays,
          recurrence_parent_id: lesson.recurrenceParentId,
          is_makeup: lesson.isMakeup,
          meeting_link: lesson.meetingLink,
          timezone: lesson.timezone,
        }))
      )
      .select()
    if (error) throw error
    return data.map(mapLessonFromDB)
  },

  updateLesson: async (id: string, updates: Partial<Lesson>): Promise<Lesson> => {
    const dbUpdates: any = {}
    if (updates.studentIds !== undefined) dbUpdates.student_ids = updates.studentIds
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.time !== undefined) dbUpdates.time = updates.time
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus
    if (updates.subject !== undefined) dbUpdates.subject = updates.subject
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.meetingLink !== undefined) dbUpdates.meeting_link = updates.meetingLink
    if (updates.cancellationReason !== undefined) dbUpdates.cancellation_reason = updates.cancellationReason
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
    if (updates.auditInfo !== undefined) {
      dbUpdates.audit_info = {
        rescheduled_from: updates.auditInfo.rescheduledFrom,
        penalty_charged: updates.auditInfo.penaltyCharged,
        reason: updates.auditInfo.reason,
        action_taken_at: updates.auditInfo.actionTakenAt,
      }
    }
    
    const { data, error } = await supabase.from("lessons").update(dbUpdates).eq("id", id).select().single()
    if (error) throw error
    return mapLessonFromDB(data)
  },

  deleteLesson: async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id)
    if (error) throw error
  },

  deleteLessons: async (ids: string[]) => {
    if (ids.length === 0) return
    const { error } = await supabase.from("lessons").delete().in("id", ids)
    if (error) throw error
  },

  // Payments
  getPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase.from("payments").select("*").order("date", { ascending: false })
    if (error) throw error
    return data.map(mapPaymentFromDB)
  },

  createPayment: async (payment: Omit<Payment, "id" | "createdAt">): Promise<Payment> => {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: payment.studentId,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        lesson_ids: payment.lessonIds,
        notes: payment.notes,
      })
      .select()
      .single()
    if (error) throw error
    return mapPaymentFromDB(data)
  },

  // Packages (Mock for now until schema confirmed, sticking to local or basic implementation if table exists)
  getPackages: async (): Promise<Package[]> => {
    const { data, error } = await supabase.from("packages").select("*")
    // If table doesn't exist yet, return empty array to avoid crash
    if (error) return [] 
    return data.map((p: any) => ({
      id: p.id,
      studentId: p.student_id,
      totalLessons: p.total_lessons,
      remainingLessons: p.remaining_lessons,
      amount: p.amount,
      purchaseDate: p.purchase_date,
      expiryDate: p.expiry_date,
      status: p.status,
    }))
  },

  // Homework
  getHomework: async (filters?: { studentId?: string; lessonId?: string }): Promise<Homework[]> => {
    let query = supabase.from("homework").select("*").order("created_at", { ascending: false })
    if (filters?.studentId) query = query.eq("student_id", filters.studentId)
    if (filters?.lessonId) query = query.eq("lesson_id", filters.lessonId)
    
    const { data, error } = await query
    if (error) return []
    return data.map((h: any) => ({
      id: h.id,
      lessonId: h.lesson_id,
      studentId: h.student_id,
      title: h.title,
      description: h.description,
      dueDate: h.due_date,
      timezone: h.timezone,
      status: h.status,
      feedback: h.feedback,
      attachments: h.attachments || [],
      submissionText: h.submission_text,
      submittedAt: h.submitted_at,
      createdAt: h.created_at,
    }))
  },

  createHomework: async (homework: Omit<Homework, "id" | "createdAt" | "timezone"> & { timezone?: string }): Promise<Homework> => {
    const { data, error } = await supabase
      .from("homework")
      .insert({
        lesson_id: homework.lessonId || null,
        student_id: homework.studentId,
        title: homework.title,
        description: homework.description,
        due_date: homework.dueDate,
        timezone: homework.timezone || "Europe/London",
        status: homework.status,
        attachments: homework.attachments,
      })
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      timezone: data.timezone,
      status: data.status,
      attachments: data.attachments || [],
      createdAt: data.created_at,
    }
  },

  createHomeworks: async (assignments: (Omit<Homework, "id" | "createdAt" | "timezone"> & { timezone?: string })[]): Promise<Homework[]> => {
    const { data, error } = await supabase
      .from("homework")
      .insert(
        assignments.map(h => ({
          lesson_id: h.lessonId || null,
          student_id: h.studentId,
          title: h.title,
          description: h.description,
          due_date: h.dueDate,
          timezone: h.timezone || "Europe/London",
          status: h.status,
          attachments: h.attachments,
        }))
      )
      .select()
    if (error) throw error
    return data.map((h: any) => ({
      id: h.id,
      lessonId: h.lesson_id,
      studentId: h.student_id,
      title: h.title,
      description: h.description,
      dueDate: h.due_date,
      timezone: h.timezone,
      status: h.status,
      attachments: h.attachments || [],
      createdAt: h.created_at,
    }))
  },

  updateHomework: async (id: string, updates: Partial<Homework>): Promise<Homework> => {
    const dbUpdates: any = {}
    if (updates.lessonId !== undefined) dbUpdates.lesson_id = updates.lessonId || null
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback
    if (updates.attachments !== undefined) dbUpdates.attachments = updates.attachments
    if (updates.submissionText !== undefined) dbUpdates.submission_text = updates.submissionText
    if (updates.submittedAt !== undefined) dbUpdates.submitted_at = updates.submittedAt
    
    const { data, error } = await supabase.from("homework").update(dbUpdates).eq("id", id).select().single()
    if (error) throw error
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      timezone: data.timezone,
      status: data.status,
      feedback: data.feedback,
      attachments: data.attachments || [],
      submissionText: data.submission_text,
      submittedAt: data.submitted_at,
      createdAt: data.created_at,
    }
  },

  deleteHomework: async (id: string) => {
    const { error } = await supabase.from("homework").delete().eq("id", id)
    if (error) throw error
  },

   // Reschedule Requests
   getRescheduleRequests: async (): Promise<RescheduleRequest[]> => {
    const { data, error } = await supabase
      .from("reschedule_requests")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return data.map((r: any) => ({
      id: r.id,
      lessonId: r.lesson_id,
      studentId: r.student_id,
      proposedSlots: r.proposed_slots,
      reason: r.reason,
      status: r.status,
      timezone: r.timezone,
      createdAt: r.created_at,
    }))
   },

   getRescheduleRequestByLessonId: async (lessonId: string): Promise<RescheduleRequest | null> => {
    const { data, error } = await supabase
      .from("reschedule_requests")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("status", "pending")
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      proposedSlots: data.proposed_slots,
      reason: data.reason,
      status: data.status,
      timezone: data.timezone,
      createdAt: data.created_at,
    }
   },

   createRescheduleRequest: async (request: Omit<RescheduleRequest, "id" | "createdAt">): Promise<RescheduleRequest> => {
    const { data, error } = await supabase
      .from("reschedule_requests")
      .insert({
        lesson_id: request.lessonId,
        student_id: request.studentId,
        proposed_slots: request.proposedSlots,
        reason: request.reason,
        status: request.status,
        timezone: request.timezone,
      })
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      proposedSlots: data.proposed_slots,
      reason: data.reason,
      status: data.status,
      timezone: data.timezone,
      createdAt: data.created_at,
    }
   },

   updateRescheduleRequest: async (id: string, updates: Partial<RescheduleRequest>): Promise<RescheduleRequest> => {
    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    
    const { data, error } = await supabase
      .from("reschedule_requests")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      proposedSlots: data.proposed_slots,
      status: data.status,
      timezone: data.timezone,
      createdAt: data.created_at,
    }
   }
}
