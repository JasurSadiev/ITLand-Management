"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Lesson } from "@/lib/types"
import { format, parseISO } from "date-fns"
import { TIMEZONES } from "@/lib/constants"
import { AvailabilityPicker } from "./availability-picker"

interface StudentRescheduleRequestProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson | null
  isLate: boolean
  onConfirm: (slots: { date: string; time: string }[], reason: string, timezone: string) => void
  initialTimezone?: string
}

const RESCHEDULE_REASONS = [
  "Illness / Health issue",
  "Family emergency",
  "Travel / Vacation",
  "School event / Exam",
  "Internet / Technical issues",
  "Work conflict",
  "Other"
]

export function StudentRescheduleRequest({
  open,
  onOpenChange,
  lesson,
  isLate,
  onConfirm,
  initialTimezone,
}: StudentRescheduleRequestProps) {
  const [reason, setReason] = useState("")
  const [otherReason, setOtherReason] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)

  useEffect(() => {
    if (initialTimezone) {
      setTimezone(initialTimezone)
    } else {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [initialTimezone, open])

  if (!lesson) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSlot) {
        alert("Please pick an available time slot.")
        return
    }
    
    if (!reason) {
        alert("Please provide a reason for rescheduling.")
        return
    }

    const finalReason = reason === "Other" ? otherReason : reason
    if (reason === "Other" && !otherReason) {
        alert("Please specify the other reason.")
        return
    }

    onConfirm([selectedSlot], finalReason, timezone)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
          <DialogDescription>
            Choose a new time for your lesson. Available slots are shown based on your teacher's schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rescheduling</Label>
                <select 
                    id="reason"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                >
                    <option value="">Select a reason...</option>
                    {RESCHEDULE_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                {reason === "Other" && (
                    <Input 
                        placeholder="Please specify..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className="mt-2"
                        required
                    />
                )}
            </div>

            <div className="h-px bg-border my-2" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-lg">Pick a New Slot</Label>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                  {selectedSlot ? `${format(parseISO(selectedSlot.date), "MMM d")} at ${selectedSlot.time}` : "No slot selected"}
                </Badge>
              </div>

              <AvailabilityPicker 
                teacherId="teacher" 
                duration={lesson.duration}
                selectedDate={selectedSlot?.date}
                selectedTime={selectedSlot?.time}
                timezone={timezone}
                onSelect={(date, time) => setSelectedSlot({ date, time })}
              />
            </div>
          </div>

          {isLate && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-xs border border-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold mb-1">Late Reschedule Penalty</p>
                <p>Since this lesson starts in less than 4 hours, 1 credit will be deducted from your balance to process this request.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!selectedSlot} className="bg-indigo-600 hover:bg-indigo-700">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
