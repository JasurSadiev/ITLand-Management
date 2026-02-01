"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, CheckCircle, Clock, BookOpen, Globe } from "lucide-react"
import { toZonedTime, format } from "date-fns-tz"
import type { Homework, Student } from "@/lib/types"

interface HomeworkListProps {
  homework: Homework[]
  students: Student[]
  onEdit: (homework: Homework) => void
  onUpdateStatus: (id: string, status: Homework["status"]) => void
  onExtend: (id: string, days: number) => void
  onDelete: (id: string) => void
}

export function HomeworkList({ homework, students, onEdit, onUpdateStatus, onExtend, onDelete }: HomeworkListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || "Unknown"
  }

  const filteredHomework = homework.filter((hw) => {
    const matchesSearch =
      hw.title.toLowerCase().includes(search.toLowerCase()) ||
      getStudentName(hw.studentId).toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || hw.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedHomework = [...filteredHomework].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )

  const statusColors: Record<string, string> = {
    assigned: "bg-blue-100 text-blue-700",
    submitted: "bg-amber-100 text-amber-700",
    checked: "bg-emerald-100 text-emerald-700",
  }

  const statusIcons: Record<string, React.ElementType> = {
    assigned: Clock,
    submitted: BookOpen,
    checked: CheckCircle,
  }

  const isOverdue = (hw: Homework) => {
    return hw.status !== "checked" && new Date(hw.dueDate) < new Date()
  }

  const formatDeadline = (hw: Homework) => {
    // Homework deadline is stored in its original timezone
    // For the teacher, we'll show it in a standard way or local
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const zonedDate = toZonedTime(new Date(hw.dueDate), userTz)
    return format(zonedDate, "MMM d, h:mm a") + ` (${hw.timezone})`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Homework Assignments</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Filter className="h-4 w-4" />
                  {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("assigned")}>Assigned</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>Submitted</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("checked")}>Checked</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedHomework.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No homework found</p>
        ) : (
          <div className="space-y-3">
            {sortedHomework.map((hw) => {
              const Icon = statusIcons[hw.status]
              const overdue = isOverdue(hw)

              return (
                <div
                  key={hw.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${overdue ? "border-red-200 bg-red-50" : "border-border"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${overdue ? "bg-red-100" : "bg-muted"}`}
                    >
                      <Icon className={`h-5 w-5 ${overdue ? "text-red-600" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{hw.title}</p>
                        <Badge className={statusColors[hw.status]}>{hw.status}</Badge>
                        {overdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getStudentName(hw.studentId)} - Due: {formatDeadline(hw)}
                      </p>
                      {hw.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{hw.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hw.status === "assigned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => onUpdateStatus(hw.id, "submitted")}
                      >
                        Mark Submitted
                      </Button>
                    )}
                    {hw.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => onUpdateStatus(hw.id, "checked")}
                      >
                        Mark Checked
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(hw)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(hw.id, "assigned")}>
                          Set as Assigned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(hw.id, "submitted")}>
                          Set as Submitted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus(hw.id, "checked")}>
                          Set as Checked
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExtend(hw.id, 1)}>
                          Extend 1 Day
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExtend(hw.id, 7)}>
                          Extend 1 Week
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(hw.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
