"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import type { Lesson } from "@/lib/types"

interface DeleteAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (mode: "single" | "following") => void
  lesson: Lesson | null
}

export function DeleteAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  lesson,
}: DeleteAlertDialogProps) {
  const [mode, setMode] = useState<"single" | "following">("single")

  if (!lesson) return null

  const isRecurring = lesson.recurrenceType !== "one-time"

  const handleConfirm = () => {
    onConfirm(mode)
    onOpenChange(false)
    // Reset mode for next time
    setTimeout(() => setMode("single"), 300)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this lesson? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRecurring && (
          <div className="py-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "single" | "following")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Delete this lesson only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="following" id="following" />
                <Label htmlFor="following">Delete this and all future lessons</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
