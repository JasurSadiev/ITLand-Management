"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { TodaysLessons } from "@/components/dashboard/todays-lessons"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { WeekOverview } from "@/components/dashboard/week-overview"
import { store } from "@/lib/store"
import { api } from "@/lib/api"
import { MotivationWidget } from "@/components/motivation-widget"
import { useConfetti } from "@/components/confetti-provider"
import type { Student, Lesson, Payment, Package, RescheduleRequest, User } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const { fire } = useConfetti()
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
        const [s, l, p, pkg, req] = await Promise.all([
            api.getStudents(),
            api.getLessons(),
            api.getPayments(),
            api.getPackages(),
            api.getRescheduleRequests()
        ])
        setStudents(s)
        setLessons(l)
        setPayments(p)
        setPackages(pkg)
        setRescheduleRequests(req.filter(r => r.status === 'pending'))
        setUser(store.getCurrentUser())
    } catch (error) {
        console.error("Dashboard load failed", error)
    } finally {
        setLoading(false)
    }
  }

  if (!mounted || loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  const today = new Date().toISOString().split("T")[0]
  const todaysLessons = lessons.filter((l) => l.date === today)
  const activeStudents = students.filter((s) => s.status === "active")

  // Calculate monthly income
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyIncome = payments
    .filter((p) => {
      const paymentDate = new Date(p.date)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // Unpaid lessons
  const unpaidLessons = lessons.filter((l) => l.status === "completed" && l.paymentStatus === "unpaid")

  // Students with unpaid balances
  const studentsWithUnpaid = students.filter((s) =>
    lessons.some((l) => l.studentIds.includes(s.id) && l.status === "completed" && l.paymentStatus === "unpaid"),
  )

  // Low packages (2 or fewer lessons remaining)
  const lowPackages = packages.filter((p) => p.status === "active" && p.remainingLessons <= 2)

  // Students without upcoming lessons
  const studentsWithoutLessons = students.filter(
    (s) => s.status === "active" && !lessons.some((l) => l.studentIds.includes(s.id) && l.status === "upcoming"),
  )

  // Week lessons for overview
  const weekStart = new Date()
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekLessons = lessons.filter((l) => {
    const lessonDate = new Date(l.date)
    return lessonDate >= weekStart && lessonDate <= weekEnd
  })

  const handleCompleteLesson = async (id: string) => {
    try {
        await api.updateLesson(id, { status: "completed" })
        if (user?.preferences?.confettiEnabled) {
          fire()
        }
        loadData()
    } catch (e) {
        console.error(e)
    }
  }

  const handleCancelLesson = async (id: string) => {
    try {
        await api.updateLesson(id, { status: "cancelled-teacher" })
        loadData()
    } catch (e) {
        console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Dashboard" subtitle={`Welcome back! Here's your overview for today.`} />
        <main className="p-6">
          <div className="space-y-6">
            {user?.preferences?.showMotivation && (
              <div className="max-w-2xl">
                <MotivationWidget />
              </div>
            )}
            <StatsCards
              activeStudents={activeStudents.length}
              todayLessons={todaysLessons.length}
              monthlyIncome={monthlyIncome}
              unpaidLessons={unpaidLessons.length}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <TodaysLessons
                lessons={todaysLessons}
                students={students}
                onComplete={handleCompleteLesson}
                onCancel={handleCancelLesson}
              />
              <AlertsPanel
                studentsWithUnpaid={studentsWithUnpaid}
                lowPackages={lowPackages}
                studentsWithoutLessons={studentsWithoutLessons}
                rescheduleRequests={rescheduleRequests}
                students={students}
              />
            </div>

            <WeekOverview lessons={weekLessons} students={students} />
          </div>
        </main>
      </div>
    </div>
  )
}
