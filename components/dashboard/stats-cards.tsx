"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, DollarSign, AlertTriangle } from "lucide-react"

interface StatsCardsProps {
  activeStudents: number
  todayLessons: number
  monthlyIncome: number
  unpaidLessons: number
}

export function StatsCards({ activeStudents, todayLessons, monthlyIncome, unpaidLessons }: StatsCardsProps) {
  const stats = [
    {
      label: "Active Students",
      value: activeStudents,
      icon: Users,
      trend: "+2 this month",
      trendUp: true,
    },
    {
      label: "Today's Lessons",
      value: todayLessons,
      icon: Calendar,
      trend: "2 completed",
      trendUp: true,
    },
    {
      label: "Monthly Income",
      value: `$${monthlyIncome.toLocaleString()}`,
      icon: DollarSign,
      trend: "+12% vs last month",
      trendUp: true,
    },
    {
      label: "Unpaid Lessons",
      value: unpaidLessons,
      icon: AlertTriangle,
      trend: "Requires attention",
      trendUp: false,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className={`mt-2 text-xs ${stat.trendUp ? "text-emerald-600" : "text-amber-600"}`}>{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
