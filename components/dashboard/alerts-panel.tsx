"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, CreditCard, Package, RefreshCw } from "lucide-react"
import type { Student, Package as PackageType, RescheduleRequest } from "@/lib/types"

interface AlertsPanelProps {
  studentsWithUnpaid: Student[]
  lowPackages: PackageType[]
  studentsWithoutLessons: Student[]
  rescheduleRequests: RescheduleRequest[]
  students: Student[]
}

export function AlertsPanel({ 
    studentsWithUnpaid, 
    lowPackages, 
    studentsWithoutLessons, 
    rescheduleRequests,
    students 
}: AlertsPanelProps) {
  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || "Unknown"
  }

  const alerts = [
    ...rescheduleRequests.map((r) => ({
      type: "reschedule",
      icon: RefreshCw,
      title: `Reschedule request: ${getStudentName(r.studentId)}`,
      color: "text-indigo-600 bg-indigo-50",
    })),
    ...studentsWithUnpaid.map((s) => ({
      type: "unpaid",
      icon: CreditCard,
      title: `${s.fullName} has unpaid lessons`,
      color: "text-amber-600 bg-amber-50",
    })),
    ...lowPackages.map((p) => ({
      type: "package",
      icon: Package,
      title: `${getStudentName(p.studentId)} - ${p.remainingLessons} lessons remaining`,
      color: "text-orange-600 bg-orange-50",
    })),
    ...studentsWithoutLessons.slice(0, 3).map((s) => ({
      type: "inactive",
      icon: Clock,
      title: `${s.fullName} has no upcoming lessons`,
      color: "text-blue-600 bg-blue-50",
    })),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alerts & Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">All caught up! No alerts at the moment.</p>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className={`flex items-center gap-3 rounded-lg p-3 ${alert.color}`}>
                <alert.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">{alert.title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
