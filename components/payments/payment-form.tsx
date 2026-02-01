"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { store } from "@/lib/store"
import type { Payment, Student } from "@/lib/types"

interface PaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
  onSave: (payment: Omit<Payment, "id" | "createdAt">, lessonCount: number) => void
  defaultStudentId?: string
}

export function PaymentForm({ open, onOpenChange, students, onSave, defaultStudentId }: PaymentFormProps) {
  const [formData, setFormData] = useState<Partial<Payment>>({
    studentId: defaultStudentId || "",
    amount: 0,
    method: "transfer",
    date: new Date().toISOString().split("T")[0],
    lessonIds: [],
    notes: "",
  })
  
  const [paymentType, setPaymentType] = useState<"count" | "monthly">("count")
  const [lessonCount, setLessonCount] = useState<number>(0)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)) // YYYY-MM

  useEffect(() => {
    if (defaultStudentId) {
      setFormData((prev) => ({ ...prev, studentId: defaultStudentId }))
    }
  }, [defaultStudentId])
  
  // Auto-calculate lessons when switching to monthly or changing month/student
  useEffect(() => {
    if (paymentType === "monthly" && formData.studentId && selectedMonth) {
      const lessons = store.getLessons()
      const [year, month] = selectedMonth.split("-").map(Number)
      
      const count = lessons.filter(l => {
        const d = new Date(l.date)
        return l.studentIds.includes(formData.studentId!) && 
               d.getFullYear() === year && 
               d.getMonth() === month - 1 &&
               l.status !== "cancelled-student" &&
               l.status !== "cancelled-teacher"
      }).length
      
      setLessonCount(count)
      
      // Update note to indicate monthly payment
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
      setFormData(prev => ({ ...prev, notes: `Payment for ${monthName}` }))
    }
  }, [paymentType, formData.studentId, selectedMonth])

  const selectedStudent = students.find((s) => s.id === formData.studentId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.studentId && formData.amount) {
      onSave(formData as Omit<Payment, "id" | "createdAt">, lessonCount)
      onOpenChange(false)
      // Reset form
      setFormData({
        studentId: "",
        amount: 0,
        method: "transfer",
        date: new Date().toISOString().split("T")[0],
        lessonIds: [],
        notes: "",
      })
      setLessonCount(0)
      setPaymentType("count")
    }
  }

  const activeStudents = students.filter((s) => s.status !== "finished")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
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
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Payment Type</Label>
            <RadioGroup 
              defaultValue="count" 
              value={paymentType} 
              onValueChange={(v) => setPaymentType(v as "count" | "monthly")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="type-count" />
                <Label htmlFor="type-count" className="font-normal">Number of Lessons</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="type-monthly" />
                <Label htmlFor="type-monthly" className="font-normal">Monthly</Label>
              </div>
            </RadioGroup>
          </div>

          {paymentType === "monthly" && (
             <div className="space-y-2">
               <Label>Select Month</Label>
               <Input 
                 type="month" 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(e.target.value)} 
               />
               <p className="text-xs text-muted-foreground">
                 Auto-calculated based on scheduled lessons for this month.
               </p>
             </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonCount">Number of Lessons *</Label>
              <Input
                id="lessonCount"
                type="number"
                min="0"
                placeholder="e.g., 10"
                value={lessonCount || ""}
                onChange={(e) => setLessonCount(Number.parseInt(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {lessonCount > 0 && selectedStudent && (
            <p className="text-sm text-muted-foreground">
              {lessonCount} lessons will be added to balance (${((formData.amount || 0) / lessonCount).toFixed(2)}/lesson)
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value: Payment["method"]) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Package of 10 lessons..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
