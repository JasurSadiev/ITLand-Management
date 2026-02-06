"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Lesson, Student, RecurrenceType } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { AvailabilityPicker } from "./availability-picker"

import { TIMEZONES } from "@/lib/constants"

interface LessonFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson?: Lesson | null
  students: Student[]
  teacher?: User | null
  onSave: (lesson: Omit<Lesson, "id" | "createdAt"> | Partial<Lesson>, generateRecurring?: boolean) => void
  onDelete?: (lesson: Lesson) => void
  defaultDate?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

export function LessonForm({ open, onOpenChange, lesson, students, onSave, onDelete, defaultDate }: LessonFormProps) {
  const [formData, setFormData] = useState<Partial<Lesson>>({
    studentIds: [],
    date: defaultDate || new Date().toISOString().split("T")[0],
    time: "09:00",
    duration: 60,
    status: "upcoming",
    subject: "Math",
    paymentStatus: "unpaid",
    notes: "",
    recurrenceType: "one-time",
    recurrenceDays: [],
    isMakeup: false,
    meetingLink: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined)
  const [makeupDates, setMakeupDates] = useState<Date[]>([])
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData(lesson)
      if (lesson.recurrenceEndDate) {
        setRecurrenceEndDate(new Date(lesson.recurrenceEndDate))
      }
    } else {
      setFormData({
        studentIds: [],
        date: defaultDate || new Date().toISOString().split("T")[0],
        time: "10:00",
        duration: 60,
        status: "upcoming",
        paymentStatus: "unpaid",
        subject: "",
        notes: "",
        recurrenceType: "one-time",
        recurrenceDays: [],
        isMakeup: false,
      })
      setRecurrenceEndDate(undefined)
      setMakeupDates([])
    }
  }, [lesson, defaultDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.studentIds && formData.studentIds.length > 0) {
      const lessonData = {
        ...formData,
        recurrenceEndDate: recurrenceEndDate ? recurrenceEndDate.toISOString().split("T")[0] : undefined,
      }

      // For makeup lessons with specific dates
      if (formData.recurrenceType === "makeup" && makeupDates.length > 0) {
        // Save each makeup date as a separate lesson
        makeupDates.forEach((date) => {
          onSave({
            ...lessonData,
            date: date.toISOString().split("T")[0],
            isMakeup: true,
          }, false)
        })
      } else {
        // For recurring lessons, pass flag to generate instances
        const shouldGenerateRecurring = formData.recurrenceType !== "one-time" && !lesson
        onSave(lessonData, shouldGenerateRecurring)
      }
      
      onOpenChange(false)
    }
  }

  const toggleStudent = (studentId: string) => {
    const currentIds = formData.studentIds || []
    if (currentIds.includes(studentId)) {
      setFormData({ ...formData, studentIds: currentIds.filter((id) => id !== studentId) })
    } else {
      setFormData({ ...formData, studentIds: [...currentIds, studentId] })
    }
  }

  const toggleDay = (dayValue: number) => {
    const currentDays = formData.recurrenceDays || []
    if (currentDays.includes(dayValue)) {
      setFormData({ ...formData, recurrenceDays: currentDays.filter((d) => d !== dayValue) })
    } else {
      setFormData({ ...formData, recurrenceDays: [...currentDays, dayValue].sort() })
    }
  }

  const addMakeupDate = (date: Date | undefined) => {
    if (date && !makeupDates.some(d => d.toDateString() === date.toDateString())) {
      setMakeupDates([...makeupDates, date])
    }
    setCalendarOpen(false)
  }

  const removeMakeupDate = (dateToRemove: Date) => {
    setMakeupDates(makeupDates.filter(d => d.toDateString() !== dateToRemove.toDateString()))
  }

  const activeStudents = students.filter((s) => s.status === "active")

  // Get subjects from selected students
  const selectedSubjects = new Set<string>()
  formData.studentIds?.forEach((id) => {
    const student = students.find((s) => s.id === id)
    student?.subjects.forEach((sub) => selectedSubjects.add(sub))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit Lesson" : "Schedule New Lesson"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <div className="space-y-3">
            <Label>Student(s) *</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {activeStudents.map((student) => (
                <div key={student.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={formData.studentIds?.includes(student.id)}
                    onCheckedChange={() => toggleStudent(student.id)}
                  />
                  <label
                    htmlFor={`student-${student.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {student.fullName}
                    <span className="ml-2 text-xs text-muted-foreground">{student.subjects.join(", ")}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Type / Recurrence */}
          <div className="space-y-3">
            <Label>Lesson Type</Label>
            <Select
              value={formData.recurrenceType || "one-time"}
              onValueChange={(value: RecurrenceType) => setFormData({ ...formData, recurrenceType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lesson type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time Lesson</SelectItem>
                <SelectItem value="weekly">Regular Weekly (same day each week)</SelectItem>
                <SelectItem value="specific-days">Regular on Specific Days</SelectItem>
                <SelectItem value="makeup">Make-up Lessons (specific dates)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time - Show based on recurrence type */}
          {formData.recurrenceType === "one-time" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone || "UTC"}
                    onValueChange={(tz) => setFormData({ ...formData, timezone: tz })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Select
                    value={formData.duration?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 border rounded-lg bg-muted/20">
                <Label className="mb-2 block font-semibold text-indigo-700">Select Available Date & Time</Label>
                <AvailabilityPicker
                  teacherId="teacher"
                  duration={formData.duration || 60}
                  selectedDate={formData.date}
                  selectedTime={formData.time}
                  timezone={formData.timezone}
                  onSelect={(date, time) => setFormData({ ...formData, date, time })}
                />
              </div>
            </div>
          )}

          {/* Weekly Recurrence */}
          {formData.recurrenceType === "weekly" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-transparent",
                          !recurrenceEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone || "UTC"}
                    onValueChange={(tz) => setFormData({ ...formData, timezone: tz })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={formData.duration?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Lessons will repeat every week on the same day as the start date.
              </p>
            </div>
          )}

          {/* Specific Days Recurrence */}
          {formData.recurrenceType === "specific-days" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Days of Week *</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      size="sm"
                      variant={formData.recurrenceDays?.includes(day.value) ? "default" : "outline"}
                      className={cn(!formData.recurrenceDays?.includes(day.value) && "bg-transparent")}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.date || ""}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-transparent",
                          !recurrenceEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone || "UTC"}
                    onValueChange={(tz) => setFormData({ ...formData, timezone: tz })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={formData.duration?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Makeup Lessons - Specific Dates */}
          {formData.recurrenceType === "makeup" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Makeup Dates *</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Click to add dates
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={undefined}
                      onSelect={addMakeupDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {makeupDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {makeupDates.sort((a, b) => a.getTime() - b.getTime()).map((date) => (
                      <Badge key={date.toISOString()} variant="secondary" className="gap-1">
                        {format(date, "MMM d, yyyy")}
                        <button
                          type="button"
                          onClick={() => removeMakeupDate(date)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select
                    value={formData.timezone || "UTC"}
                    onValueChange={(tz) => setFormData({ ...formData, timezone: tz })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ""}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={formData.duration?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, duration: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            {selectedSubjects.size > 0 ? (
              <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(selectedSubjects).map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Enter subject"
                value={formData.subject || ""}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            )}
          </div>

          {/* Status - only show for editing or one-time */}
          {(lesson || formData.recurrenceType === "one-time") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Lesson["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled-student">Cancelled by Student</SelectItem>
                    <SelectItem value="cancelled-teacher">Cancelled by Teacher</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="no-show">No-show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value: Lesson["paymentStatus"]) => setFormData({ ...formData, paymentStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting-link">Meeting Link (Optional)</Label>
            <Input
              id="meeting-link"
              placeholder="https://zoom.us/j/..."
              value={formData.meetingLink || ""}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Post-lesson notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            {lesson && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (lesson && onDelete) onDelete(lesson)
                  onOpenChange(false)
                }}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="bg-transparent" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  !formData.studentIds?.length || 
                  (formData.recurrenceType === "makeup" && makeupDates.length === 0) ||
                  (formData.recurrenceType === "specific-days" && (!formData.recurrenceDays?.length))
                }
              >
                {lesson ? "Save Changes" : formData.recurrenceType === "one-time" ? "Schedule Lesson" : "Schedule Lessons"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
