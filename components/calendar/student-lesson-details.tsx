"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Clock, 
  Calendar as CalendarIcon, 
  MapPin, 
  FileText, 
  User, 
  Video, 
  AlertTriangle,
  RefreshCw,
  XCircle
} from "lucide-react"
import type { Lesson, Student } from "@/lib/types"
import { format, differenceInHours } from "date-fns"
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz"
import { cn } from "@/lib/utils"

interface StudentLessonDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson | null
  onCancel: (lesson: Lesson, late: boolean, reason: string) => void
  onReschedule: (lesson: Lesson, late: boolean) => void
  timezone?: string
}

const CANCELLATION_REASONS = [
  "Illness / Health issue",
  "Family emergency",
  "Travel / Vacation",
  "School event / Exam",
  "Personal reasons",
  "Other"
]

export function StudentLessonDetails({
  open,
  onOpenChange,
  lesson,
  onCancel,
  onReschedule,
  timezone = "UTC",
}: StudentLessonDetailsProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [otherCancelReason, setOtherCancelReason] = useState("")

  if (!lesson) return null

  // Calculate "late" based on absolute time
  const lessonTz = lesson.timezone || "UTC"
  const lessonDateTimeUTC = fromZonedTime(`${lesson.date} ${lesson.time}`, lessonTz)
  const hoursUntilLesson = differenceInHours(lessonDateTimeUTC, new Date())
  const isLate = hoursUntilLesson < 4 && hoursUntilLesson >= 0

  // Adjusted time for display
  const zonedDate = toZonedTime(lessonDateTimeUTC, timezone)
  const displayDate = formatTz(zonedDate, "EEEE, MMMM do, yyyy", { timeZone: timezone })
  const displayTime = formatTz(zonedDate, "HH:mm", { timeZone: timezone })

  const handleConfirmCancel = () => {
    const finalReason = cancelReason === "Other" ? otherCancelReason : cancelReason
    if (!finalReason) {
        alert("Please provide a reason for cancellation.")
        return
    }
    onCancel(lesson, isLate, finalReason)
    setShowCancelConfirm(false)
    setCancelReason("")
    setOtherCancelReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Lesson Details</span>
            <Badge variant={
              lesson.status === "completed" ? "secondary" : 
              lesson.status.startsWith("cancelled") ? "destructive" : "default"
            }>
              {lesson.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Date & Time</p>
              <p className="text-sm text-muted-foreground">
                {displayDate}
              </p>
              <p className="text-sm text-muted-foreground">
                {displayTime} ({lesson.duration} min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Subject</p>
              <p className="text-sm text-muted-foreground">{lesson.subject || "No subject specified"}</p>
            </div>
          </div>

          {lesson.meetingLink && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <Video className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Meeting Link</p>
                <a 
                    href={lesson.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline break-all"
                >
                    {lesson.meetingLink}
                </a>
              </div>
            </div>
          )}

          {lesson.notes && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{lesson.notes}</p>
            </div>
          )}

          {lesson.auditInfo && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-700">
                <RefreshCw className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold">Reschedule History</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Originally scheduled for {lesson.auditInfo.rescheduledFrom}
              </p>
              <p className="text-xs text-muted-foreground">
                Reason: {lesson.auditInfo.reason}
              </p>
              {lesson.auditInfo.penaltyCharged && (
                <p className="text-[10px] font-medium text-amber-700 bg-amber-50 self-start px-1.5 py-0.5 rounded border border-amber-100 mt-1 inline-block">
                  Late Reschedule Penalty Applied
                </p>
              )}
            </div>
          )}

          {isLate && lesson.status === "upcoming" && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 border border-amber-200">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-xs">
                <strong>Late Action Warning:</strong> This lesson is in less than 4 hours. 
                Action will deduct 1 credit from your balance.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {lesson.status === "upcoming" && (
            <>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => setShowCancelConfirm(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Lesson
              </Button>
              <Button 
                variant="default" 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                onClick={() => onReschedule(lesson, isLate)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reason for Cancellation</DialogTitle>
            <DialogDescription>
                {isLate ? "⚠️ Late cancellation will deduct 1 credit." : "Please let us know why you are cancelling."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="cancel-reason">Required Reason</Label>
                <select 
                    id="cancel-reason"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                >
                    <option value="">Select a reason...</option>
                    {CANCELLATION_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                {cancelReason === "Other" && (
                    <Input 
                        placeholder="Specify reason..."
                        value={otherCancelReason}
                        onChange={(e) => setOtherCancelReason(e.target.value)}
                        className="mt-2"
                    />
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>Back</Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>Confirm Cancellation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
