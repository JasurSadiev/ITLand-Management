import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { User, BookOpen, DollarSign, Edit, Copy, CheckCircle, XCircle, Calendar, CalendarClock, Trash, RefreshCw } from "lucide-react"
import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz"
import { api } from "@/lib/api"
import type { Lesson, Student } from "@/lib/types"
import { cn } from "@/lib/utils"

interface LessonDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson | null
  students: Student[]
  onEdit: () => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
  onDuplicate: (lesson: Lesson) => void
  onReschedule: (lesson: Lesson) => void
  onAcceptReschedule?: (requestId: string, slot: { date: string, time: string }) => void
  onDelete: (lesson: Lesson) => void
  isPaidComputed?: boolean
  timezone?: string
}

export function LessonDetails({
  open,
  onOpenChange,
  lesson,
  students,
  onEdit,
  onComplete,
  onCancel,
  onDuplicate,
  onReschedule,
  onAcceptReschedule,
  onDelete,
  isPaidComputed,
  timezone = "UTC",
}: LessonDetailsProps) {
  if (!lesson) return null

  // Adjusted time for display
  const lessonTz = lesson.timezone || "UTC"
  const lessonDateTimeUTC = fromZonedTime(`${lesson.date} ${lesson.time}`, lessonTz)
  const zonedDate = toZonedTime(lessonDateTimeUTC, timezone)
  
  const displayDate = formatTz(zonedDate, "EEEE, MMMM do, yyyy", { timeZone: timezone })
  const displayTime = formatTz(zonedDate, "HH:mm", { timeZone: timezone })

  const lessonStudents = lesson.studentIds.map((id) => students.find((s) => s.id === id)).filter(Boolean) as Student[]

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    "cancelled-student": "bg-red-100 text-red-700",
    "cancelled-teacher": "bg-orange-100 text-orange-700",
    rescheduled: "bg-purple-100 text-purple-700",
    "no-show": "bg-gray-100 text-gray-700",
    "reschedule-requested": "bg-indigo-100 text-indigo-700",
  }

  const paymentStatusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    unpaid: "bg-amber-100 text-amber-700",
    package: "bg-blue-100 text-blue-700",
  }

  // Determine the payment status to display
  const displayPaymentStatus = isPaidComputed !== undefined
    ? (isPaidComputed ? "paid" : "unpaid")
    : lesson.paymentStatus;

  const [rescheduleRequest, setRescheduleRequest] = useState<any>(null)

  useEffect(() => {
    if (open && lesson?.status === "reschedule-requested") {
      api.getRescheduleRequestByLessonId(lesson.id).then(setRescheduleRequest)
    } else {
      setRescheduleRequest(null)
    }
  }, [open, lesson])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Lesson Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status badges */}
          <div className="flex gap-2">
            <Badge className={statusColors[lesson.status]}>{lesson.status.replace("-", " ")}</Badge>
            <Badge className={paymentStatusColors[displayPaymentStatus]}>{displayPaymentStatus}</Badge>
          </div>

          {/* Reschedule Request UI */}
          {rescheduleRequest && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
               <div className="flex items-center justify-between text-indigo-700">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="font-semibold text-sm">Reschedule Requested</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white">Pending</Badge>
               </div>
               
               {rescheduleRequest.reason && (
                 <div className="bg-white/50 p-2 rounded border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-tight">Reason given by student:</p>
                    <p className="text-sm text-indigo-700 italic">"{rescheduleRequest.reason}"</p>
                 </div>
               )}

               <p className="text-xs text-indigo-600">The student has proposed the following dates. Choose one to approve.</p>
               <div className="grid gap-2">
                  {rescheduleRequest.proposedSlots.map((slot: any, idx: number) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="sm" 
                      className="justify-between bg-white hover:bg-indigo-100 hover:border-indigo-300 group"
                      onClick={() => onAcceptReschedule?.(rescheduleRequest.id, slot)}
                    >
                      <span className="text-xs">{slot.date} at {slot.time}</span>
                      <CheckCircle className="h-4 w-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  ))}
               </div>
            </div>
          )}

          {/* Audit Trail info */}
          {lesson.auditInfo && (
            <Card className="border-indigo-100 bg-indigo-50/20">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 mb-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Reschedule Proof</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>• Originally: <span className="font-medium">{lesson.auditInfo.rescheduledFrom}</span></p>
                  <p>• Reason: <span className="font-medium">{lesson.auditInfo.reason}</span></p>
                  <p>• Charged: <span className={cn("font-medium", lesson.auditInfo.penaltyCharged ? "text-amber-700" : "text-emerald-700")}>
                    {lesson.auditInfo.penaltyCharged ? "Yes (Late Penalty)" : "No (Early Action)"}
                  </span></p>
                  {lesson.auditInfo.actionTakenAt && (
                    <p>• Action on: <span>{new Date(lesson.auditInfo.actionTakenAt).toLocaleDateString()}</span></p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {lesson.status === "cancelled-student" && lesson.cancellationReason && (
             <Card className="border-red-100 bg-red-50/20">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-red-800 uppercase mb-1">Cancellation Reason:</p>
                <p className="text-sm text-red-700">"{lesson.cancellationReason}"</p>
              </CardContent>
             </Card>
          )}

          {/* Main Info */}
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {displayDate}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {displayTime} - {lesson.duration} minutes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{lessonStudents.map((s) => s.fullName).join(", ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {lesson.studentIds.length > 1 ? "Group Lesson" : "1-on-1 Lesson"}
                  </p>
                </div>
              </div>

              {lesson.subject && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{lesson.subject}</p>
                    <p className="text-sm text-muted-foreground">Subject</p>
                  </div>
                </div>
              )}

              {lessonStudents[0] && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">${lessonStudents[0].lessonPrice}</p>
                    <p className="text-sm text-muted-foreground">Lesson Price</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lesson.notes && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <p className="text-sm">{lesson.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {lesson.status === "upcoming" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onComplete(lesson.id)
                    onOpenChange(false)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive bg-transparent"
                  onClick={() => {
                    onCancel(lesson.id)
                    onOpenChange(false)
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReschedule(lesson)
                    onOpenChange(false)
                  }}
                >
                  <CalendarClock className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDuplicate(lesson)
                    onOpenChange(false)
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive bg-transparent border-destructive/20 hover:bg-destructive/10"
                  onClick={() => {
                    onDelete(lesson)
                    onOpenChange(false)
                  }}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Edit Button */}
          <Button className="w-full" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lesson
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
