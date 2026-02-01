"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import type { Lesson, Student } from "@/lib/types"

interface TodaysLessonsProps {
  lessons: Lesson[]
  students: Student[]
  onComplete: (id: string) => void
  onCancel: (id: string) => void
}

export function TodaysLessons({ lessons, students, onComplete, onCancel }: TodaysLessonsProps) {
  const getStudentName = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.fullName || "Unknown").join(", ")
  }

  const statusColors = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    "cancelled-student": "bg-red-100 text-red-700",
    "cancelled-teacher": "bg-orange-100 text-orange-700",
    rescheduled: "bg-purple-100 text-purple-700",
    "no-show": "bg-gray-100 text-gray-700",
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Today&apos;s Lessons</CardTitle>
        <Badge variant="secondary">{lessons.length} lessons</Badge>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No lessons scheduled for today</p>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-muted">
                    <span className="text-sm font-semibold">{lesson.time}</span>
                    <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{getStudentName(lesson.studentIds)}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{lesson.subject}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusColors[lesson.status]}`}>
                        {lesson.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                {lesson.status === "upcoming" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onComplete(lesson.id)}>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Complete
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onCancel(lesson.id)}>
                      <XCircle className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
