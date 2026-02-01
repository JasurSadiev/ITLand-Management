"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Minus, Plus } from "lucide-react"
import type { Package, Student } from "@/lib/types"

interface PackagesListProps {
  packages: Package[]
  students: Student[]
  onUpdatePackage: (id: string, updates: Partial<Package>) => void
}

export function PackagesList({ packages, students, onUpdatePackage }: PackagesListProps) {
  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.fullName || "Unknown"
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    expired: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-700",
  }

  const activePackages = packages.filter((p) => p.status === "active")

  const handleDecrement = (pkg: Package) => {
    if (pkg.remainingLessons > 0) {
      const newRemaining = pkg.remainingLessons - 1
      onUpdatePackage(pkg.id, {
        remainingLessons: newRemaining,
        status: newRemaining === 0 ? "completed" : "active",
      })
    }
  }

  const handleIncrement = (pkg: Package) => {
    if (pkg.remainingLessons < pkg.totalLessons) {
      onUpdatePackage(pkg.id, { remainingLessons: pkg.remainingLessons + 1 })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Packages</CardTitle>
      </CardHeader>
      <CardContent>
        {activePackages.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No active packages</p>
        ) : (
          <div className="space-y-4">
            {activePackages.map((pkg) => {
              const progress = ((pkg.totalLessons - pkg.remainingLessons) / pkg.totalLessons) * 100
              const isLow = pkg.remainingLessons <= 2

              return (
                <div key={pkg.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{getStudentName(pkg.studentId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.totalLessons} lessons - ${pkg.amount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[pkg.status]}>{pkg.status}</Badge>
                      {isLow && <Badge variant="destructive">Low</Badge>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {pkg.totalLessons - pkg.remainingLessons} of {pkg.totalLessons} used
                      </span>
                      <span className="font-medium">{pkg.remainingLessons} remaining</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Purchased: {pkg.purchaseDate}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleIncrement(pkg)}
                        disabled={pkg.remainingLessons >= pkg.totalLessons}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => handleDecrement(pkg)}
                        disabled={pkg.remainingLessons <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
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
