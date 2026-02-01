"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { FinanceStats } from "@/components/payments/finance-stats"
import { PaymentForm } from "@/components/payments/payment-form"
import { PackageForm } from "@/components/payments/package-form"
import { PaymentsList } from "@/components/payments/payments-list"
import { PackagesList } from "@/components/payments/packages-list"
import { UnpaidLessons } from "@/components/payments/unpaid-lessons"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import { api } from "@/lib/api"
import type { Student, Lesson, Payment, Package as PackageType } from "@/lib/types"

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [packages, setPackages] = useState<PackageType[]>([])
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [paymentFormOpen, setPaymentFormOpen] = useState(false)
  const [packageFormOpen, setPackageFormOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [studentsData, lessonsData, paymentsData, packagesData] = await Promise.all([
        api.getStudents(),
        api.getLessons(),
        api.getPayments(),
        api.getPackages(),
      ])
      setStudents(studentsData)
      setLessons(lessonsData)
      setPayments(paymentsData)
      setPackages(packagesData)
    } catch (error) {
      console.error("Failed to load payments data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  // Calculate finance stats
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyIncome = payments
    .filter((p) => {
      const d = new Date(p.date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // Expected income from upcoming lessons
  const upcomingLessons = lessons.filter((l) => l.status === "upcoming")
  const expectedIncome = upcomingLessons.reduce((sum, l) => {
    const student = students.find((s) => s.id === l.studentIds[0])
    return sum + (student?.lessonPrice || 0)
  }, 0)

  // Unpaid amount
  const unpaidLessons = lessons.filter((l) => l.status === "completed" && l.paymentStatus === "unpaid")
  const unpaidAmount = unpaidLessons.reduce((sum, l) => {
    const student = students.find((s) => s.id === l.studentIds[0])
    return sum + (student?.lessonPrice || 0)
  }, 0)

  // Cancelled loss
  const cancelledLessons = lessons.filter(
    (l) => (l.status === "cancelled-student" || l.status === "no-show") && l.paymentStatus !== "paid",
  )
  const cancelledLoss = cancelledLessons.reduce((sum, l) => {
    const student = students.find((s) => s.id === l.studentIds[0])
    return sum + (student?.lessonPrice || 0)
  }, 0)

  const handleSavePayment = async (payment: Omit<Payment, "id" | "createdAt">, lessonCount: number) => {
    try {
      await api.createPayment(payment)
      
      // Add lessons to student's balance
      if (lessonCount > 0) {
        const student = students.find(s => s.id === payment.studentId)
        if (student) {
          const newBalance = (student.lessonBalance || 0) + lessonCount
          await api.updateStudent(student.id, { lessonBalance: newBalance })
        }
      }
      loadData()
      setPaymentFormOpen(false)
    } catch (error) {
      console.error("Failed to save payment:", error)
    }
  }

  const handleSavePackage = async (pkg: Omit<PackageType, "id">) => {
    // Note: Package creation is not fully implemented in API yet, skipping persistence for now or logging
    console.log("Package creation not fully implemented via API yet", pkg)
    // In a real app, await api.createPackage(pkg)
    // store.addPackage(pkg) // Removed store usage
    loadData() // Refresh mock data if API was real
    setPackageFormOpen(false)
  }

  const handleUpdatePackage = async (id: string, updates: Partial<PackageType>) => {
    // console.log("Package update not fully implemented via API yet", id, updates)
    // await api.updatePackage(id, updates)
    loadData()
  }

  const handleMarkLessonPaid = async (lessonId: string) => {
    try {
      await api.updateLesson(lessonId, { paymentStatus: "paid" })
      loadData()
    } catch (error) {
      console.error("Failed to mark lesson paid:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Payments & Finance" subtitle="Track income, payments, and packages" />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground">Manage your finances and track student payments.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPackageFormOpen(true)}>
                <Package className="mr-2 h-4 w-4" />
                New Package
              </Button>
              <Button onClick={() => setPaymentFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <FinanceStats
              monthlyIncome={monthlyIncome}
              expectedIncome={expectedIncome}
              unpaidAmount={unpaidAmount}
              cancelledLoss={cancelledLoss}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <UnpaidLessons lessons={lessons} students={students} onMarkPaid={handleMarkLessonPaid} />
              <PackagesList packages={packages} students={students} onUpdatePackage={handleUpdatePackage} />
            </div>

            <PaymentsList payments={payments} students={students} />
          </div>

          <PaymentForm
            open={paymentFormOpen}
            onOpenChange={setPaymentFormOpen}
            students={students}
            onSave={handleSavePayment}
          />

          <PackageForm
            open={packageFormOpen}
            onOpenChange={setPackageFormOpen}
            students={students}
            onSave={handleSavePackage}
          />
        </main>
      </div>
    </div>
  )
}
