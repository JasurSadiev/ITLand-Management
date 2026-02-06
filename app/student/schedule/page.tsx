"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "@/components/header"
import { CalendarView } from "@/components/calendar/calendar-view"
import { Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Lesson, Student } from "@/lib/types"
import { toZonedTime, fromZonedTime, format } from "date-fns-tz"
import { StudentLessonDetails } from "@/components/calendar/student-lesson-details"
import { StudentRescheduleRequest } from "@/components/calendar/student-reschedule-request"

import { TIMEZONES } from "@/lib/constants"

export default function StudentSchedulePage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewTimezone, setViewTimezone] = useState("UTC")
  
  // Dialog States
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [isLateReschedule, setIsLateReschedule] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
        const match = document.cookie.match(new RegExp('(^| )student-id=([^;]+)'))
        const studentId = match ? match[2] : null

        if (!studentId) {
            window.location.href = "/login"
            return
        }

        const [allStudents, allLessons] = await Promise.all([
            api.getStudents(),
            api.getLessons()
        ])

        const currentStudent = allStudents.find(s => s.id === studentId)
        if (currentStudent) {
            setStudent(currentStudent)
            setViewTimezone(currentStudent.timezone || "UTC")
            const studentLessons = allLessons.filter(l => l.studentIds.includes(studentId))
            setLessons(studentLessons)
        }
    } catch (error) {
        console.error("Failed to load schedule", error)
    } finally {
        setLoading(false)
    }
  }

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

  const handleCancel = async (lesson: Lesson, late: boolean, reason: string) => {
    if (!student) return
    
    const confirmMsg = late 
        ? "This is a late cancellation. 1 credit will be deducted from your balance. Are you sure?"
        : "Are you sure you want to cancel this lesson?"
    
    if (confirm(confirmMsg)) {
        try {
            // 1. Update Lesson Status and reason
            await api.updateLesson(lesson.id, { 
                status: "cancelled-student",
                cancellationReason: reason
            })
            
            // 2. If late, deduct balance
            if (late) {
                await api.updateStudent(student.id, { 
                    lessonBalance: (student.lessonBalance || 0) - 1 
                })
            }
            
            setDetailsOpen(false)
            loadData()
        } catch (error) {
            console.error("Cancellation failed", error)
        }
    }
  }

  const handleRescheduleClick = (lesson: Lesson, late: boolean) => {
    setIsLateReschedule(late)
    setRescheduleOpen(true)
  }

  const handleConfirmReschedule = async (slots: { date: string, time: string }[], reason: string, timezone: string) => {
    if (!selectedLesson || !student) return

    try {
        // 1. Create Reschedule Request
        await api.createRescheduleRequest({
            lessonId: selectedLesson.id,
            studentId: student.id,
            proposedSlots: slots,
            reason: reason,
            status: "pending",
            timezone: timezone,
        })

        // 2. Update Lesson Status so teacher knows
        await api.updateLesson(selectedLesson.id, { status: "reschedule-requested" })

        // 3. Deduct balance if late
        if (isLateReschedule) {
            await api.updateStudent(student.id, {
                lessonBalance: (student.lessonBalance || 0) - 1
            })
        }

        setRescheduleOpen(false)
        setDetailsOpen(false)
        loadData()
        alert("Reschedule request submitted to your teacher.")
    } catch (error: any) {
        console.error("Reschedule failure", error)
        alert("Failed to submit reschedule request: " + (error.message || "Unknown error"))
    }
  }

  if (loading) return <div className="p-8">Loading schedule...</div>
  if (!student) return <div className="p-8">Access Denied</div>

  return (
    <>
      <Header 
        title="My Schedule" 
        subtitle={`Viewing in ${viewTimezone} time zone`} 
        user={{ name: student.fullName, email: student.contactEmail }}
      />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">Keep track of your upcoming lessons and requests.</p>
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
        </div>

        <CalendarView 
            lessons={adjustedLessons}
            students={[student]}
            view={view}
            onViewChange={setView}
            onLessonClick={(lesson) => {
                // Find original lesson (non-adjusted) for operations
                const original = lessons.find(l => l.id === lesson.id)
                setSelectedLesson(original || lesson)
                setDetailsOpen(true)
            }}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            timezone={viewTimezone}
        />

        <StudentLessonDetails 
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            lesson={selectedLesson}
            onCancel={handleCancel}
            onReschedule={handleRescheduleClick}
            timezone={viewTimezone}
        />

        <StudentRescheduleRequest 
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            lesson={selectedLesson}
            isLate={isLateReschedule}
            onConfirm={handleConfirmReschedule}
            initialTimezone={student?.timezone}
        />
      </main>
    </>
  )
}
