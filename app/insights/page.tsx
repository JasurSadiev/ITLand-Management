"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react"
import { store } from "@/lib/store"
import type { Student, Lesson, Payment, Package } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function InsightsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [mounted, setMounted] = useState(false)
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    setStudents(store.getStudents())
    setLessons(store.getLessons())
    setPayments(store.getPayments())
    setPackages(store.getPackages())
  }, [])

  if (!mounted) {
    return null
  }

  // Student Analytics
  const activeStudents = students.filter((s) => s.status === "active")
  const pausedStudents = students.filter((s) => s.status === "paused")
  const finishedStudents = students.filter((s) => s.status === "finished")

  // Lesson Analytics
  const completedLessons = lessons.filter((l) => l.status === "completed")
  const cancelledLessons = lessons.filter((l) => l.status === "cancelled-student" || l.status === "cancelled-teacher")
  const noShowLessons = lessons.filter((l) => l.status === "no-show")
  const upcomingLessons = lessons.filter((l) => l.status === "upcoming")

  const totalScheduledLessons = completedLessons.length + cancelledLessons.length + noShowLessons.length
  const completionRate = totalScheduledLessons > 0 ? (completedLessons.length / totalScheduledLessons) * 100 : 0
  const cancellationRate = totalScheduledLessons > 0 ? (cancelledLessons.length / totalScheduledLessons) * 100 : 0

  // Payment Analytics
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const unpaidLessons = lessons.filter((l) => l.status === "completed" && l.paymentStatus === "unpaid")
  const unpaidAmount = unpaidLessons.reduce((sum, l) => {
    const student = students.find((s) => s.id === l.studentIds[0])
    return sum + (student?.lessonPrice || 0)
  }, 0)

  // Monthly revenue trend
  const monthlyRevenue: { month: string; revenue: number }[] = []
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return date
  }).reverse()

  last6Months.forEach((date) => {
    const month = date.toLocaleString("default", { month: "short" })
    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date)
      return paymentDate.getMonth() === date.getMonth() && paymentDate.getFullYear() === date.getFullYear()
    })
    monthlyRevenue.push({
      month,
      revenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    })
  })

  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)

  // Package Analytics
  const activePackages = packages.filter((p) => p.status === "active")
  const lowPackages = activePackages.filter((p) => p.remainingLessons <= 2)

  // Subject distribution
  const subjectCounts: Record<string, number> = {}
  students.forEach((s) => {
    s.subjects.forEach((subject) => {
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
    })
  })
  const topSubjects = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Students without upcoming lessons
  const studentsWithoutLessons = activeStudents.filter(
    (s) => !lessons.some((l) => l.studentIds.includes(s.id) && l.status === "upcoming"),
  )

  // Lesson distribution by day
  const lessonsByDay: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
  lessons.forEach((l) => {
    const day = new Date(l.date).toLocaleString("en-US", { weekday: "short" })
    lessonsByDay[day] = (lessonsByDay[day] || 0) + 1
  })
  const maxLessonDay = Math.max(...Object.values(lessonsByDay), 1)

  // Average lesson price
  const avgLessonPrice =
    activeStudents.length > 0 ? activeStudents.reduce((sum, s) => sum + s.lessonPrice, 0) / activeStudents.length : 0

  // Teaching hours this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthLessons = completedLessons.filter((l) => {
    const d = new Date(l.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const teachingHours = monthLessons.reduce((sum, l) => sum + l.duration / 60, 0)

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Insights & Analytics" subtitle="Track your teaching business performance" />
        <main className="p-4 lg:p-6">
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{activeStudents.length}</p>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completedLessons.length}</p>
                      <p className="text-sm text-muted-foreground">Completed Lessons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{teachingHours.toFixed(1)}h</p>
                      <p className="text-sm text-muted-foreground">Teaching Hours (Month)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyRevenue.map((item) => (
                      <div key={item.month} className="flex items-center gap-4">
                        <span className="w-10 text-sm text-muted-foreground">{item.month}</span>
                        <div className="flex-1">
                          <div className="h-8 rounded-lg bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-20 text-right text-sm font-medium">${item.revenue}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Lesson Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Lesson Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Completion Rate
                      </span>
                      <span className="font-medium">{completionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Cancellation Rate
                      </span>
                      <span className="font-medium">{cancellationRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={cancellationRate} className="h-2 [&>div]:bg-red-500" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{completedLessons.length}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{cancelledLessons.length}</p>
                      <p className="text-xs text-muted-foreground">Cancelled</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{upcomingLessons.length}</p>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lessons by Day */}
              <Card>
                <CardHeader>
                  <CardTitle>Lessons by Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-40">
                    {Object.entries(lessonsByDay).map(([day, count]) => (
                      <div key={day} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-muted rounded-t-lg relative" style={{ height: "120px" }}>
                          <div
                            className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                            style={{ height: `${(count / maxLessonDay) * 100}%` }}
                          />
                        </div>
                        <span className="mt-2 text-xs text-muted-foreground">{day}</span>
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Subjects */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  {topSubjects.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topSubjects.map(([subject, count], index) => (
                        <div key={subject} className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{subject}</p>
                            <p className="text-sm text-muted-foreground">{count} students</p>
                          </div>
                          <Badge variant="secondary">{((count / students.length) * 100).toFixed(0)}%</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Actions */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Students Need Attention */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    Needs Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentsWithoutLessons.length > 0 && (
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="font-medium text-amber-800">{studentsWithoutLessons.length} students</p>
                        <p className="text-sm text-amber-700">No upcoming lessons scheduled</p>
                      </div>
                    )}
                    {lowPackages.length > 0 && (
                      <div className="rounded-lg bg-orange-50 p-3">
                        <p className="font-medium text-orange-800">{lowPackages.length} packages</p>
                        <p className="text-sm text-orange-700">Running low on lessons</p>
                      </div>
                    )}
                    {unpaidAmount > 0 && (
                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="font-medium text-red-800">${unpaidAmount} outstanding</p>
                        <p className="text-sm text-red-700">
                          {unpaidLessons.length} unpaid lesson{unpaidLessons.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}
                    {studentsWithoutLessons.length === 0 && lowPackages.length === 0 && unpaidAmount === 0 && (
                      <p className="text-center text-muted-foreground py-4">All caught up!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Student Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm">Active</span>
                      </div>
                      <span className="font-medium">{activeStudents.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span className="text-sm">Paused</span>
                      </div>
                      <span className="font-medium">{pausedStudents.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-gray-400" />
                        <span className="text-sm">Finished</span>
                      </div>
                      <span className="font-medium">{finishedStudents.length}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-bold">{students.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Lesson Price</span>
                      <span className="font-medium">${avgLessonPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Packages</span>
                      <span className="font-medium">{activePackages.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">No-shows</span>
                      <span className="font-medium">{noShowLessons.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Payments</span>
                      <span className="font-medium">{payments.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
