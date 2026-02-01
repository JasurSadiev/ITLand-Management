"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import type { Lesson, Student } from "@/lib/types"

interface UnpaidLessonsProps {
  lessons: Lesson[]
  students: Student[]
  onMarkPaid: (lessonId: string) => void
}

export function UnpaidLessons({ lessons, students, onMarkPaid }: UnpaidLessonsProps) {
  const getStudentName = (studentIds: string[]) => {
    return studentIds.map((id) => students.find((s) => s.id === id)?.fullName || "Unknown").join(", ")
  }

  const getStudentPrice = (studentIds: string[]) => {
    const student = students.find((s) => s.id === studentIds[0])
    return student?.lessonPrice || 0
  }

  const unpaidCompleted = lessons.filter((l) => l.status === "completed" && l.paymentStatus === "unpaid")

  const totalUnpaid = unpaidCompleted.reduce((sum, l) => sum + getStudentPrice(l.studentIds), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unpaid Lessons</CardTitle>
        {unpaidCompleted.length > 0 && <span className="text-lg font-bold text-amber-600">${totalUnpaid} total</span>}
      </CardHeader>
      <CardContent>
        {unpaidCompleted.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">All lessons are paid!</p>
        ) : (
          <div className="space-y-2">
            {unpaidCompleted.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <div>
                  <p className="font-medium text-amber-900">{getStudentName(lesson.studentIds)}</p>
                  <p className="text-sm text-amber-700">
                    {lesson.date} - {lesson.subject} (${getStudentPrice(lesson.studentIds)})
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                  onClick={() => onMarkPaid(lesson.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Mark Paid
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
