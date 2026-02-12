"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { HomeworkStats } from "@/components/homework/homework-stats"
import { HomeworkList } from "@/components/homework/homework-list"
import { HomeworkForm } from "@/components/homework/homework-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { Student, Lesson, Homework } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function HomeworkPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [mounted, setMounted] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [studentsData, lessonsData, homeworkData] = await Promise.all([
        api.getStudents(),
        api.getLessons(),
        api.getHomework(),
      ])
      setStudents(studentsData)
      setLessons(lessonsData)
      setHomework(homeworkData)
    } catch (error) {
      console.error("Failed to load homework data:", error)
    }
  }

  if (!mounted) {
    return null
  }

  const handleAddHomework = () => {
    setSelectedHomework(null)
    setFormOpen(true)
  }

  const handleEditHomework = (hw: Homework) => {
    setSelectedHomework(hw)
    setFormOpen(true)
  }

  const handleSaveHomework = async (data: any) => {
    try {
      console.log("Saving homework with data:", data)
      if (selectedHomework) {
        // Edit existing
        await api.updateHomework(selectedHomework.id, data)
        toast.success("Homework updated successfully")
      } else if (data.studentIds && data.studentIds.length > 0) {
        // Batch create new
        const assignments = data.studentIds.map((studentId: string) => ({
          studentId,
          lessonId: data.lessonId || null,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          timezone: data.timezone,
          status: "assigned" as const,
          attachments: [],
        }))
        console.log("Creating homework assignments:", assignments)
        await api.createHomeworks(assignments)
        toast.success(`Homework assigned to ${data.studentIds.length} students`)
      }
      loadData()
      setFormOpen(false)
      setSelectedHomework(null)
    } catch (error: any) {
      console.error("Failed to save homework:", error)
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        full: JSON.stringify(error, null, 2)
      })
      toast.error(`Failed to save homework: ${error?.message || error?.code || "Unknown error"}`)
    }
  }

  const handleUpdateStatus = async (id: string, status: Homework["status"]) => {
    try {
      await api.updateHomework(id, { status })
      toast.success(`Homework status updated to ${status}`)
      loadData()
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleDeleteHomework = async (id: string) => {
    if (confirm("Delete this homework?")) {
      try {
        await api.deleteHomework(id)
        toast.success("Homework deleted")
        loadData()
      } catch (error) {
        console.error("Failed to delete homework:", error)
        toast.error("Failed to delete homework")
      }
    }
  }

  const handleExtendHomework = async (id: string, days: number) => {
    const hwItem = homework.find(h => h.id === id)
    if (!hwItem) return
    
    try {
      const newDate = new Date(hwItem.dueDate)
      newDate.setDate(newDate.getDate() + days)
      await api.updateHomework(id, { dueDate: newDate.toISOString() })
      loadData()
    } catch (error) {
      console.error("Failed to extend homework:", error)
    }
  }

  const pendingCount = homework.filter((h) => h.status !== "checked").length

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Homework" subtitle={`${pendingCount} pending assignments`} />
        <main className="p-4 lg:p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">Assign and track homework for your students.</p>
            <Button onClick={handleAddHomework}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Homework
            </Button>
          </div>

          <div className="space-y-6">
            <HomeworkStats homework={homework} />
            <HomeworkList
              homework={homework}
              students={students}
              onEdit={handleEditHomework}
              onUpdateStatus={handleUpdateStatus}
              onExtend={handleExtendHomework}
              onDelete={handleDeleteHomework}
            />
          </div>

          <HomeworkForm
            open={formOpen}
            onOpenChange={setFormOpen}
            homework={selectedHomework}
            students={students}
            lessons={lessons}
            onSave={handleSaveHomework}
          />
        </main>
      </div>
    </div>
  )
}
