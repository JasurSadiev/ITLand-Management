"use client"

import { useEffect, useState, useMemo } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { CalendarView } from "@/components/calendar/calendar-view"
import { LessonForm } from "@/components/calendar/lesson-form"
import { LessonDetails } from "@/components/calendar/lesson-details"
import { PaymentForm } from "@/components/payments/payment-form"
import { Button } from "@/components/ui/button"
import { Plus, DollarSign, Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { store } from "@/lib/store"
import type { Lesson, Student, Package, Payment, User } from "@/lib/types"
import { toZonedTime, fromZonedTime, format } from "date-fns-tz"
import { RescheduleDialog } from "@/components/calendar/reschedule-dialog"
import { DeleteAlertDialog } from "@/components/calendar/delete-alert-dialog"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

// Helper function to generate recurring lessons
function generateRecurringLessons(
  lessonData: Omit<Lesson, "id" | "createdAt">,
): Omit<Lesson, "id" | "createdAt">[] {
  const lessons: Omit<Lesson, "id" | "createdAt">[] = []
  
  if (!lessonData.recurrenceEndDate) {
    return [lessonData]
  }

  // Parse YYYY-MM-DD parts to avoid local timezone issues entirely
  const [startYear, startMonth, startDay] = lessonData.date.split("-").map(Number)
  const endDateObj = new Date(lessonData.recurrenceEndDate)
  const parentId = Date.now().toString() // Use as a reference for all generated lessons
  
  if (lessonData.recurrenceType === "weekly") {
    // Generate lessons every week on the same day
    let currentOffset = 7
    
    // Initial lesson is already added by the caller usually, but logic here assumes we generate ALL recurring instances?
    // Wait, the original logic generated the FIRST lesson inside the loop too: "let currentDate = new Date(startDate)"
    // So we should start from the start date.
    
    // We'll interpret the start date as UTC to ensure stable addition of days
    const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
    
    let currentUtc = startUtc
    let currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    
    // Loop until end date
    // Note: endDateObj parsing might be local or UTC depending on string, usually UTC if YYYY-MM-DD
    // But comparing ISO strings is safest
    const endIsoDate = lessonData.recurrenceEndDate
    
    // Add the first lesson (original)
    lessons.push({
        ...lessonData,
        recurrenceParentId: parentId,
        date: currentIsoDate
    })
    
    // Add subsequent lessons
    while (true) {
        // Add 7 days in milliseconds (safe in UTC as there is no DST)
        currentUtc += 7 * 24 * 60 * 60 * 1000
        currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
        
        if (currentIsoDate > endIsoDate) break;
        
        lessons.push({
          ...lessonData,
          date: currentIsoDate,
          recurrenceParentId: parentId,
        })
    }
    
    // The previous implementation was:
    // let currentDate = new Date(startDate) 
    // while (currentDate <= endDate) ... push ... add 7 days
    
    // My new implementation pushes the first one (start date) first, then adds 7 days.
    // However, the caller `handleSaveLesson` does: `for (const lesson of recurringLessons) { store.addLesson(lesson) }`
    // And if `generateRecurring` is true, it calls this INSTEAD of adding the single lesson. 
    // So returning the list including the first one is correct.
    
  } else if (lessonData.recurrenceType === "specific-days" && lessonData.recurrenceDays?.length) {
    // For specific days, we iterate day by day
    // Safest way: Normalized UTC loop
    const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
    const endIsoDate = lessonData.recurrenceEndDate
    
    let currentUtc = startUtc
    let currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    
    // Add "start" date lesson if it matches the day?
    // Original logic: "while (currentDate <= endDate)... if matches... push" 
    // It started from startDate.
    
    // Optimization: Loop day by day is fine for a year (365 iterations is nothing).
    
    while (currentIsoDate <= endIsoDate) {
      const d = new Date(currentUtc)
      const dayOfWeek = d.getUTCDay() // UTC Day 0=Sun, 6=Sat
      
      // Note: original logic used `currentDate.getDay()` which is LOCAL day of week.
      // If we use UTC dates, we get UTC day of week.
      // Does "Every Sunday" mean Sunday in User's TZ or Default TZ?
      // Usually "Sunday" is "Sunday" regardless of timezone unless you are crossing midnight.
      // Assuming lesson.date YYYY-MM-DD is the correct "Day" intended by user.
      
      if (lessonData.recurrenceDays.includes(dayOfWeek)) {
        lessons.push({
          ...lessonData,
          date: currentIsoDate,
          recurrenceParentId: parentId,
        })
      }
      
      // Add 1 day
      currentUtc += 24 * 60 * 60 * 1000
      currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    }
  } else {
    // One time or other - just return the single lesson (or handle makeup logic if any)
    return [lessonData]
  }
  
  return lessons
}

import { TIMEZONES } from "@/lib/constants"

export default function CalendarPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Default to system timezone or UTC if detection fails, simplified to UTC for consistency in this demo?
  // User asked for "possibility to see calendar in all different time zones", implying a choice.
  // Setting default to "UTC" to match our data entry assumption (recurrence fix used UTC) is safest starting point.
  const [viewTimezone, setViewTimezone] = useState("UTC")

  const [formOpen, setFormOpen] = useState(false)
  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedLessonPaid, setSelectedLessonPaid] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [lessonToReschedule, setLessonToReschedule] = useState<Lesson | null>(null)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)
  const [teacher, setTeacher] = useState<User | null>(null)
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    setTeacher(store.getCurrentUser())
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [lessonsData, studentsData, packagesData] = await Promise.all([
        api.getLessons(),
        api.getStudents(),
        api.getPackages(),
      ])
      setLessons(lessonsData)
      setStudents(studentsData)
      setPackages(packagesData)
    } catch (error) {
      console.error("Failed to load calendar data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Adjust lessons to selected timezone for display
  const adjustedLessons = useMemo(() => {
    return lessons.map(lesson => {
      // Interpret the stored date/time in the lesson's original timezone
      const lessonTimezone = lesson.timezone || "UTC"
      const localDate = fromZonedTime(`${lesson.date} ${lesson.time}`, lessonTimezone)
      
      // Convert to target view timezone
      const zonedDate = toZonedTime(localDate, viewTimezone)
      
      return {
        ...lesson,
        date: format(zonedDate, "yyyy-MM-dd", { timeZone: viewTimezone }),
        time: format(zonedDate, "HH:mm", { timeZone: viewTimezone })
      }
    })
  }, [lessons, viewTimezone])

  if (!mounted) {
    return null
  }

  // Collision Detection Helper
  // Checks if a proposed time slot (start, duration) overlaps with any existing non-cancelled lesson
  // We should check against the "database/UTC" times, not the view times, as scheduling is done in UTC/Base.
  const checkCollision = (
    date: string, 
    time: string, 
    duration: number, 
    excludeLessonId?: string
  ): boolean => {
    // Basic collision check: start < existingEnd && end > existingStart
    // Convert proposed to minutes from midnight or similar linear value
    const [h, m] = time.split(':').map(Number)
    const newStart = h * 60 + m
    const newEnd = newStart + duration
    
    return lessons.some(existing => {
      if (existing.id === excludeLessonId) return false
      if (existing.date !== date) return false
      if (existing.status === 'cancelled-student' || existing.status === 'cancelled-teacher') return false
      
      const [exH, exM] = existing.time.split(':').map(Number)
      const exStart = exH * 60 + exM
      const exEnd = exStart + existing.duration
      
      // Check overlap
      return newStart < exEnd && newEnd > exStart
    })
  }

  const handleLessonClick = (lesson: Lesson, isPaid: boolean) => {
    // When clicking a lesson, we want to edit the ORIGINAL lesson (UTC assumption), not the adjusted one?
    // Or we want to see details in local time?
    // Usually displaying details in viewed time is best. Editing might be tricky.
    // For now, let's pass the adjusted lesson to details so they see what they clicked.
    setSelectedLesson(lesson)
    setSelectedLessonPaid(isPaid)
    setDetailsOpen(true)
  }

  const handleAddLesson = () => {
    setSelectedLesson(null)
    setFormOpen(true)
  }

  const handleEditLesson = () => {
    setDetailsOpen(false)
    // NOTE: If we pass the adjusted lesson to the form, saving it will overwrite the DB with the adjusted time!
    // We should ideally find the original lesson by ID from the `lessons` state before editing.
    const originalLesson = lessons.find(l => l.id === selectedLesson?.id)
    if (originalLesson) {
        setSelectedLesson(originalLesson) 
    }
    setFormOpen(true)
  }

  const handleSaveLesson = async (
    lessonData: Omit<Lesson, "id" | "createdAt"> | Partial<Lesson>,
    generateRecurring = false
  ) => {
    try {
      // Check for collision on the primary lesson (first one)
      // Note: checking collisions for *all* recurring lessons in a loop might be heavy but safer.
      // For now, let's check the main/first one.
      const dateToCheck = (lessonData as Lesson).date || selectedLesson?.date
      const timeToCheck = (lessonData as Lesson).time || selectedLesson?.time
      const durationToCheck = (lessonData as Lesson).duration || selectedLesson?.duration || 60 // Default 60 if null?
      
      if (dateToCheck && timeToCheck && durationToCheck) {
        if (checkCollision(dateToCheck, timeToCheck, durationToCheck, selectedLesson?.id)) {
           alert("Collision detected! This time slot overlaps with another lesson.")
           return
        }
      }

      // NOTE: lessonData coming from form is "What the user typed" (e.g. 10:00).
      // Since we set viewTimezone to "UTC" by default, and our recurrence logic uses UTC,
      // we assume inputs are "Teacher's preferred time" which we store as is.
      // If we wanted full "Schedule in New York time", we'd need to reverse-convert here.
      // For simplicity/robustness given previous tasks: treat input as Reference/UTC time.
      
      if (selectedLesson) {
        // Editing existing lesson
        await api.updateLesson(selectedLesson.id, lessonData)
      } else if (generateRecurring && (lessonData as Lesson).recurrenceType !== "one-time") {
        // Generate recurring lessons
        const recurringLessons = generateRecurringLessons(lessonData as Omit<Lesson, "id" | "createdAt">)
        
        // OPTIONAL: Check collision for all? 
        // Iterate and check. If any collision, abort?
        const hasCollision = recurringLessons.some(l => checkCollision(l.date, l.time, l.duration))
        if (hasCollision) {
             const confirmSave = confirm("Some recurring lessons overlap with existing bookings. Save anyway?")
             if (!confirmSave) return
        }

        // Batch creation - much faster and reliability
        await api.createLessons(recurringLessons)
      } else {
        // Single lesson
        await api.createLesson(lessonData as Omit<Lesson, "id" | "createdAt">)
      }
      loadData()
      setFormOpen(false)
      setSelectedLesson(null)
    } catch (error) {
       console.error("Failed to save lesson:", error)
    }
  }


  const handleCompleteLesson = async (id: string) => {
    try {
      await api.updateLesson(id, { status: "completed" })
      loadData()
    } catch (error) {
      console.error("Failed to complete lesson:", error)
    }
  }

  const handleCancelLesson = async (id: string) => {
    try {
      await api.updateLesson(id, { status: "cancelled-teacher" })
      loadData()
    } catch (error) {
      console.error("Failed to cancel lesson:", error)
    }
  }

  const handleDuplicateLesson = async (lesson: Lesson) => {
    const nextWeek = new Date(lesson.date)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const duplicate: Omit<Lesson, "id" | "createdAt"> = {
      studentIds: lesson.studentIds,
      date: nextWeek.toISOString().split("T")[0],
      time: lesson.time,
      duration: lesson.duration,
      status: "upcoming",
      paymentStatus: lesson.paymentStatus,
      subject: lesson.subject,
      notes: "",
      recurrenceType: "one-time",
    }
    
    try {
      await api.createLesson(duplicate)
      loadData()
    } catch (error) {
      console.error("Failed to duplicate lesson:", error)
    }
  }

  const handleSavePayment = async (payment: Omit<Payment, "id" | "createdAt">, lessonCount: number) => {
    try {
      await api.createPayment(payment)
      
      // Add lessons to student's balance
      if (lessonCount > 0) {
        const student = students.find(s => s.id === payment.studentId)
        if (student) {
          const newBalance = (student.lessonBalance || 0) + lessonCount
          await api.updateStudent(student.id, { lessonBalance: newBalance })
        }
      }
      loadData()
      setPaymentFormOpen(false)
    } catch (error) {
      console.error("Failed to save payment:", error)
    }
  }

  const handleReschedule = (lesson: Lesson) => {
    setLessonToReschedule(lesson)
    setRescheduleOpen(true)
  }

  const handleConfirmReschedule = async (newDate: string, newTime: string, mode: "single" | "following", timezone: string) => {
    if (!lessonToReschedule) return

    // Collision Check
    // We check if the NEW slot collides with anything (excluding the lesson being rescheduled, obviously)
    if (checkCollision(newDate, newTime, lessonToReschedule.duration, lessonToReschedule.id)) {
        alert("Collision detected! This time slot overlaps with another lesson.")
        return
    }

    try {
      if (mode === "single") {
        // Just update this single lesson
        await api.updateLesson(lessonToReschedule.id, {
          date: newDate,
          time: newTime,
          status: "upcoming",
          timezone: timezone
        })
      } else if (mode === "following" && lessonToReschedule.recurrenceParentId) {
        // 1. Find all future lessons in this series
        // We need to fetch all lessons first? We have them in `lessons` state.
        // Important: Filter from `lessons` state might be stale if not careful, but usually ok.
        
        // Filter: Same parent ID, and date >= current lesson date
        const futureLessons = lessons.filter(l => 
          l.recurrenceParentId === lessonToReschedule.recurrenceParentId && 
          l.date >= lessonToReschedule.date &&
          l.status !== "cancelled-teacher" && // Don't resurrect cancelled lessons?
          l.status !== "cancelled-student"
        )
        
        // 2. Delete them
        await Promise.all(futureLessons.map(l => api.deleteLesson(l.id)))
        
        // 3. Generate new recurrence
        // New start date = newDate
        // We need to calculate how many we deleted or just continue until the original end date?
        // Let's continue until original recurrenceEndDate.
        
        if (lessonToReschedule.recurrenceEndDate) {
            const newSeriesData: Omit<Lesson, "id" | "createdAt"> = {
                ...lessonToReschedule,
                date: newDate,
                time: newTime,
                status: "upcoming",
                timezone: timezone,
                recurrenceParentId: Date.now().toString(), // New series ID to separate from past
            }
            
            // We use the helper we defined earlier
            const newLessons = generateRecurringLessons(newSeriesData)
            
            // Batch create
            await api.createLessons(newLessons)
        } else {
            // Should not happen for "following" mode as it implies recurrence, but if no end date?
            // Just move the single one if no end date (shouldn't be possible for weekly infinite without end date in our schema)
             await api.updateLesson(lessonToReschedule.id, {
                date: newDate,
                time: newTime,
                status: "upcoming",
                timezone: timezone
             })
        }
      }

      loadData()
      setRescheduleOpen(false)
      setLessonToReschedule(null)
    } catch (error) {
      console.error("Failed to reschedule:", error)
    }
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    setLessonToDelete(lesson)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (mode: "single" | "following") => {
    if (!lessonToDelete) return

    try {
      if (mode === "single") {
        await api.deleteLesson(lessonToDelete.id)
      } else if (mode === "following" && lessonToDelete.recurrenceParentId) {
         // Find future lessons
         const futureLessons = lessons.filter(l => 
          l.recurrenceParentId === lessonToDelete.recurrenceParentId && 
          l.date >= lessonToDelete.date &&
          (l.status !== "cancelled-teacher" && l.status !== "cancelled-student")
        )
        // Extract IDs 
        const idsToDelete = futureLessons.map(l => l.id)
        // Include the current one if not captured (it should be since date >= date, but just in case)
        if (!idsToDelete.includes(lessonToDelete.id)) {
            idsToDelete.push(lessonToDelete.id)
        }
        
        await api.deleteLessons(idsToDelete)
      }
      
      loadData()
      setDeleteDialogOpen(false)
      setLessonToDelete(null)
    } catch (error) {
        console.error("Failed to delete lesson:", error)
    }
  }

  const handleAcceptReschedule = async (requestId: string, slot: { date: string, time: string }) => {
    if (!selectedLesson) return
    try {
        // 1. Fetch the request to get the reason
        const requests = await api.getRescheduleRequests()
        const request = requests.find(r => r.id === requestId)
        
        // 2. Check if a penalty was applied (this is tricky as we don't store it in request, 
        // but we can infer it if we want, OR we can just check if status was requested < 4h before.
        // For simplicity, let's assume if it was late, we noted it? 
        // Actually, the student balance subtraction happened during REQUEST.
        // We should ideally know if they were charged. 
        // Let's check the timing of the ORIGINAL lesson.
        const originalLessonStart = new Date(`${selectedLesson.date}T${selectedLesson.time}`)
        // We don't have the "request emission time" easily here unless we look at request.createdAt
        const requestedAt = request ? new Date(request.createdAt) : new Date()
        const hoursDiff = (originalLessonStart.getTime() - requestedAt.getTime()) / (1000 * 60 * 60)
        const wasLate = hoursDiff < 4

        // 3. Update Lesson with new slot and reset status + AUDIT INFO
        await api.updateLesson(selectedLesson.id, {
            date: slot.date,
            time: slot.time,
            status: "upcoming",
            auditInfo: {
                rescheduledFrom: `${selectedLesson.date} ${selectedLesson.time}`,
                reason: request?.reason || "No reason provided",
                penaltyCharged: wasLate,
                actionTakenAt: new Date().toISOString()
            }
        })

        // 4. Mark request as approved
        await api.updateRescheduleRequest(requestId, { status: "approved" })

        // 5. Refresh data
        loadData()
        setDetailsOpen(false)
        alert("Lesson rescheduled. Historical data saved for proof.")
    } catch (error) {
        console.error("Failed to accept reschedule", error)
    }
  }

  const upcomingCount = lessons.filter((l) => l.status === "upcoming").length

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Calendar" subtitle={`${upcomingCount} upcoming lessons`} />
        <main className="p-4 lg:p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">Schedule and manage your lessons with ease.</p>
            <div className="flex gap-2 items-center">
              
              {/* Timezone Selector */}
              <div className="w-[280px]">
                <Select value={viewTimezone} onValueChange={setViewTimezone}>
                  <SelectTrigger>
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <SelectValue placeholder="Select Timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-px h-6 bg-border mx-2" />

              <Button variant="outline" onClick={() => setPaymentFormOpen(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
              <Button onClick={handleAddLesson}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Lesson
              </Button>
            </div>
          </div>

          <CalendarView
            lessons={adjustedLessons} // Use adjusted lessons here
            students={students}
            view={view}
            onViewChange={setView}
            onLessonClick={handleLessonClick}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            timezone={viewTimezone}
          />

          <LessonForm
            open={formOpen}
            onOpenChange={setFormOpen}
            lesson={selectedLesson}
            students={students}
            teacher={teacher}
            onSave={handleSaveLesson}
            onDelete={handleDeleteLesson}
            defaultDate={selectedDate.toISOString().split("T")[0]}
          />

          <LessonDetails
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            lesson={selectedLesson}
            students={students}
            onEdit={handleEditLesson}
            onComplete={handleCompleteLesson}
            onCancel={handleCancelLesson}
            onDuplicate={handleDuplicateLesson}
            onReschedule={handleReschedule}
            onAcceptReschedule={handleAcceptReschedule}
            onDelete={handleDeleteLesson}
            isPaidComputed={selectedLessonPaid}
            timezone={viewTimezone}
          />

          <PaymentForm
            open={paymentFormOpen}
            onOpenChange={setPaymentFormOpen}
            students={students}
            onSave={handleSavePayment}
          />
          
          <RescheduleDialog 
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            lesson={lessonToReschedule}
            students={students}
            onConfirm={handleConfirmReschedule}
          />

          <DeleteAlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            lesson={lessonToDelete}
          />
        </main>
      </div>
    </div>
  )
}
