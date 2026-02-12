"use client"

import { useState, useEffect } from "react"
import { format, addDays, startOfDay, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar as CalendarIcon } from "lucide-react"
import { getAvailableSlots } from "@/lib/availability-utils"
import { api } from "@/lib/api"
import { Lesson, User } from "@/lib/types"

interface AvailabilityPickerProps {
  onSelect: (date: string, time: string) => void
  duration: number
  teacherId: string
  selectedDate?: string
  selectedTime?: string
  timezone?: string
  teacher?: User | null
  lessons?: Lesson[]
}

export function AvailabilityPicker({ 
  onSelect, 
  duration, 
  teacherId, 
  selectedDate: initDate, 
  selectedTime: initTime,
  timezone = "UTC",
  teacher: propTeacher,
  lessons: propLessons
}: AvailabilityPickerProps) {
  const [date, setDate] = useState<Date | undefined>(initDate ? parseISO(initDate) : new Date())
  const [slots, setSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [teacher, setTeacher] = useState<User | null>(propTeacher || null)
  const [lessons, setLessons] = useState<Lesson[]>(propLessons || [])

  useEffect(() => {
    if (propTeacher) setTeacher(propTeacher)
    if (propLessons) setLessons(propLessons)
  }, [propTeacher, propLessons])

  useEffect(() => {
    async function fetchData() {
      if (propTeacher && propLessons) return // Already have data
      
      const allLessons = await api.getLessons()
      const { store } = await import("@/lib/store")
      if (!propTeacher) setTeacher(store.getCurrentUser())
      if (!propLessons) setLessons(allLessons)
    }
    fetchData()
  }, [propTeacher, propLessons])

  useEffect(() => {
    if (date && teacher) {
      const dateStr = format(date, "yyyy-MM-dd")
      const available = getAvailableSlots(dateStr, duration, teacher, lessons, timezone)
      setSlots(available)
    }
  }, [date, teacher, lessons, duration, timezone])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      <div className="space-y-4">
        <label className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-indigo-600" />
          Select Date
        </label>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date < startOfDay(new Date()) || date > addDays(new Date(), 365)}
          className="rounded-md border shadow-sm"
        />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          Available Slots
        </label>
        <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted/20">
          {slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={initTime === slot && format(date!, "yyyy-MM-dd") === initDate ? "default" : "outline"}
                  className={`h-10 ${initTime === slot && format(date!, "yyyy-MM-dd") === initDate ? "bg-indigo-600" : "hover:border-indigo-600 hover:text-indigo-600"}`}
                  onClick={() => onSelect(format(date!, "yyyy-MM-dd"), slot)}
                >
                  {slot}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground italic">
                {date ? "No available slots for this date." : "Please select a date first."}
              </p>
            </div>
          )}
        </ScrollArea>
        <p className="text-[10px] text-muted-foreground italic">
          * Slots are based on your teacher's working hours and existing bookings.
        </p>
      </div>
    </div>
  )
}
