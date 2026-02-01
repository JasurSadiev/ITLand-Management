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
import { format } from "date-fns"
import { TIMEZONES } from "@/lib/constants"

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

  useEffect(() => {
    if (initialTimezone) {
      setTimezone(initialTimezone)
    } else {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [initialTimezone, open])
  const [slots, setSlots] = useState<{ date: string, time: string }[]>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" },
  ])

  if (!lesson) return null

  const handleUpdateSlot = (index: number, key: 'date' | 'time', value: string) => {
    const newSlots = [...slots]
    newSlots[index][key] = value
    setSlots(newSlots)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validSlots = slots.filter(s => s.date && s.time)
    if (validSlots.length === 0) {
        alert("Please provide at least one proposed time slot.")
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

    onConfirm(validSlots, finalReason, timezone)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
          <DialogDescription>
            Propose up to 3 alternative time slots. Your teacher will choose one to finalize the change.
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
                <p className="text-[10px] text-muted-foreground italic">Note: This reason will be recorded for future reference.</p>
            </div>

            <div className="h-px bg-border my-4" />
            
            <Label className="font-semibold block mb-2">Alternative Slots</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="timezone">Timezone *</Label>
              </div>
              <Select
                value={timezone}
                onValueChange={setTimezone}
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
            {slots.map((slot, index) => (
              <div key={index} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Proposed Option {index + 1}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`date-${index}`} className="sr-only">Date</Label>
                    <Input 
                      id={`date-${index}`}
                      type="date"
                      value={slot.date}
                      onChange={(e) => handleUpdateSlot(index, 'date', e.target.value)}
                      className="bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor={`time-${index}`} className="sr-only">Time</Label>
                      <Badge variant="outline" className="text-[10px] py-0 bg-indigo-50 text-indigo-700">
                        Local
                      </Badge>
                    </div>
                    <Select
                      value={slot.time?.split(":")[0]}
                      onValueChange={(hour) => handleUpdateSlot(index, 'time', `${hour}:00`)}
                    >
                      <SelectTrigger id={`time-${index}`} className="bg-transparent h-10">
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, "0")
                          const label = i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`
                          return <SelectItem key={hour} value={hour}>{label}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
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
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
