"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import type { Homework } from "@/lib/types"

interface HomeworkStatsProps {
  homework: Homework[]
}

export function HomeworkStats({ homework }: HomeworkStatsProps) {
  const assigned = homework.filter((h) => h.status === "assigned").length
  const submitted = homework.filter((h) => h.status === "submitted").length
  const checked = homework.filter((h) => h.status === "checked").length
  const overdue = homework.filter((h) => h.status !== "checked" && new Date(h.dueDate) < new Date()).length

  const stats = [
    {
      label: "Assigned",
      value: assigned,
      icon: BookOpen,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Awaiting Review",
      value: submitted,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Checked",
      value: checked,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Overdue",
      value: overdue,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
