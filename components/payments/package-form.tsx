"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Package, Student } from "@/lib/types"

interface PackageFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  onSave: (pkg: Omit<Package, "id">) => void
}

export function PackageForm({ open, onOpenChange, students, onSave }: PackageFormProps) {
  const [formData, setFormData] = useState<Partial<Package>>({
    studentId: "",
    totalLessons: 4,
    remainingLessons: 4,
    amount: 0,
    purchaseDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    status: "active",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.studentId && formData.totalLessons && formData.amount) {
      onSave({
        ...formData,
        remainingLessons: formData.totalLessons,
      } as Omit<Package, "id">)
      onOpenChange(false)
      // Reset
      setFormData({
        studentId: "",
        totalLessons: 4,
        remainingLessons: 4,
        amount: 0,
        purchaseDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        status: "active",
      })
    }
  }

  const activeStudents = students.filter((s) => s.status === "active")

  // Calculate suggested price based on student's lesson price
  const selectedStudent = students.find((s) => s.id === formData.studentId)
  const suggestedPrice = selectedStudent ? selectedStudent.lessonPrice * (formData.totalLessons || 4) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Lesson Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student *</Label>
            <Select
              value={formData.studentId}
              onValueChange={(value) => setFormData({ ...formData, studentId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName} (${student.lessonPrice}/lesson)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalLessons">Number of Lessons *</Label>
              <Input
                id="totalLessons"
                type="number"
                min="1"
                value={formData.totalLessons || ""}
                onChange={(e) => {
                  const val = Number.parseInt(e.target.value) || 0
                  setFormData({
                    ...formData,
                    totalLessons: val,
                    remainingLessons: val,
                  })
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                  placeholder={suggestedPrice > 0 ? `Suggested: ${suggestedPrice}` : ""}
                  required
                />
              </div>
              {suggestedPrice > 0 && (
                <p className="text-xs text-muted-foreground">
                  Full price: ${suggestedPrice} ({formData.totalLessons} x ${selectedStudent?.lessonPrice})
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate || ""}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Package</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
