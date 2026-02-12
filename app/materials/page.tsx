"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Trash2, ChevronRight, BookOpen, GraduationCap, Clock, Target, Lightbulb, PlayCircle, BookCheck, Trophy, Sparkles, Save, X, ArrowLeft } from "lucide-react"
import { store } from "@/lib/store"
import type { Course, LessonContent, CourseLevel } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

const LEVELS: CourseLevel[] = ["Beginner", "Basic", "Intermediate", "Advanced"]

export default function MaterialsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<LessonContent[]>([])
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  
  // Navigation state
  const [view, setView] = useState<"courses" | "course-detail" | "lesson-editor" | "lesson-view">("courses")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>("Beginner")
  const [currentLesson, setCurrentLesson] = useState<Partial<LessonContent> | null>(null)

  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [newCourseData, setNewCourseData] = useState({ title: "", description: "", tags: "" })

  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    setMounted(true)
    setCourses(store.getCourses())
    setLessons(store.getLessonContents())
  }, [])

  if (!mounted) return null

  // --- Course Handlers ---
  const handleCreateCourse = () => {
    if (newCourseData.title) {
      const course = store.addCourse({
        title: newCourseData.title,
        description: newCourseData.description,
        tags: newCourseData.tags.split(",").map(t => t.trim()).filter(Boolean),
      })
      setCourses(store.getCourses())
      setCourseDialogOpen(false)
      setNewCourseData({ title: "", description: "", tags: "" })
    }
  }

  const handleDeleteCourse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this course and all its lessons?")) {
      store.deleteCourse(id)
      setCourses(store.getCourses())
      setLessons(store.getLessonContents())
      if (selectedCourse?.id === id) setView("courses")
    }
  }

  // --- Lesson Handlers ---
  const handleOpenLessonEditor = (lesson?: LessonContent) => {
    if (lesson) {
      setCurrentLesson(lesson)
    } else {
      setCurrentLesson({
        courseId: selectedCourse?.id,
        level: selectedLevel,
        title: "",
        estimatedTime: "55 minutes",
        miniProject: "",
        goals: ["", "", ""],
        ideaAnalogy: "",
        tryItNow: "",
        codeExplanation: [""],
        practiceExercises: { easy: "", medium: "", challenge: "" },
        mainProject: { title: "", description: "", steps: [""], code: "" },
        projectUpgrades: ["", "", ""],
        homework: ["", "", ""],
        completionMessage: "Great job! You've completed this lesson!",
        skillUnlocked: "Python Coder Lv. I",
        nextLessonTease: "Next time, we'll dive into...",
        usefulLinks: [],
      })
    }
    setView("lesson-editor")
  }

  const handleOpenLessonViewer = (lesson: LessonContent) => {
    setCurrentLesson(lesson)
    setView("lesson-view")
  }

  const handleSaveLesson = () => {
    if (currentLesson && currentLesson.title) {
      if ("id" in currentLesson && currentLesson.id) {
        store.updateLessonContent(currentLesson.id, currentLesson)
      } else {
        store.addLessonContent(currentLesson as Omit<LessonContent, "id" | "createdAt">)
      }
      setLessons(store.getLessonContents())
      setView("course-detail")
      setCurrentLesson(null)
    }
  }

  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Delete this lesson?")) {
      store.deleteLessonContent(id)
      setLessons(store.getLessonContents())
    }
  }

  // --- Rendering Helpers ---
  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  )

  const lessonsForSelectedLevel = lessons.filter(l => 
    l.courseId === selectedCourse?.id && l.level === selectedLevel
  )

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header 
          title={
            view === "courses" ? "Course Materials" : 
            view === "course-detail" ? selectedCourse?.title || "Course Details" :
            view === "lesson-view" ? currentLesson?.title || "Lesson Viewer" :
            `Editing: ${currentLesson?.title || "New Lesson"}`
          } 
          subtitle={
            view === "courses" ? `${courses.length} courses available` : 
            view === "course-detail" ? `${selectedLevel} Level` :
            view === "lesson-view" ? "Student View Mode" :
            "Kids Programming Curriculum Designer"
          } 
        />
        
        <main className="p-4 lg:p-6">
          {/* --- Course List View --- */}
          {view === "courses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setCourseDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map((course) => (
                  <Card 
                    key={course.id} 
                    className="group hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
                    onClick={() => {
                      setSelectedCourse(course)
                      setView("course-detail")
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-2">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteCourse(course.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {course.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary">
                        View Levels <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* --- Course Detail View (Levels & Lessons) --- */}
          {view === "course-detail" && selectedCourse && (
            <div className="space-y-6">
              <Button variant="ghost" className="mb-2" onClick={() => setView("courses")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {LEVELS.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    className={cn(
                      "h-16 text-lg font-bold shadow-sm",
                      selectedLevel === level ? "bg-primary" : "hover:bg-primary/5 hover:border-primary"
                    )}
                    onClick={() => setSelectedLevel(level)}
                  >
                    <GraduationCap className="mr-2 h-5 w-5" />
                    {level}
                  </Button>
                ))}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold flex items-center">
                    <BookCheck className="mr-2 h-6 w-6 text-primary" />
                    Lessons for {selectedLevel}
                  </h3>
                  <Button onClick={() => handleOpenLessonEditor()}>
                    <Plus className="mr-2 h-4 w-4" /> Create Lesson
                  </Button>
                </div>

                {lessonsForSelectedLevel.length === 0 ? (
                  <Card className="border-dashed py-12">
                    <CardContent className="flex flex-col items-center text-muted-foreground">
                      <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                      <p>No lessons yet for this level. Start building your curriculum!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {lessonsForSelectedLevel.map((lesson) => (
                      <Card key={lesson.id} className="group hover:border-primary transition-all">
                        <CardHeader className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {lessonsForSelectedLevel.indexOf(lesson) + 1}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {lesson.estimatedTime}</span>
                                  <span className="flex items-center"><Target className="mr-1 h-3 w-3" /> {lesson.miniProject}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <Button variant="outline" size="sm" onClick={() => handleOpenLessonViewer(lesson)}>
                                Open Lesson Content
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenLessonEditor(lesson)}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDeleteLesson(lesson.id, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- Lesson Content Viewer --- */}
          {view === "lesson-view" && currentLesson && (
            <div className="max-w-3xl mx-auto space-y-12 pb-24">
              <Button variant="ghost" className="mb-4" onClick={() => setView("course-detail")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Exit Student View
              </Button>

              {/* 1. Lesson Header */}
              <div className="bg-primary/5 rounded-3xl p-8 border-2 border-primary/20 text-center space-y-4">
                <h1 className="text-4xl font-black text-primary">{currentLesson.title}</h1>
                <div className="flex items-center justify-center gap-6 text-sm font-bold text-muted-foreground">
                  <span className="flex items-center bg-background px-4 py-2 rounded-full border shadow-sm">
                    <Clock className="mr-2 h-4 w-4 text-amber-500" /> {currentLesson.estimatedTime}
                  </span>
                  <span className="flex items-center bg-background px-4 py-2 rounded-full border shadow-sm">
                    <Trophy className="mr-2 h-4 w-4 text-emerald-500" /> Today you will build: {currentLesson.miniProject}
                  </span>
                </div>
              </div>

              {/* 2. Lesson Goal */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" /> Lesson Goal
                </h2>
                <ul className="grid gap-3">
                  {currentLesson.goals?.map((goal, i) => (
                    <li key={i} className="flex items-center gap-3 bg-card p-4 rounded-xl border-l-4 border-l-primary shadow-sm">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="text-lg">{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Explain the Idea */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Lightbulb className="h-6 w-6 text-amber-500" /> Explain the Idea
                </h2>
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed bg-amber-50/30 p-8 rounded-3xl border border-amber-100">
                  {currentLesson.ideaAnalogy?.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>

              {/* 4. Try It Now */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-600">
                  <PlayCircle className="h-6 w-6" /> Try It Now (Instant Coding)
                </h2>
                <div className="rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl">
                  <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-xs font-mono text-slate-400 ml-2">lesson_script.py</span>
                  </div>
                  <pre className="bg-slate-950 p-6 font-mono text-lg text-emerald-400">
                    <code>{currentLesson.tryItNow}</code>
                  </pre>
                </div>
              </div>

              {/* 5. Code Explanation */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-blue-500" /> Code Explanation
                </h2>
                <div className="grid gap-2">
                  {currentLesson.codeExplanation?.map((expl, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2.5 shrink-0" />
                      <p className="text-lg">{expl}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Practice Exercises */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-rose-500" /> Practice Exercises
                </h2>
                <div className="grid gap-4">
                   <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
                      <Badge className="bg-emerald-500 mb-2">Exercise 1: Easy</Badge>
                      <p className="text-lg font-medium text-emerald-900">{currentLesson.practiceExercises?.easy}</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
                      <Badge className="bg-amber-500 mb-2">Exercise 2: Medium</Badge>
                      <p className="text-lg font-medium text-amber-900">{currentLesson.practiceExercises?.medium}</p>
                   </div>
                   <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
                      <Badge className="bg-rose-500 mb-2">Exercise 3: Challenge ⭐</Badge>
                      <p className="text-lg font-medium text-rose-900">{currentLesson.practiceExercises?.challenge}</p>
                   </div>
                </div>
              </div>

              {/* 7. Main Project */}
              <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="h-32 w-32" />
                </div>
                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">MAIN PROJECT</Badge>
                    <h2 className="text-4xl font-black">{currentLesson.mainProject?.title}</h2>
                    <p className="text-xl text-slate-300">{currentLesson.mainProject?.description}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Step-by-Step</h3>
                    <div className="grid gap-4">
                      {currentLesson.mainProject?.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                           <span className="text-2xl font-black text-primary opacity-50">0{i+1}</span>
                           <span className="text-lg">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">The Full Secret Code</h3>
                    <pre className="bg-black/50 p-6 rounded-2xl font-mono text-emerald-400 border border-slate-800">
                      <code>{currentLesson.mainProject?.code}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* 8. Project Upgrades */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-500" /> Project Upgrades (Optional)
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {currentLesson.projectUpgrades?.map((upg, i) => (
                    <div key={i} className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-center">
                      <p className="text-sm font-medium text-purple-900">{upg}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 9. Homework */}
              <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookCheck className="h-8 w-8" /> Homework
                </h2>
                <ul className="grid gap-3">
                  {currentLesson.homework?.map((hw, i) => (
                    <li key={i} className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/20">
                      <span className="h-2 w-2 rounded-full bg-white shrink-0" />
                      <span className="text-lg">{hw}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-indigo-200 text-sm mt-4 italic">Estimated time: Under 15 minutes! Be creative! ✨</p>
              </div>

              {/* Useful Links */}
              {currentLesson.usefulLinks && currentLesson.usefulLinks.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-cyan-500" /> Useful Links
                  </h2>
                  <div className="grid gap-3">
                    {currentLesson.usefulLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-cyan-50/50 hover:bg-cyan-100/50 rounded-xl border border-cyan-100 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-cyan-900 group-hover:text-cyan-700">{link.title}</p>
                          <p className="text-xs text-cyan-600 truncate">{link.url}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Lesson Completion */}
              <div className="text-center py-12 space-y-6">
                 <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <Trophy className="h-10 w-10" />
                 </div>
                 <h2 className="text-4xl font-black">{currentLesson.completionMessage}</h2>
                 <div className="bg-primary/10 inline-block px-8 py-4 rounded-2xl border-2 border-primary/20">
                    <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">New Skill Unlocked</p>
                    <p className="text-2xl font-bold">{currentLesson.skillUnlocked}</p>
                 </div>
                 <p className="text-xl text-muted-foreground animate-bounce mt-8">
                   🚀 {currentLesson.nextLessonTease}
                 </p>
              </div>
            </div>
          )}

          {/* --- Lesson Content Editor --- */}
          {view === "lesson-editor" && currentLesson && (
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur py-4 z-10 border-b">
                <Button variant="ghost" onClick={() => setView("course-detail")}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {selectedLevel} Level
                  </Badge>
                  <Button onClick={handleSaveLesson}>
                    <Save className="mr-2 h-4 w-4" /> Save Lesson
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                {/* 1. Header & Basics */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <Sparkles className="mr-2 h-4 w-4" /> 1. Lesson Basics
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Lesson Title (with emoji)</Label>
                      <Input 
                        value={currentLesson.title} 
                        onChange={e => setCurrentLesson({...currentLesson, title: e.target.value})}
                        placeholder="e.g., Hello World 🐍"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Time</Label>
                      <Input 
                        value={currentLesson.estimatedTime} 
                        onChange={e => setCurrentLesson({...currentLesson, estimatedTime: e.target.value})}
                        placeholder="30-45 minutes"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Today you will build:</Label>
                    <Input 
                      value={currentLesson.miniProject} 
                      onChange={e => setCurrentLesson({...currentLesson, miniProject: e.target.value})}
                      placeholder="My First Program"
                    />
                  </div>
                </section>

                {/* 2. Lesson Goals */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <Target className="mr-2 h-4 w-4" /> 2. Lesson Goals (3 Bullets)
                  </h4>
                  {currentLesson.goals?.map((goal, idx) => (
                    <Input 
                      key={idx}
                      value={goal}
                      onChange={e => {
                        const newGoals = [...(currentLesson.goals || [])]
                        newGoals[idx] = e.target.value
                        setCurrentLesson({...currentLesson, goals: newGoals})
                      }}
                      placeholder={`Goal ${idx + 1}`}
                    />
                  ))}
                </section>

                {/* 3. Explain the Idea */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <Lightbulb className="mr-2 h-4 w-4" /> 3. Explain the Idea (Analogy)
                  </h4>
                  <Textarea 
                    value={currentLesson.ideaAnalogy}
                    onChange={e => setCurrentLesson({...currentLesson, ideaAnalogy: e.target.value})}
                    placeholder="Explain the topic using a real-life analogy..."
                    rows={4}
                  />
                </section>

                {/* 4. Try It Now */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <PlayCircle className="mr-2 h-4 w-4" /> 4. Try It Now (Python Code)
                  </h4>
                  <div className="font-mono text-sm">
                    <Textarea 
                      value={currentLesson.tryItNow}
                      onChange={e => setCurrentLesson({...currentLesson, tryItNow: e.target.value})}
                      placeholder="print('Hello!')"
                      rows={3}
                      className="bg-slate-950 text-emerald-400 border-slate-800 focus-visible:ring-emerald-500"
                    />
                  </div>
                </section>

                {/* 5. Code Explanation */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" /> 5. Code Explanation
                  </h4>
                  {currentLesson.codeExplanation?.map((expl, idx) => (
                    <div key={idx} className="flex gap-2">
                       <Input 
                        value={expl}
                        onChange={e => {
                          const newExp = [...(currentLesson.codeExplanation || [])]
                          newExp[idx] = e.target.value
                          setCurrentLesson({...currentLesson, codeExplanation: newExp})
                        }}
                        placeholder={`Bullet ${idx + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newExp = (currentLesson.codeExplanation || []).filter((_, i) => i !== idx)
                        setCurrentLesson({...currentLesson, codeExplanation: newExp})
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setCurrentLesson({...currentLesson, codeExplanation: [...(currentLesson.codeExplanation || []), ""]})
                  }}>
                    Add Bullet
                  </Button>
                </section>

                {/* 6. Practice Exercises */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                     <GraduationCap className="mr-2 h-4 w-4" /> 6. Practice Exercises
                  </h4>
                  <div className="space-y-3">
                    <Label className="text-emerald-600">Easy (Small Change)</Label>
                    <Input 
                      value={currentLesson.practiceExercises?.easy}
                      onChange={e => setCurrentLesson({...currentLesson, practiceExercises: {...currentLesson.practiceExercises!, easy: e.target.value}})}
                    />
                    <Label className="text-amber-600">Medium (New Idea)</Label>
                    <Input 
                      value={currentLesson.practiceExercises?.medium}
                      onChange={e => setCurrentLesson({...currentLesson, practiceExercises: {...currentLesson.practiceExercises!, medium: e.target.value}})}
                    />
                    <Label className="text-rose-600">Challenge ⭐</Label>
                    <Input 
                      value={currentLesson.practiceExercises?.challenge}
                      onChange={e => setCurrentLesson({...currentLesson, practiceExercises: {...currentLesson.practiceExercises!, challenge: e.target.value}})}
                    />
                  </div>
                </section>

                {/* 7. Main Project */}
                <section className="space-y-4 p-6 border-2 border-primary/20 rounded-2xl bg-primary/5">
                  <h4 className="text-lg font-bold flex items-center text-primary">
                    <Sparkles className="mr-2 h-5 w-5" /> 7. Main Project
                  </h4>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Project Title (with emoji)</Label>
                      <Input 
                        value={currentLesson.mainProject?.title}
                        onChange={e => setCurrentLesson({...currentLesson, mainProject: {...currentLesson.mainProject!, title: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Description</Label>
                      <Textarea 
                        value={currentLesson.mainProject?.description}
                        onChange={e => setCurrentLesson({...currentLesson, mainProject: {...currentLesson.mainProject!, description: e.target.value}})}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Final Python Code</Label>
                      <div className="font-mono text-sm">
                        <Textarea 
                          value={currentLesson.mainProject?.code}
                          onChange={e => setCurrentLesson({...currentLesson, mainProject: {...currentLesson.mainProject!, code: e.target.value}})}
                          placeholder="# Your project code here"
                          rows={8}
                          className="bg-slate-950 text-emerald-400 border-slate-800 focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Useful Links Section */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" /> Useful Links
                  </h4>
                  {currentLesson.usefulLinks?.map((link, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Input 
                          value={link.title}
                          onChange={e => {
                            const newLinks = [...(currentLesson.usefulLinks || [])]
                            newLinks[idx] = { ...newLinks[idx], title: e.target.value }
                            setCurrentLesson({...currentLesson, usefulLinks: newLinks})
                          }}
                          placeholder="Link Title"
                        />
                        <Input 
                          value={link.url}
                          onChange={e => {
                            const newLinks = [...(currentLesson.usefulLinks || [])]
                            newLinks[idx] = { ...newLinks[idx], url: e.target.value }
                            setCurrentLesson({...currentLesson, usefulLinks: newLinks})
                          }}
                          placeholder="https://..."
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newLinks = (currentLesson.usefulLinks || []).filter((_, i) => i !== idx)
                        setCurrentLesson({...currentLesson, usefulLinks: newLinks})
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    setCurrentLesson({...currentLesson, usefulLinks: [...(currentLesson.usefulLinks || []), { title: "", url: "" }]})
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Link
                  </Button>
                </section>

                {/* 8-10. Wrapping Up */}
                <section className="space-y-6">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center">
                    <Trophy className="mr-2 h-4 w-4" /> 8-10. Completion & Homework
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Skill Unlocked Message</Label>
                      <Input 
                        value={currentLesson.skillUnlocked}
                        onChange={e => setCurrentLesson({...currentLesson, skillUnlocked: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next Lesson Tease</Label>
                      <Input 
                        value={currentLesson.nextLessonTease}
                        onChange={e => setCurrentLesson({...currentLesson, nextLessonTease: e.target.value})}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* --- Create Course Dialog --- */}
          <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>Design a new programming curriculum for your students.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Course Title</Label>
                  <Input 
                    placeholder="e.g., Intro to Python 🐍" 
                    value={newCourseData.title}
                    onChange={e => setNewCourseData({...newCourseData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="What will students learn in this course?" 
                    value={newCourseData.description}
                    onChange={e => setNewCourseData({...newCourseData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (Comma separated)</Label>
                  <Input 
                    placeholder="Python, Kids, Games" 
                    value={newCourseData.tags}
                    onChange={e => setNewCourseData({...newCourseData, tags: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateCourse}>Create Course</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
