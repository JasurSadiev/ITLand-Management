import { supabase } from "./supabase"
import type { Student, Lesson, Payment, Package, Homework, Material, RescheduleRequest, User, Message } from "./types"

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
  lessonPrice: Number(data.lesson_price),
  paymentModel: data.payment_model,
  status: data.status,
  notes: data.notes,
  tags: data.tags || [],
  lessonBalance: data.lesson_balance,
  preferences: data.preferences,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

const mapLessonFromDB = (data: any): Lesson => ({
  id: data.id,
  studentIds: data.student_ids,
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
  auditInfo: data.audit_info,
  cancellationReason: data.cancellation_reason,
  whatsappSent: data.whatsapp_sent,
  createdAt: data.created_at,
})

export const api = {
  // Students
  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from("students").select("*").order("full_name")
    if (error) throw error
    return data.map(mapStudentFromDB)
  },

  getStudentById: async (id: string): Promise<Student> => {
    const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Student not found")
    return mapStudentFromDB(data)
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
    if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences

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

    // 2. Loop through lessons and update student_ids
    if (lessons && lessons.length > 0) {
      for (const lesson of lessons) {
        const remainingStudents = lesson.student_ids.filter((sId: string) => sId !== id)
        
        if (remainingStudents.length === 0) {
          // If no students left, delete the lesson
          await supabase.from("lessons").delete().eq("id", lesson.id)
        } else {
          // Update lesson with remaining students
          await supabase.from("lessons").update({ student_ids: remainingStudents }).eq("id", lesson.id)
        }
      }
    }

    // 3. Delete student record
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

  getLessonById: async (id: string): Promise<Lesson> => {
    const { data, error } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Lesson not found")
    return mapLessonFromDB(data)
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
        whatsapp_sent: lesson.whatsappSent,
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
          whatsapp_sent: lesson.whatsappSent,
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
    if (updates.recurrenceType !== undefined) dbUpdates.recurrence_type = updates.recurrenceType
    if (updates.recurrenceEndDate !== undefined) dbUpdates.recurrence_end_date = updates.recurrenceEndDate
    if (updates.recurrenceDays !== undefined) dbUpdates.recurrence_days = updates.recurrenceDays
    if (updates.recurrenceParentId !== undefined) dbUpdates.recurrence_parent_id = updates.recurrenceParentId
    if (updates.isMakeup !== undefined) dbUpdates.is_makeup = updates.isMakeup
    if (updates.meetingLink !== undefined) dbUpdates.meeting_link = updates.meetingLink
    if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone
    if (updates.auditInfo !== undefined) dbUpdates.audit_info = updates.auditInfo
    if (updates.cancellationReason !== undefined) dbUpdates.cancellation_reason = updates.cancellationReason
    if (updates.whatsappSent !== undefined) dbUpdates.whatsapp_sent = updates.whatsappSent

    const { data, error } = await supabase.from("lessons").update(dbUpdates).eq("id", id).select().single()
    if (error) throw error
    return mapLessonFromDB(data)
  },

  deleteLesson: async (id: string) => {
    const { error } = await supabase.from("lessons").delete().eq("id", id)
    if (error) throw error
  },

  // Payments
  getPayments: async (): Promise<Payment[]> => {
    const { data, error } = await supabase.from("payments").select("*").order("date", { ascending: false })
    if (error) throw error
    return data.map((p: any) => ({
      id: p.id,
      studentId: p.student_id,
      amount: Number(p.amount),
      method: p.method,
      date: p.date,
      lessonIds: p.lesson_ids || [],
      notes: p.notes,
      createdAt: p.created_at,
    }))
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
    return {
      id: data.id,
      studentId: data.student_id,
      amount: Number(data.amount),
      method: data.method,
      date: data.date,
      lessonIds: data.lesson_ids || [],
      notes: data.notes,
      createdAt: data.created_at,
    }
  },

  // Packages
  getPackages: async (): Promise<Package[]> => {
    const { data, error } = await supabase.from("packages").select("*")
    if (error) throw error
    return data.map((pk: any) => ({
      id: pk.id,
      studentId: pk.student_id,
      totalLessons: pk.total_lessons,
      remainingLessons: pk.remaining_lessons,
      amount: Number(pk.amount),
      purchaseDate: pk.purchase_date,
      expiryDate: pk.expiry_date,
      status: pk.status,
    }))
  },

  updatePackage: async (id: string, updates: Partial<Package>): Promise<Package> => {
    const dbUpdates: any = {}
    if (updates.remainingLessons !== undefined) dbUpdates.remaining_lessons = updates.remainingLessons
    if (updates.status !== undefined) dbUpdates.status = updates.status

    const { data, error } = await supabase.from("packages").update(dbUpdates).eq("id", id).select().single()
    if (error) throw error
    return {
      id: data.id,
      studentId: data.student_id,
      totalLessons: data.total_lessons,
      remainingLessons: data.remaining_lessons,
      amount: Number(data.amount),
      purchaseDate: data.purchase_date,
      expiryDate: data.expiry_date,
      status: data.status,
    }
  },

  // Homework
  getHomework: async (filters?: { studentId?: string }): Promise<Homework[]> => {
    let query = supabase.from("homework").select("*").order("created_at", { ascending: false })
    if (filters?.studentId) {
      query = query.eq("student_id", filters.studentId)
    }
    const { data, error } = await query
    if (error) throw error
    return data.map((h: any) => ({
      id: h.id,
      lessonId: h.lesson_id,
      studentId: h.student_id,
      title: h.title,
      description: h.description,
      dueDate: h.due_date,
      timezone: h.timezone || "UTC",
      status: h.status,
      feedback: h.feedback,
      attachments: h.attachments || [],
      createdAt: h.created_at,
    }))
  },

  createHomeworks: async (homeworks: Omit<Homework, "id" | "createdAt">[]): Promise<Homework[]> => {
    const { data, error } = await supabase
      .from("homework")
      .insert(
        homeworks.map(hw => ({
          lesson_id: hw.lessonId,
          student_id: hw.studentId,
          title: hw.title,
          description: hw.description,
          due_date: hw.dueDate,
          timezone: hw.timezone || "UTC",
          status: hw.status,
          feedback: hw.feedback,
          attachments: hw.attachments || [],
        }))
      )
      .select()
    if (error) {
      console.error("Supabase error creating homework:", error)
      throw error
    }
    return data.map((h: any) => ({
      id: h.id,
      lessonId: h.lesson_id,
      studentId: h.student_id,
      title: h.title,
      description: h.description,
      dueDate: h.due_date,
      timezone: h.timezone || "UTC",
      status: h.status,
      feedback: h.feedback,
      attachments: h.attachments || [],
      createdAt: h.created_at,
    }))
  },

  updateHomework: async (id: string, updates: Partial<Homework>): Promise<Homework> => {
    const dbUpdates: any = {}
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.feedback !== undefined) dbUpdates.feedback = updates.feedback
    if (updates.submissionText !== undefined) dbUpdates.submission_text = updates.submissionText
    if (updates.submittedAt !== undefined) dbUpdates.submitted_at = updates.submittedAt
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate

    const { data, error } = await supabase.from("homework").update(dbUpdates).eq("id", id).select().single()
    if (error) throw error
    return {
      id: data.id,
      lessonId: data.lesson_id,
      studentId: data.student_id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      timezone: data.timezone || "UTC",
      status: data.status,
      feedback: data.feedback,
      submissionText: data.submission_text,
      submittedAt: data.submitted_at,
      attachments: data.attachments || [],
      createdAt: data.created_at,
    }
  },

  deleteHomework: async (id: string): Promise<void> => {
    const { error } = await supabase.from("homework").delete().eq("id", id)
    if (error) throw error
  },

  // Materials
  getMaterials: async (): Promise<Material[]> => {
    const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return data.map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      url: m.url,
      tags: m.tags || [],
      createdAt: m.created_at,
    }))
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
  },

  // Chat
  getMessages: async (studentId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true })
    if (error) throw error
    return data.map((m: any) => ({
      id: m.id,
      studentId: m.student_id,
      teacherId: m.teacher_id,
      sender: m.sender,
      content: m.content,
      read: m.read,
      createdAt: m.created_at,
    }))
  },

  sendMessage: async (message: Omit<Message, "id" | "createdAt" | "read">): Promise<Message> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        student_id: message.studentId,
        teacher_id: message.teacherId,
        sender: message.sender,
        content: message.content,
        read: false,
      })
      .select()
      .single()
    if (error) throw error
    return {
      id: data.id,
      studentId: data.student_id,
      teacherId: data.teacher_id,
      sender: data.sender,
      content: data.content,
      read: data.read,
      createdAt: data.created_at,
    }
  },

  markAsRead: async (messageIds: string[]): Promise<void> => {
    if (messageIds.length === 0) return
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .in("id", messageIds)
    if (error) throw error
  },

  getUnreadMessageCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("read", false)
      .eq("sender", "student")
    
    if (error) throw error
    return count || 0
  },

  getChatSummaries: async (): Promise<any[]> => {
      // Fetch students first
      const { data: students, error: sError } = await supabase
        .from("students")
        .select("id, full_name, preferences")
        .order("full_name")
      
      if (sError) throw sError

      // Fetch all messages content to process in memory (efficient enough for small datasets)
      // Ideally use a Postgres function or view for large datasets
      const { data: messages, error: mError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true }) // Oldest first to build history
      
      if (mError) throw mError

      // aggregating
      const summaryMap = new Map<string, { lastMessage: Message | null, unreadCount: number }>()

      students.forEach((s: any) => {
          summaryMap.set(s.id, { lastMessage: null, unreadCount: 0 })
      })

      messages.forEach((m: any) => {
          if (summaryMap.has(m.student_id)) {
              const info = summaryMap.get(m.student_id)!
              info.lastMessage = {
                  id: m.id,
                  studentId: m.student_id,
                  teacherId: m.teacher_id,
                  sender: m.sender,
                  content: m.content,
                  read: m.read,
                  createdAt: m.created_at
              }
              if (!m.read && m.sender === 'student') {
                  info.unreadCount += 1
              }
          }
      })

      return students.map((s: any) => ({
          ...mapStudentFromDB(s),
          lastMessage: summaryMap.get(s.id)?.lastMessage,
          unreadCount: summaryMap.get(s.id)?.unreadCount
      })).sort((a: any, b: any) => {
          // Sort by unread count descending, then by last message date descending
          if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount
          const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
          const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
          return dateB - dateA
      })
  },

  // Teacher Profile & Availability (Public)
  getTeacherAvailability: async (teacherId?: string): Promise<User> => {
      // For public portal, we might not have a teacherId. 
      // We grab the first settings available if none provided.
      let query = supabase.from("availability_settings").select("*")
      if (teacherId) {
        query = query.eq("user_id", teacherId)
      } else {
        // Fallback: strictly get a single row if it exists
        query = query.limit(1)
      }

      const { data: settings } = await query.maybeSingle()
      
      const { data: blackout } = await supabase
        .from("blackout_slots")
        .select("*")
        .eq("user_id", settings?.user_id || teacherId || "u1")

      const defaultWorkingHours = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", active: true },
      ]

      return {
        id: settings?.user_id || teacherId || "u1",
        name: "Teacher",
        email: "",
        role: "teacher",
        timezone: settings?.timezone || "UTC", 
        workingHours: settings?.working_hours || defaultWorkingHours,
        preferences: settings?.preferences || {},
        blackoutSlots: blackout?.map((b: any) => ({
          id: b.id,
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          notes: b.notes
        })) || []
      }
  },

  // Helper for mock auth
  getEffectiveUserId: async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user.id
    
    // Fallback to mock login
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("teacher-admin-user")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.id) return parsed.id
        } catch (e) {}
      }
    }
    
    // Last resort for demo
    return "admin-1"
  },

  updateTeacherAvailability: async (updates: { workingHours?: any[], timezone?: string, preferences?: any }): Promise<void> => {
    const userId = await api.getEffectiveUserId()

    const dbUpdates: any = { user_id: userId }
    if (updates.workingHours) dbUpdates.working_hours = updates.workingHours
    if (updates.timezone) dbUpdates.timezone = updates.timezone
    if (updates.preferences) dbUpdates.preferences = updates.preferences

    const { error } = await supabase
      .from("availability_settings")
      .upsert(dbUpdates)
    
    if (error) throw error
  },

  addBlackoutSlot: async (slot: { date: string, startTime: string, endTime: string, notes?: string }): Promise<void> => {
    const userId = await api.getEffectiveUserId()

    const { error } = await supabase
      .from("blackout_slots")
      .insert({
        user_id: userId,
        date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        notes: slot.notes
      })
    
    if (error) throw error
  },

   deleteBlackoutSlot: async (id: string): Promise<void> => {
     const { error } = await supabase
       .from("blackout_slots")
       .delete()
       .eq("id", id)
     
     if (error) throw error
   }
}
