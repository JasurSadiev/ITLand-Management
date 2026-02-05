"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, AlertTriangle, ExternalLink, Calendar as CalendarIcon, Send } from "lucide-react"
import { api } from "@/lib/api"
import type { Homework, Lesson, Student } from "@/lib/types"
import { toZonedTime, format, fromZonedTime } from "date-fns-tz"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useConfetti } from "@/components/confetti-provider"

export default function StudentHomeworkPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [homework, setHomework] = useState<Homework[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null)
  const [submissionText, setSubmissionText] = useState("")
  const { fire } = useConfetti()

  useEffect(() => {
    const studentData = localStorage.getItem("currentStudent")
    if (studentData) {
      const s = JSON.parse(studentData)
      setStudent(s)
      loadData(s.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadData = async (studentId: string) => {
    try {
      const [hwData, lessonsData] = await Promise.all([
        api.getHomework({ studentId }),
        api.getLessons({ studentId })
      ])
      setHomework(hwData)
      setLessons(lessonsData)
    } catch (error) {
      console.error("Failed to load homework:", error)
      toast.error("Failed to load homework information")
    } finally {
      setLoading(false)
    }
  }

  const formatDeadline = (hw: Homework) => {
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const zonedDate = toZonedTime(new Date(hw.dueDate), userTz)
    return format(zonedDate, "MMM d, h:mm a")
  }

  const isOverdue = (hw: Homework) => {
    return hw.status === "assigned" && new Date(hw.dueDate) < new Date()
  }

  const handleOpenSubmit = (hw: Homework) => {
    // Check 5-min rule if lessonId exists
    if (hw.lessonId) {
      const lesson = lessons.find(l => l.id === hw.lessonId)
      if (lesson) {
        // Assume lesson.date and lesson.time are in lesson.timezone or UTC
        // Since we updated lessons to have timezone, we should convert to Date
        const lessonTimeStr = `${lesson.date} ${lesson.time}`
        const lessonUtc = fromZonedTime(lessonTimeStr, lesson.timezone || "UTC")
        const now = new Date()
        const diffMs = lessonUtc.getTime() - now.getTime()
        const diffMins = diffMs / (1000 * 60)

        // "submitted 5mins upto the lesson"
        // If it's less than 5 mins before lesson (or lesson already passed), it's restricted
        if (diffMins < 5) {
          toast.error("Submission window closed. Homework must be submitted at least 5 minutes before the lesson starts.")
          return
        }
      }
    }
    setSelectedHw(hw)
    setSubmissionText(hw.submissionText || "")
    setSubmitOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedHw) return
    try {
      await api.updateHomework(selectedHw.id, {
        status: "submitted",
        submissionText: submissionText,
        submittedAt: new Date().toISOString()
      })
      if (student?.preferences?.confettiEnabled) {
        fire()
      }
      toast.success("Homework submitted successfully!")
      setSubmitOpen(false)
      if (student) loadData(student.id)
    } catch (error) {
      toast.error("Failed to submit homework")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const assigned = homework.filter(h => h.status === "assigned")
  const completed = homework.filter(h => h.status !== "assigned")

  return (
    <div className="p-6">
      <Header title="My Homework" subtitle={`You have ${assigned.length} pending assignments`} />
      
      <main className="mx-auto max-w-5xl mt-8">
        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="assigned" className="px-6">Assigned</TabsTrigger>
            <TabsTrigger value="completed" className="px-6">Completed / Checked</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {assigned.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-4 opacity-20" />
                  <p>All caught up! No pending homework.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {assigned.map(hw => {
                  const overdue = isOverdue(hw)
                  return (
                    <Card key={hw.id} className={overdue ? "border-red-200 bg-red-50/30" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{hw.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Due: {formatDeadline(hw)}</span>
                              {overdue && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Overdue</Badge>}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Assigned</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {hw.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            className="w-full gap-2 bg-transparent" 
                            size="sm" 
                            onClick={() => {
                              setSelectedHw(hw)
                              setDetailsOpen(true)
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </Button>
                          <Button className="w-full gap-2" size="sm" onClick={() => handleOpenSubmit(hw)}>
                            <Send className="h-4 w-4" />
                            Submit Work
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completed.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">No completed homework yet.</p>
            ) : (
              <div className="space-y-3">
                {completed.map(hw => (
                  <Card key={hw.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted/30">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 flex items-center justify-center rounded-full ${hw.status === 'checked' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {hw.status === 'checked' ? <CheckCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{hw.title}</p>
                          <p className="text-sm text-muted-foreground">Submitted on {hw.submittedAt ? new Date(hw.submittedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <Badge className={hw.status === 'checked' ? 'bg-emerald-100 text-emerald-700 border-none' : 'bg-amber-100 text-amber-700 border-none'}>
                        {hw.status === 'checked' ? 'Checked' : 'Submitted'}
                      </Badge>
                    </div>
                    {hw.feedback && (
                      <div className="p-4 border-t bg-emerald-50/20">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Teacher Feedback</p>
                        <p className="text-sm italic">{hw.feedback}</p>
                      </div>
                    )}
                    <div className="p-4 border-t flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80"
                        onClick={() => {
                          setSelectedHw(hw)
                          setDetailsOpen(true)
                        }}
                      >
                        View My Submission
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Homework: {selectedHw?.title}</DialogTitle>
            <DialogDescription>
              Submit your work as text, a link to a document, or both.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedHw?.description && (
               <div className="rounded-lg bg-muted/50 p-3 border text-sm">
                  <p className="font-semibold mb-1">Instructions:</p>
                  <p className="text-muted-foreground">{selectedHw.description}</p>
               </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Submission Details</label>
              <Textarea 
                placeholder="Paste your links or write your submission here..." 
                className="min-h-[150px]"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deadline: {selectedHw ? formatDeadline(selectedHw) : ''}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!submissionText.trim()}>Submit Homework</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Homework Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between mt-2">
               <DialogTitle className="text-2xl">{selectedHw?.title}</DialogTitle>
               <Badge className={selectedHw?.status === 'assigned' ? 'bg-blue-100 text-blue-700 border-none' : 'bg-emerald-100 text-emerald-700 border-none'}>
                  {selectedHw?.status}
               </Badge>
            </div>
            <DialogDescription className="flex items-center gap-2 pt-1 font-medium text-destructive">
               <Clock className="h-4 w-4" />
               Deadline: {selectedHw ? formatDeadline(selectedHw) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description / Instructions</h4>
              <div className="rounded-lg border bg-card p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedHw?.description || "No description provided."}
              </div>
            </div>

            {selectedHw?.attachments && selectedHw.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attachments ({selectedHw.attachments.length})</h4>
                <div className="grid gap-2">
                  {selectedHw.attachments.map((url, i) => (
                    <a 
                      key={i} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4 text-primary" />
                      {url.split('/').pop() || "View Attachment"}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedHw?.status !== 'assigned' && (
               <div className="space-y-4">
                  <div className="pt-4 border-t">
                     <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">Your Submission</h4>
                     <div className="rounded-lg border bg-blue-50/20 p-4 text-sm whitespace-pre-wrap">
                        {selectedHw?.submissionText || "No submission text provided."}
                     </div>
                     <p className="text-xs text-muted-foreground mt-2">
                        Submitted on: {selectedHw?.submittedAt ? new Date(selectedHw.submittedAt).toLocaleString() : 'N/A'}
                     </p>
                  </div>

                  {selectedHw?.feedback && (
                    <div className="rounded-xl bg-emerald-50/30 border border-emerald-100 p-5">
                       <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          Teacher Feedback
                       </h4>
                       <p className="text-sm text-emerald-900 italic leading-relaxed">
                          "{selectedHw.feedback}"
                       </p>
                    </div>
                  )}
               </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
            {selectedHw?.status === 'assigned' && (
              <Button onClick={() => {
                setDetailsOpen(false)
                handleOpenSubmit(selectedHw)
              }}>
                <Send className="mr-2 h-4 w-4" />
                Submit My Work
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
