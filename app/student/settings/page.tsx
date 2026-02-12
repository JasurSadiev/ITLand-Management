"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { PersonalizationCard } from "@/components/personalization-card"
import type { Student } from "@/lib/types"

export default function StudentSettingsPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    loadStudent()
  }, [])

  const loadStudent = async () => {
    try {
      const match = document.cookie.match(new RegExp('(^| )student-id=([^;]+)'))
      const studentId = match ? match[2] : null

      if (!studentId) {
        window.location.href = "/login"
        return
      }

      const currentStudent = await api.getStudentById(studentId)
      setStudent(currentStudent)
    } catch (error) {
      console.error("Failed to load student settings", error)
      toast.error("Failed to load account data")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsUpdating(true)
    try {
      // Fetch fresh student data to verify password (prevents session hijacking / outdated localStorage)
      const freshStudent = await api.getStudentById(student.id)
      
      if (formData.currentPassword !== freshStudent.password) {
        toast.error("Incorrect current password")
        setIsUpdating(false)
        return
      }

      await api.updateStudent(student.id, { password: formData.newPassword })
      
      // Update state
      setStudent({ ...freshStudent, password: formData.newPassword })
      
      toast.success("Password updated successfully!")
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Failed to update password:", error)
      toast.error("Failed to update password. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePreferences = async (updates: Partial<Student["preferences"]>) => {
    if (!student) return
    const updatedPreferences = { ...student.preferences, ...updates }
    const updatedStudent = { ...student, preferences: updatedPreferences }
    
    setStudent(updatedStudent)
    localStorage.setItem("currentStudent", JSON.stringify(updatedStudent))
    
    try {
      await api.updateStudent(student.id, { preferences: updatedPreferences as any })
      toast.success("Preferences updated")
    } catch (error) {
      console.error("Failed to sync preferences:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <Header title="Settings" subtitle="Manage your account preferences and security" />
      
      <main className="mx-auto max-w-2xl mt-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-5 w-5 text-indigo-600" />
              <CardTitle>Account Security</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdatePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <p>Ensure your new password uses at least 6 characters.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
              <Button type="submit" className="gap-2" disabled={isUpdating}>
                {isUpdating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>

        {student && (
          <div className="mt-8">
              <PersonalizationCard 
                  preferences={student.preferences || {}} 
                  onChange={(updates) => handleUpdatePreferences(updates as any)} 
              />
          </div>
        )}
      </main>
    </div>
  )
}
