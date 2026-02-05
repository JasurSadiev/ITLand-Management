"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Student, Lesson, Payment, Homework } from "@/lib/types"
import { format } from "date-fns"
import { Calendar, Clock, Video, BookOpen, AlertCircle } from "lucide-react"
import { MotivationWidget } from "@/components/motivation-widget"

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
        // Simple auth check via cookie (demo only)
        const match = document.cookie.match(new RegExp('(^| )student-id=([^;]+)'))
        const studentId = match ? match[2] : null

        if (!studentId) {
            window.location.href = "/login"
            return
        }

        const allStudents = await api.getStudents()
        const currentStudent = allStudents.find(s => s.id === studentId)
        
        if (currentStudent) {
            setStudent(currentStudent)
            
            // Fetch lessons for this student
            // We fetch all and filter client side for now as per api structure
            const allLessons = await api.getLessons()
            // Filter lessons where this student is a participant
            const studentLessons = allLessons.filter(l => 
                l.studentIds.includes(studentId) && 
                l.status !== "cancelled-teacher" && 
                l.status !== "cancelled-student"
            )
            setLessons(studentLessons)
        }
    } catch (error) {
        console.error("Failed to load student data", error)
    } finally {
        setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!student) return <div className="p-8">Access Denied</div>

  // Find next upcoming lesson
  const now = new Date()
  const upcomingLessons = lessons
    .filter(l => {
        const lessonDate = new Date(`${l.date}T${l.time}`)
        return lessonDate >= now
    })
    .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateA.getTime() - dateB.getTime()
    })

  const nextLesson = upcomingLessons[0]

  return (
    <>
      <Header title="Student Portal" subtitle={`Welcome back, ${student.fullName.split(' ')[0]}!`} />
      <main className="p-6 space-y-6">
        
        {student.preferences?.showMotivation && (
            <div className="max-w-2xl">
                <MotivationWidget />
            </div>
        )}

        {/* Next Lesson Card */}
        <Card className="border-l-4 border-l-indigo-600">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Next Lesson
                </CardTitle>
                <CardDescription>Your upcoming class details</CardDescription>
            </CardHeader>
            <CardContent>
                {nextLesson ? (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold">{nextLesson.subject || "Private Lesson"}</h3>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Clock className="h-4 w-4" />
                                    {format(new Date(nextLesson.date), "EEEE, MMMM do, yyyy")} at {nextLesson.time}
                                    <Badge variant="outline" className="ml-2">{nextLesson.duration} min</Badge>
                                </p>
                            </div>
                            
                            {nextLesson.meetingLink && (
                                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => window.open(nextLesson.meetingLink, '_blank')}>
                                    <Video className="mr-2 h-5 w-5" />
                                    Join Online Class
                                </Button>
                            )}
                        </div>
                        
                        {!nextLesson.meetingLink && (
                             <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Online meeting link not yet available.
                             </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No upcoming lessons scheduled.
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            {/* Balance Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Lesson Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-indigo-600">
                        {student.lessonBalance}
                    </div>
                    <p className="text-muted-foreground mt-1">Paid lessons remaining</p>
                </CardContent>
                <CardFooter>
                    {student.lessonBalance <= 1 && (
                        <p className="text-sm text-red-500 font-medium">
                            Please contact your teacher to top up.
                        </p>
                    )}
                </CardFooter>
            </Card>

            {/* Quick Stats or Homework placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {lessons.slice(0, 3).map(l => (
                             <div key={l.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-medium">{l.subject || "Lesson"}</p>
                                    <p className="text-muted-foreground">{l.date}</p>
                                </div>
                                <Badge variant={l.status === 'completed' ? 'secondary' : 'outline'}>
                                    {l.status}
                                </Badge>
                             </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

      </main>
    </>
  )
}
