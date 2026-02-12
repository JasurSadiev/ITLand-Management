"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Lesson, Student, User } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, ArrowRight, Globe } from "lucide-react"
import { AvailabilityPicker } from "@/components/calendar/availability-picker"
import { format, isAfter, startOfToday } from "date-fns"
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz"
import { cn } from "@/lib/utils"
import { TIMEZONES } from "@/lib/constants"

export default function StudentReschedulePortal() {
  const params = useParams()
  const studentId = params.id as string
  const [student, setStudent] = useState<Student | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [teacher, setTeacher] = useState<User | null>(null)
  const [allLessons, setAllLessons] = useState<Lesson[]>([]) // For global availability check
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewTimezone, setViewTimezone] = useState("UTC")

  // Flow State
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    async function loadPortalData() {
      try {
        const [s, l, t, allL] = await Promise.all([
          api.getStudentById(studentId),
          api.getLessons({ studentId }),
          api.getTeacherAvailability(),
          api.getLessons()
        ])
        setStudent(s)
        if (s.timezone) setViewTimezone(s.timezone)
        setLessons(l
          .filter(lesson => 
            lesson.status === "upcoming" && 
            isAfter(new Date(lesson.date), startOfToday())
          )
          .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
        )
        setTeacher(t)
        setAllLessons(allL)
      } catch (err: any) {
        console.error("Failed to load portal:", err)
        setError("Unable to load the rescheduling portal. Please contact your teacher.")
      } finally {
        setLoading(false)
      }
    }
    if (studentId) loadPortalData()
  }, [studentId])

  const adjustedLessons = useMemo(() => {
    return lessons.map(lesson => {
      const lessonTimezone = lesson.timezone || "UTC"
      const localDate = fromZonedTime(`${lesson.date} ${lesson.time}`, lessonTimezone)
      const zonedDate = toZonedTime(localDate, viewTimezone)
      
      return {
        ...lesson,
        date: formatTz(zonedDate, "yyyy-MM-dd", { timeZone: viewTimezone }),
        time: formatTz(zonedDate, "HH:mm", { timeZone: viewTimezone })
      }
    })
  }, [lessons, viewTimezone])

  const handleConfirmReschedule = async () => {
    if (!selectedLesson || !newDate || !newTime) return

    try {
      setIsSubmitting(true)
      
      const auditInfo = {
        rescheduledFrom: `${selectedLesson.date} at ${selectedLesson.time}`,
        reason: "Rescheduled via parent portal link",
        actionTakenAt: new Date().toISOString()
      }

      await api.updateLesson(selectedLesson.id, {
        date: newDate,
        time: newTime,
        status: "upcoming",
        auditInfo: auditInfo,
        timezone: viewTimezone
      })

      setIsSuccess(true)
    } catch (err: any) {
      console.error("Reschedule failed:", err)
      alert("Failed to reschedule. Please try again or contact the teacher.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium">Opening Portal...</p>
        </div>
    </div>
  )

  if (error || !student) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full border-red-100">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <CardTitle>Access Error</CardTitle>
          <CardDescription>{error || "Student record not found."}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="text-sm text-muted-foreground italic">
                Please ensure you have the correct link provided by your teacher.
            </p>
        </CardContent>
      </Card>
    </div>
  )

  if (isSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 animate-in fade-in zoom-in duration-500">
      <Card className="max-w-md w-full border-emerald-100 shadow-xl shadow-emerald-500/10">
        <CardHeader className="text-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Successfully Rescheduled!</CardTitle>
          <CardDescription className="text-base pt-2">
            The lesson has been updated on the teacher's calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-emerald-700 font-medium">New Schedule</span>
                <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-700">Confirmed</Badge>
             </div>
             <p className="text-lg font-bold text-emerald-900">{format(new Date(newDate), "EEEE, MMM do")}</p>
             <p className="text-lg font-bold text-emerald-900">{newTime}</p>
             <p className="text-[10px] text-emerald-600 italic">Confirmed in {TIMEZONES.find(t => t.value === viewTimezone)?.label || viewTimezone}</p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            You can now close this window.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 md:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Reschedule Portal</h1>
            <p className="text-muted-foreground text-lg">
              Manage lessons for <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">{student.fullName}</span>
            </p>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 bg-background/50 border border-border px-3 py-1.5 rounded-full shadow-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Viewing in:</span>
              <Select value={viewTimezone} onValueChange={setViewTimezone}>
                <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-xs font-bold focus:ring-0 w-[180px]">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-xs">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Step 1: Lesson Selection */}
        {!selectedLesson ? (
          <Card className="border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Choose a Lesson to Reschedule
              </CardTitle>
              <CardDescription>Select one of the upcoming sessions below.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {adjustedLessons.length > 0 ? (
                  adjustedLessons.map((lesson) => (
                    <div 
                        key={lesson.id} 
                        className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer"
                        onClick={() => setSelectedLesson(lesson)}
                    >
                      <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                           <p className="font-bold text-foreground">
                             {format(new Date(lesson.date), "EEEE, MMM do, yyyy")}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             {lesson.time} ({lesson.duration} min) • {lesson.subject || "Coding Lesson"}
                           </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                        Reschedule <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <p className="text-muted-foreground italic">No upcoming lessons found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Step 2 & 3: Selection and Confirmation */
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                    setSelectedLesson(null)
                    setNewDate("")
                    setNewTime("")
                }}
                className="hover:bg-background h-8"
            >
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Change Selected Lesson
            </Button>

            <Card className="border-primary/20 shadow-lg shadow-primary/5">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">Rescheduling Lesson</CardTitle>
                            <CardDescription>Select a new date and time from the available slots.</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-white border-primary/20 text-primary font-bold">
                            {selectedLesson.duration} min
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        {/* Current Schedule Summary */}
                        <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Currently scheduled for <span className="font-bold text-foreground">{format(new Date(selectedLesson.date), "EEEE, MMM do")}</span> at <span className="font-bold text-foreground">{selectedLesson.time}</span>
                            </p>
                        </div>

                        {/* Availability Picker */}
                        <div className="border rounded-xl p-4 bg-background">
                            <AvailabilityPicker 
                                teacherId="teacher"
                                duration={selectedLesson.duration}
                                selectedDate={newDate}
                                selectedTime={newTime}
                                timezone={viewTimezone}
                                teacher={teacher}
                                lessons={allLessons}
                                onSelect={(d, t) => {
                                    setNewDate(d)
                                    setNewTime(t)
                                }}
                            />
                        </div>

                        {/* Confirmation Bar */}
                        <div className={cn(
                            "p-6 rounded-2xl border-2 transition-all duration-300",
                            newDate && newTime 
                                ? "bg-primary/5 border-primary shadow-lg shadow-primary/5 scale-[1.02]" 
                                : "bg-muted/10 border-dashed border-border"
                        )}>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">New Requested Slot</p>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        {newDate ? format(new Date(newDate), "EEEE, MMM do") : "---"}
                                        <span className="text-primary mx-1">@</span>
                                        {newTime ? newTime : "---"}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                      <Globe className="h-3 w-3" /> Times shown in {TIMEZONES.find(t => t.value === viewTimezone)?.label || viewTimezone}
                                    </p>
                                </div>
                                <Button 
                                    className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
                                    disabled={!newDate || !newTime || isSubmitting}
                                    onClick={handleConfirmReschedule}
                                >
                                    {isSubmitting ? "Processing..." : "Confirm & Reschedule"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <p className="text-[10px] text-muted-foreground text-center italic max-w-lg mx-auto">
                * By confirming, you agree to move this session to the selected slot. The teacher will be notified automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
