"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TIMEZONES } from "@/lib/constants"
import type { Lesson, Student } from "@/lib/types"
import { AvailabilityPicker } from "./availability-picker"

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson | null
  students: Student[]
  onConfirm: (newDate: string, newTime: string, mode: "single" | "following", timezone: string) => Promise<void>
}

export function RescheduleDialog({ open, onOpenChange, lesson, students, onConfirm }: RescheduleDialogProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [timezone, setTimezone] = useState("UTC")
  const [mode, setMode] = useState<"single" | "following">("single")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (lesson) {
      setDate(lesson.date)
      setTime(lesson.time)
      // Default to student's timezone
      const student = students.find(s => lesson.studentIds.includes(s.id))
      if (student) {
        setTimezone(student.timezone || "UTC")
      } else {
        setTimezone(lesson.timezone || "UTC")
      }
      setMode("single")
    }
  }, [lesson, students])

  const handleConfirm = async () => {
    if (!date || !time) return
    
    try {
      setIsSubmitting(true)
      await onConfirm(date, time, mode, timezone)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to reschedule:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lesson) return null

  const isRecurring = !!lesson.recurrenceParentId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Reschedule Lesson</DialogTitle>
          <DialogDescription>
            Choose a new date and time for this lesson.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timezone" className="text-right whitespace-nowrap">
              Timezone
            </Label>
            <div className="col-span-3">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
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
          </div>

          <div className="border rounded-lg p-2 bg-muted/20">
             <AvailabilityPicker 
                teacherId="teacher"
                duration={lesson.duration}
                selectedDate={date}
                selectedTime={time}
                timezone={timezone}
                onSelect={(d, t) => {
                    setDate(d)
                    setTime(t)
                }}
             />
          </div>

          {isRecurring && (
            <div className="grid grid-cols-4 gap-4 mt-2">
              <Label className="text-right pt-2">Apply to</Label>
              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as "single" | "following")}
                className="col-span-3 flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="single" />
                  <Label htmlFor="single" className="font-normal">
                    This lesson only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="following" id="following" />
                  <Label htmlFor="following" className="font-normal">
                    This and all following lessons
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting || !date || !time}>
            {isSubmitting ? "Saving..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
