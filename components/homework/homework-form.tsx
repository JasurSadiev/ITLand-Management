"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fromZonedTime } from "date-fns-tz"
import type { Homework, Student, Lesson } from "@/lib/types"

interface HomeworkFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  homework?: Homework | null
  students: Student[]
  lessons: Lesson[]
  onSave: (homework: Omit<Homework, "id" | "createdAt" | "timezone"> & { timezone?: string, studentIds?: string[] }) => void
}

export function HomeworkForm({ open, onOpenChange, homework, students, lessons, onSave }: HomeworkFormProps) {
  const [formData, setFormData] = useState<Partial<Homework> & { studentIds?: string[], dueTime?: string }>({
    lessonId: "",
    studentId: "",
    studentIds: [],
    title: "",
    description: "",
    dueDate: "",
    dueTime: "10:00",
    timezone: "Europe/London",
    status: "assigned",
    feedback: "",
    attachments: [],
  })

  useEffect(() => {
    if (homework) {
      setFormData({
        ...homework,
        dueTime: homework.dueDate.includes("T") ? homework.dueDate.split("T")[1].substring(0, 5) : "10:00",
        dueDate: homework.dueDate.split("T")[0],
      })
    } else {
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 7)

      setFormData({
        lessonId: "",
        studentId: "",
        studentIds: [],
        title: "",
        description: "",
        dueDate: defaultDueDate.toISOString().split("T")[0],
        dueTime: "10:00",
        timezone: "Europe/London",
        status: "assigned",
        feedback: "",
        attachments: [],
      })
    }
  }, [homework])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isNew = !homework
    const hasStudents = isNew ? (formData.studentIds && formData.studentIds.length > 0) : !!formData.studentId
    
    if (hasStudents && formData.title && formData.dueDate) {
      // Create a date object in the selected timezone
      const localDeadlineStr = `${formData.dueDate} ${formData.dueTime || "10:00"}`
      const utcDate = fromZonedTime(localDeadlineStr, formData.timezone || "Europe/London")
      
      const saveData = {
        ...formData,
        dueDate: utcDate.toISOString(),
      } as any
      onSave(saveData)
      onOpenChange(false)
    }
  }

  const activeStudents = students.filter((s) => s.status === "active")

  // Get recent lessons for selected student
  const studentLessons = formData.studentId
    ? lessons
        .filter((l) => l.studentIds.includes(formData.studentId!) && l.status === "completed")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{homework ? "Edit Homework" : "Assign Homework"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!homework ? (
            <div className="space-y-2">
              <Label>Students * (Select one or more)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {activeStudents.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-muted rounded">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={formData.studentIds?.includes(student.id)}
                      onChange={(e) => {
                        const current = formData.studentIds || []
                        if (e.target.checked) {
                          setFormData({ ...formData, studentIds: [...current, student.id] })
                        } else {
                          setFormData({ ...formData, studentIds: current.filter(id => id !== student.id) })
                        }
                      }}
                    />
                    {student.fullName}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Student</Label>
              <Input value={students.find(s => s.id === formData.studentId)?.fullName || ""} disabled />
            </div>
          )}

          {studentLessons.length > 0 && (
            <div className="space-y-2">
              <Label>Related Lesson (optional)</Label>
              <Select
                value={formData.lessonId}
                onValueChange={(value) => setFormData({ ...formData, lessonId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {studentLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.date} - {lesson.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Complete Snake Game, Practice Loops"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed instructions for the homework..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time (Hour) *</Label>
              <Select
                value={formData.dueTime?.split(":")[0]}
                onValueChange={(hour) => setFormData({ ...formData, dueTime: `${hour}:00` })}
              >
                <SelectTrigger id="dueTime">
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

          <div className="space-y-2">
            <Label>Deadline Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/London">London (UTC/BST)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                {/* Could add more or use TIMEZONES list, but user emphasized London as default */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: Homework["status"]) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="checked">Checked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.status === "submitted" || formData.status === "checked") && (
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={formData.feedback || ""}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Your feedback on the homework..."
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{homework ? "Save Changes" : "Assign Homework"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
