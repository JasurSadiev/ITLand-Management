"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react"
import { toZonedTime } from "date-fns-tz"
import { useMemo, useState, useEffect } from "react"
import { format, getDay, parse } from "date-fns"
import type { Lesson, Student, User } from "@/lib/types"
import { store } from "@/lib/store"

interface CalendarViewProps {
  lessons: Lesson[]
  students: Student[]
  view: "day" | "week" | "month"
  onViewChange: (view: "day" | "week" | "month") => void
  onLessonClick: (lesson: Lesson, isPaid: boolean) => void
  selectedDate: Date
  onDateChange: (date: Date) => void
  timezone?: string
}

const CurrentTimeLine = ({ timezone = "UTC" }: { timezone?: string }) => {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const zonedNow = toZonedTime(now, timezone)
    const minutesSinceMidnight = zonedNow.getHours() * 60 + zonedNow.getMinutes()
    const topOffset = (minutesSinceMidnight / 60) * 64 // 64px per hour slot

    return (
        <div 
            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: `${topOffset}px` }}
        >
            <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
            <div className="h-0.5 flex-1 bg-red-500" />
        </div>
    )
}

export function CalendarView({
  lessons,
  students,
  view,
  onViewChange,
  onLessonClick,
  selectedDate,
  onDateChange,
  timezone = "UTC",
}: CalendarViewProps) {
  const [teacher, setTeacher] = useState<User | null>(null)

  useEffect(() => {
    setTeacher(store.getCurrentUser())
  }, [])

  const isTimeBlocked = (date: Date, timeStr: string) => {
    if (!teacher) return false
    
    const dayOfWeek = getDay(date)
    const dateStr = format(date, "yyyy-MM-dd")
    
    // Check blackout slots
    const isBlackout = teacher.blackoutSlots?.some(bs => 
      bs.date === dateStr && timeStr >= bs.startTime && timeStr < bs.endTime
    )
    if (isBlackout) return true

    // Check working hours
    const dayWorkingHours = teacher.workingHours?.filter(wh => wh.dayOfWeek === dayOfWeek && wh.active) || []
    if (dayWorkingHours.length === 0) return true // No working hours = blocked

    const isWorking = dayWorkingHours.some(wh => 
      timeStr >= wh.startTime && timeStr < wh.endTime
    )
    
    return !isWorking
  }

  const getStudentName = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.fullName || "Unknown").join(", ")
  }

  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  const handleLessonClick = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonFormOpen(true)
  }

  // Find the LessonForm in the parent or usage - wait, let me check where it is rendered.
  // Simple logic: first N lessons (chronologically) are paid where N = lessonBalance
  const lessonPaymentStatus = useMemo(() => {
    const statusMap = new Map<string, "paid" | "unpaid">()
    
    // Group lessons by student and sort by date
    const lessonsByStudent = new Map<string, Lesson[]>()
    
    for (const lesson of lessons) {
      // Skip cancelled lessons - mark them based on original status
      if (lesson.status === "cancelled-student" || lesson.status === "cancelled-teacher") {
        statusMap.set(lesson.id, lesson.paymentStatus === "paid" ? "paid" : "unpaid")
        continue
      }
      
      for (const studentId of lesson.studentIds) {
        if (!lessonsByStudent.has(studentId)) {
          lessonsByStudent.set(studentId, [])
        }
        lessonsByStudent.get(studentId)!.push(lesson)
      }
    }
    
    // For each student, use their lessonBalance to determine paid/unpaid
    for (const [studentId, studentLessons] of lessonsByStudent) {
      const student = students.find(s => s.id === studentId)
      let balance = student?.lessonBalance || 0
      
      // Sort lessons by date (oldest first) - earlier lessons consume balance first
      const sortedLessons = [...studentLessons].sort((a, b) => 
        new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
      )
      
      // Assign payment status: first N lessons are paid, rest unpaid
      for (const lesson of sortedLessons) {
        // If already explicitly marked as paid, keep it
        if (lesson.paymentStatus === "paid") {
          statusMap.set(lesson.id, "paid")
          continue
        }
        
        // Use balance to determine paid/unpaid
        if (balance > 0) {
          statusMap.set(lesson.id, "paid")
          balance--
        } else {
          statusMap.set(lesson.id, "unpaid")
        }
      }
    }
    
    return statusMap
  }, [lessons, students])

  const getPaymentIcon = (lessonId: string) => {
    const status = lessonPaymentStatus.get(lessonId)
    
    if (status === "paid") {
      return <DollarSign className="h-3 w-3 text-emerald-600" />
    }
    return <DollarSign className="h-3 w-3 text-red-500" />
  }

  const getPaymentBadge = (lessonId: string) => {
    const status = lessonPaymentStatus.get(lessonId)
    
    if (status === "paid") {
      return <Badge variant="outline" className="text-[10px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">Paid</Badge>
    }
    return <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-50 text-red-700 border-red-200">Unpaid</Badge>
  }

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500",
    completed: "bg-emerald-500",
    "cancelled-student": "bg-rose-500",
    "cancelled-teacher": "bg-rose-500",
    rescheduled: "bg-purple-500",
    "no-show": "bg-gray-500",
    "reschedule-requested": "bg-indigo-500",
  }

  const statusBgColors: Record<string, string> = {
    upcoming: "bg-blue-50 border-blue-200 text-blue-900",
    completed: "bg-emerald-50 border-emerald-200 text-emerald-900",
    "cancelled-student": "bg-rose-50 border-rose-200 text-rose-900 opacity-70",
    "cancelled-teacher": "bg-rose-50 border-rose-200 text-rose-900 opacity-70",
    rescheduled: "bg-purple-100 border-purple-200 text-purple-700",
    "no-show": "bg-gray-100 border-gray-200 text-gray-700",
    "reschedule-requested": "bg-indigo-100 border-indigo-200 text-indigo-700",
    }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getWeekDays = (date: Date) => {
    const days: Date[] = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      days.push(d)
    }
    return days
  }

  const getLessonsForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`
    return lessons.filter((l) => l.date === dateStr)
  }

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate)
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + direction * 7)
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    onDateChange(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i // Start at 00:00
    return `${hour.toString().padStart(2, "0")}:00`
  })

  // Day View
  if (view === "day") {
    const dayLessons = getLessonsForDate(selectedDate)

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold">{formatDateShort(selectedDate)}</h2>
            {isToday(selectedDate) && <Badge>Today</Badge>}
          </div>
          <div className="flex gap-1">
            {(["day", "week", "month"] as const).map((v) => (
              <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" onClick={() => onViewChange(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Day Schedule */}
        <Card className="p-4 relative">
          <div className="relative space-y-1">
            {isToday(selectedDate) && <CurrentTimeLine timezone={timezone} />}
            {timeSlots.map((time) => {
              const hourStr = time.split(":")[0]
              const lessonsAtTime = dayLessons.filter((l) => l.time.startsWith(`${hourStr}:`))
              return (
                <div key={time} className="flex min-h-[60px] border-t border-border">
                  <div className="w-20 py-2 text-sm text-muted-foreground">{time}</div>
                  <div className="flex-1 py-1">
                    {lessonsAtTime.map((lesson) => (
                      <button
                        key={lesson.id}
                        className={`w-full rounded-lg border p-3 text-left transition-colors hover:opacity-80 ${statusBgColors[lesson.status]}`}
                        onClick={() => onLessonClick(lesson, lessonPaymentStatus.get(lesson.id) === "paid")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${statusColors[lesson.status]}`} />
                            <span className={cn("font-medium", lesson.status.startsWith("cancelled") && "line-through")}>
                                {getStudentName(lesson.studentIds)}
                            </span>
                            {lesson.isMakeup && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">Makeup</Badge>
                            )}
                          </div>
                          {getPaymentBadge(lesson.id)}
                        </div>
                        <div className="mt-1 text-sm opacity-75">
                          {lesson.subject} - {lesson.duration}min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Payment Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Unpaid</span>
          </div>
        </div>
      </div>
    )
  }

  // Week View
  if (view === "week") {
    const weekDays = getWeekDays(selectedDate)

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-semibold">
              {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
              {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h2>
          </div>
          <div className="flex gap-1">
            {(["day", "week", "month"] as const).map((v) => (
              <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" onClick={() => onViewChange(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Week Grid */}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-8">
            {/* Time column */}
            <div className="border-r border-border">
              <div className="h-16 border-b border-border" />
              {timeSlots.map((time) => (
                <div key={time} className="h-16 border-b border-border px-2 py-1 text-xs text-muted-foreground">
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayLessons = getLessonsForDate(day)
              return (
                <div key={day.toISOString()} className="border-r border-border last:border-r-0">
                  {/* Day header */}
                  <div
                    className={`flex h-16 flex-col items-center justify-center border-b border-border ${isToday(day) ? "bg-primary/10" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""}`}>
                      {day.getDate()}
                    </span>
                  </div>
                  {/* Time slots */}
                  <div className="relative">
                    {isToday(day) && <CurrentTimeLine timezone={timezone} />}
                    {timeSlots.map((time) => {
                        const hourStr = time.split(":")[0]
                        const lessonsAtTime = dayLessons.filter((l) => l.time.startsWith(`${hourStr}:`))
                        const isBlocked = isTimeBlocked(day, time)
                        
                        return (
                        <div key={time} className={cn(
                            "relative h-16 border-b border-border p-0.5",
                            isBlocked && "bg-muted/30"
                        )}>
                            {isBlocked && !lessonsAtTime.length && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <span className="text-[8px] font-bold uppercase rotate-45">Blocked</span>
                                </div>
                            )}
                            {lessonsAtTime.map((lesson) => (
                            <button
                                key={lesson.id}
                                className={cn(
                                    "w-full rounded p-1 text-left text-xs transition-colors hover:opacity-80",
                                    statusBgColors[lesson.status]
                                )}
                                onClick={() => onLessonClick(lesson, lessonPaymentStatus.get(lesson.id) === "paid")}
                            >
                                <div className="flex items-center justify-between gap-0.5">
                                <div className="flex items-center gap-1 min-w-0">
                                    <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors[lesson.status]}`} />
                                    <span className={cn("truncate font-medium", lesson.status.startsWith("cancelled") && "line-through")}>
                                        {getStudentName(lesson.studentIds)}
                                    </span>
                                </div>
                                {getPaymentIcon(lesson.id)}
                                </div>
                            </button>
                            ))}
                        </div>
                        )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Payment Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-500" />
            <span className="text-muted-foreground">Unpaid</span>
          </div>
        </div>
      </div>
    )
  }

  // Month View
  const days = getDaysInMonth(selectedDate)
  const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="bg-transparent" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold">{formatDate(selectedDate)}</h2>
        </div>
        <div className="flex gap-1">
          {(["day", "week", "month"] as const).map((v) => (
            <Button key={v} variant={view === v ? "default" : "ghost"} size="sm" onClick={() => onViewChange(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Month Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-px">
          {/* Week day headers */}
          {weekDayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[100px] rounded-lg bg-muted/30 p-2" />
            }

            const dayLessons = getLessonsForDate(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] rounded-lg border p-2 ${isCurrentDay ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <div className={`text-sm font-medium ${isCurrentDay ? "text-primary" : "text-foreground"}`}>
                  {day.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayLessons.slice(0, 3).map((lesson) => (
                    <button
                      key={lesson.id}
                      className={`w-full rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80 ${statusBgColors[lesson.status]}`}
                      onClick={() => onLessonClick(lesson, lessonPaymentStatus.get(lesson.id) === "paid")}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors[lesson.status]}`} />
                          <span className="truncate">{lesson.time}</span>
                        </div>
                        {getPaymentIcon(lesson.id)}
                      </div>
                    </button>
                  ))}
                  {dayLessons.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayLessons.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legends */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-medium">Status:</span>
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
              <span className="text-muted-foreground capitalize">{status.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-medium">Payment:</span>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="text-muted-foreground">Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-red-500" />
          <span className="text-muted-foreground">Unpaid</span>
        </div>
      </div>
    </div>
  )
}
