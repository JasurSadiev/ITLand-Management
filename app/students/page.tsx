"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StudentTable } from "@/components/students/student-table"
import { StudentForm } from "@/components/students/student-form"
import { StudentProfile } from "@/components/students/student-profile"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import type { Student, Lesson, Payment, Homework, Package } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [studentsData, lessonsData, paymentsData, homeworkData, packagesData] = await Promise.all([
        api.getStudents(),
        api.getLessons(),
        api.getPayments(),
        api.getHomework(),
        api.getPackages(),
      ])
      setStudents(studentsData)
      setLessons(lessonsData)
      setPayments(paymentsData)
      setHomework(homeworkData)
      setPackages(packagesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  const handleAddStudent = () => {
    setSelectedStudent(null)
    setFormOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setFormOpen(true)
  }

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setProfileOpen(true)
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await api.deleteStudent(id)
        loadData()
      } catch (error) {
        console.error("Failed to delete student:", error)
      }
    }
  }

  const handleSaveStudent = async (studentData: Omit<Student, "id" | "createdAt" | "updatedAt"> | Partial<Student>) => {
    try {
      if (selectedStudent) {
        await api.updateStudent(selectedStudent.id, studentData)
      } else {
        await api.createStudent(studentData as Omit<Student, "id" | "createdAt" | "updatedAt">)
      }
      loadData()
      setFormOpen(false)
      setSelectedStudent(null)
    } catch (error) {
      console.error("Failed to save student:", error)
    }
  }

  const activeStudents = students.filter((s) => s.status === "active").length

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Students" subtitle={`${activeStudents} active students`} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">
                Manage your students, view their profiles, and track their progress.
              </p>
            </div>
            <Button onClick={handleAddStudent}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>

          <StudentTable
            students={students}
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
            onView={handleViewStudent}
          />

          <StudentForm
            open={formOpen}
            onOpenChange={setFormOpen}
            student={selectedStudent}
            onSave={handleSaveStudent}
          />

          <StudentProfile
            open={profileOpen}
            onOpenChange={setProfileOpen}
            student={selectedStudent}
            lessons={lessons}
            payments={payments}
            homework={homework}
            packages={packages}
            onRefresh={loadData}
            onEdit={() => {
              setProfileOpen(false)
              setFormOpen(true)
            }}
          />
        </main>
      </div>
    </div>
  )
}
