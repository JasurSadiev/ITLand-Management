"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Lesson, Student } from "@/lib/types"

interface WeekOverviewProps {
  lessons: Lesson[]
  students: Student[]
}

export function WeekOverview({ lessons, students }: WeekOverviewProps) {
  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })

  const getDayLessons = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return lessons.filter((l) => l.date === dateStr)
  }

  const formatDay = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[date.getDay()]
  }

  const formatDate = (date: Date) => {
    return date.getDate()
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Week Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dayLessons = getDayLessons(date)
            return (
              <div
                key={index}
                className={`flex flex-col items-center rounded-lg p-3 ${
                  isToday(date) ? "bg-primary/10 ring-2 ring-primary" : "bg-muted"
                }`}
              >
                <span className="text-xs text-muted-foreground">{formatDay(date)}</span>
                <span className={`text-lg font-semibold ${isToday(date) ? "text-primary" : "text-foreground"}`}>
                  {formatDate(date)}
                </span>
                <div className="mt-2 flex flex-col items-center gap-1">
                  {dayLessons.length > 0 ? (
                    <>
                      <span className="text-xs font-medium text-foreground">{dayLessons.length}</span>
                      <span className="text-xs text-muted-foreground">lessons</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">Free</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
