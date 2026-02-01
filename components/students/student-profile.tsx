"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MessageCircle, Calendar, DollarSign, Clock, Edit, BookOpen, Lock } from "lucide-react"
import type { Student, Lesson, Payment, Homework, Package } from "@/lib/types"

interface StudentProfileProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: Student | null
  lessons: Lesson[]
  payments: Payment[]
  homework: Homework[]
  packages: Package[]
  onEdit: () => void
}

export function StudentProfile({
  open,
  onOpenChange,
  student,
  lessons,
  payments,
  homework,
  packages,
  onEdit,
}: StudentProfileProps) {
  if (!student) return null

  const studentLessons = lessons.filter((l) => l.studentIds.includes(student.id))
  const studentPayments = payments.filter((p) => p.studentId === student.id)
  const studentHomework = homework.filter((h) => h.studentId === student.id)
  const studentPackages = packages.filter((p) => p.studentId === student.id)

  const completedLessons = studentLessons.filter((l) => l.status === "completed").length
  const upcomingLessons = studentLessons.filter((l) => l.status === "upcoming").length
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0)

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    finished: "bg-gray-100 text-gray-700",
  }

  const lessonStatusColors = {
    upcoming: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    "cancelled-student": "bg-red-100 text-red-700",
    "cancelled-teacher": "bg-orange-100 text-orange-700",
    rescheduled: "bg-purple-100 text-purple-700",
    "no-show": "bg-gray-100 text-gray-700",
  }

  const initials = student.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-xl">{student.fullName}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[student.status]}`}>
                    {student.status}
                  </span>
                  {student.age && <span className="text-sm text-muted-foreground">{student.age} years old</span>}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>

          {/* Contact buttons */}
          <div className="flex gap-2">
            {student.contactEmail && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${student.contactEmail}`}>
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </a>
              </Button>
            )}
            {student.contactPhone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${student.contactPhone}`}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </a>
              </Button>
            )}
            {student.contactWhatsapp && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://wa.me/${student.contactWhatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </a>
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-1">{completedLessons}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-1">{upcomingLessons}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="text-2xl font-bold mt-1">${totalPaid}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <span className="flex justify-center items-center h-5 w-5 mx-auto text-muted-foreground font-bold">#</span>
                <p className="text-2xl font-bold mt-1">{student.lessonBalance || 0}</p>
                <p className="text-xs text-muted-foreground">Paid Lessons</p>
              </CardContent>
            </Card>
          </div>

          {/* Credentials Card */}
          <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Login Credentials</CardTitle>
               <Lock className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="space-y-1">
                 <div className="text-sm">
                   <span className="text-muted-foreground">Login: </span>
                   <span className="font-medium">{student.contactEmail || "N/A"}</span>
                 </div>
                 <div className="text-sm">
                   <span className="text-muted-foreground">Password: </span>
                   <span className="font-medium">{student.password || "Not set"}</span>
                 </div>
               </div>
             </CardContent>
           </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {student.parentName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parent</span>
                  <span>{student.parentName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lesson Type</span>
                <span>{student.lessonType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span>${student.lessonPrice} / lesson</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Model</span>
                <span className="capitalize">{student.paymentModel.replace("-", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone</span>
                <span>{student.timezone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Subjects & Tags */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Subjects</p>
              <div className="flex flex-wrap gap-1">
                {student.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            {student.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {student.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs for History */}
          <Tabs defaultValue="lessons">
            <TabsList className="w-full">
              <TabsTrigger value="lessons" className="flex-1">
                Lessons
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex-1">
                Payments
              </TabsTrigger>
              <TabsTrigger value="homework" className="flex-1">
                Homework
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lessons" className="space-y-2 mt-4">
              {studentLessons.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No lessons yet</p>
              ) : (
                studentLessons.slice(0, 10).map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{lesson.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {lesson.date} at {lesson.time}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${lessonStatusColors[lesson.status]}`}>
                      {lesson.status.replace("-", " ")}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-2 mt-4">
              {studentPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No payments yet</p>
              ) : (
                studentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">${payment.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.date} via {payment.method}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="homework" className="space-y-2 mt-4">
              {studentHomework.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No homework yet</p>
              ) : (
                studentHomework.map((hw) => (
                  <div key={hw.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{hw.title}</p>
                        <p className="text-sm text-muted-foreground">Due: {hw.dueDate}</p>
                      </div>
                    </div>
                    <Badge variant={hw.status === "checked" ? "default" : "secondary"}>{hw.status}</Badge>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Active Packages */}
          {studentPackages.filter((p) => p.status === "active").length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studentPackages
                  .filter((p) => p.status === "active")
                  .map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {pkg.remainingLessons} / {pkg.totalLessons} lessons remaining
                        </p>
                        <p className="text-xs text-muted-foreground">Purchased: {pkg.purchaseDate}</p>
                      </div>
                      {pkg.remainingLessons <= 2 && (
                        <Badge variant="destructive" className="text-xs">
                          Low
                        </Badge>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {student.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Private Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{student.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
