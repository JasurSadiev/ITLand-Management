"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Student } from "@/lib/types"
import { TIMEZONES } from "@/lib/constants"

interface StudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
  onSave: (student: Omit<Student, "id" | "createdAt" | "updatedAt"> | Partial<Student>) => void
}

const commonSubjects = [
  "Python",
  "JavaScript",
  "React",
  "Scratch",
  "Roblox",
  "Lua",
  "Java",
  "C++",
  "Data Science",
  "Web Dev",
]
const commonTags = ["Beginner", "Intermediate", "Advanced", "Exam Prep", "Kids", "Teen", "Adult", "Game Dev", "Web Dev"]

export function StudentForm({ open, onOpenChange, student, onSave }: StudentFormProps) {
  const [formData, setFormData] = useState<Partial<Student>>(
    student || {
      fullName: "",
      age: undefined,
      parentName: "",
      contactPhone: "",
      contactWhatsapp: "",
      contactEmail: "",
      password: "", // Initial password
      timezone: "America/New_York",
      lessonType: "1-on-1",
      subjects: [],
      lessonPrice: 50,
      paymentModel: "per-lesson",
      status: "active",
      notes: "",
      tags: [],
    },
  )

  useEffect(() => {
    if (student) {
      setFormData(student)
    } else {
      // Reset form if student is null (adding new student)
      setFormData({
        fullName: "",
        age: undefined,
        parentName: "",
        contactPhone: "",
        contactWhatsapp: "",
        contactEmail: "",
        password: "",
        timezone: "America/New_York",
        lessonType: "1-on-1",
        subjects: [],
        lessonPrice: 50,
        paymentModel: "per-lesson",
        status: "active",
        notes: "",
        tags: [],
      })
    }
  }, [student])

  const [newSubject, setNewSubject] = useState("")
  const [newTag, setNewTag] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  const addSubject = (subject: string) => {
    if (subject && !formData.subjects?.includes(subject)) {
      setFormData({ ...formData, subjects: [...(formData.subjects || []), subject] })
    }
    setNewSubject("")
  }

  const removeSubject = (subject: string) => {
    setFormData({ ...formData, subjects: formData.subjects?.filter((s) => s !== subject) })
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags?.includes(tag)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tag] })
    }
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name</Label>
                <Input
                  id="parentName"
                  value={formData.parentName || ""}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
          </div>

          {/* Contact & Login */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contact & Login Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email (Login) *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ""}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="text" // Visible text as requested
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Student login password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone || ""}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                <Input
                  id="contactWhatsapp"
                  value={formData.contactWhatsapp || ""}
                  onChange={(e) => setFormData({ ...formData, contactWhatsapp: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Lesson Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Lesson Settings</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Lesson Type</Label>
                <Select
                  value={formData.lessonType}
                  onValueChange={(value: "1-on-1" | "group") => setFormData({ ...formData, lessonType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-on-1">1-on-1</SelectItem>
                    <SelectItem value="group">Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonPrice">Lesson Price ($)</Label>
                <Input
                  id="lessonPrice"
                  type="number"
                  value={formData.lessonPrice || ""}
                  onChange={(e) => setFormData({ ...formData, lessonPrice: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Model</Label>
                <Select
                  value={formData.paymentModel}
                  onValueChange={(value: "per-lesson" | "package" | "monthly") =>
                    setFormData({ ...formData, paymentModel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per-lesson">Per Lesson</SelectItem>
                    <SelectItem value="package">Package</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "paused" | "finished") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Subjects</h3>
            <div className="flex flex-wrap gap-2">
              {formData.subjects?.map((subject) => (
                <Badge key={subject} variant="secondary" className="gap-1">
                  {subject}
                  <button type="button" onClick={() => removeSubject(subject)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSubject(newSubject)
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addSubject(newSubject)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {commonSubjects
                .filter((s) => !formData.subjects?.includes(s))
                .map((subject) => (
                  <Button
                    key={subject}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addSubject(subject)}
                  >
                    + {subject}
                  </Button>
                ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag(newTag)
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => addTag(newTag)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {commonTags
                .filter((t) => !formData.tags?.includes(t))
                .map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Button>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Private Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes about this student..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{student ? "Save Changes" : "Add Student"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
