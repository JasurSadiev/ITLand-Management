import type { Student, Lesson, Payment, Package, Homework, Material, User } from "./types"

// Mock data store with localStorage persistence
const STORAGE_KEYS = {
  students: "teacher-admin-students",
  lessons: "teacher-admin-lessons",
  payments: "teacher-admin-payments",
  packages: "teacher-admin-packages",
  homework: "teacher-admin-homework",
  materials: "teacher-admin-materials",
  currentUser: "teacher-admin-user",
}

// Initial mock data
const initialStudents: Student[] = [
  {
    id: "1",
    fullName: "Emma Wilson",
    age: 14,
    parentName: "Sarah Wilson",
    contactPhone: "+1 555-0101",
    contactEmail: "sarah.wilson@email.com",
    timezone: "America/New_York",
    lessonType: "1-on-1",
    subjects: ["Python", "Scratch"],
    lessonPrice: 50,
    paymentModel: "package",
    status: "active",
    tags: ["Beginner", "Kids"],
    lessonBalance: 4,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    fullName: "James Chen",
    age: 16,
    parentName: "Michael Chen",
    contactPhone: "+1 555-0102",
    contactEmail: "m.chen@email.com",
    timezone: "America/Los_Angeles",
    lessonType: "1-on-1",
    subjects: ["JavaScript", "React"],
    lessonPrice: 60,
    paymentModel: "per-lesson",
    status: "active",
    tags: ["Intermediate", "Web Dev"],
    lessonBalance: 0,
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "3",
    fullName: "Sofia Rodriguez",
    age: 12,
    parentName: "Maria Rodriguez",
    contactPhone: "+1 555-0103",
    contactEmail: "maria.r@email.com",
    timezone: "America/Chicago",
    lessonType: "1-on-1",
    subjects: ["Roblox", "Lua"],
    lessonPrice: 45,
    paymentModel: "monthly",
    status: "active",
    tags: ["Beginner", "Game Dev", "Roblox"],
    lessonBalance: 4,
    createdAt: "2024-02-10",
    updatedAt: "2024-02-10",
  },
  {
    id: "4",
    fullName: "Oliver Thompson",
    age: 17,
    contactEmail: "oliver.t@email.com",
    timezone: "Europe/London",
    lessonType: "1-on-1",
    subjects: ["Python", "Data Science"],
    lessonPrice: 55,
    paymentModel: "package",
    status: "paused",
    notes: "Preparing for university exams",
    tags: ["Advanced", "Exam Prep"],
    lessonBalance: 1,
    createdAt: "2024-01-20",
    updatedAt: "2024-03-01",
  },
]

const today = new Date()
const formatDate = (d: Date) => d.toISOString().split("T")[0]

const initialLessons: Lesson[] = [
  {
    id: "l1",
    studentIds: ["1"],
    date: formatDate(today),
    time: "10:00",
    duration: 60,
    status: "upcoming",
    paymentStatus: "package",
    subject: "Python",
    createdAt: "2024-03-01",
  },
  {
    id: "l2",
    studentIds: ["2"],
    date: formatDate(today),
    time: "14:00",
    duration: 60,
    status: "upcoming",
    paymentStatus: "unpaid",
    subject: "React",
    createdAt: "2024-03-01",
  },
  {
    id: "l3",
    studentIds: ["3"],
    date: formatDate(new Date(today.getTime() + 86400000)),
    time: "16:00",
    duration: 45,
    status: "upcoming",
    paymentStatus: "paid",
    subject: "Roblox",
    createdAt: "2024-03-01",
  },
  {
    id: "l4",
    studentIds: ["1"],
    date: formatDate(new Date(today.getTime() - 86400000 * 2)),
    time: "10:00",
    duration: 60,
    status: "completed",
    paymentStatus: "package",
    subject: "Scratch",
    notes: "Completed game project",
    createdAt: "2024-02-28",
  },
  {
    id: "l5",
    studentIds: ["2"],
    date: formatDate(new Date(today.getTime() - 86400000 * 3)),
    time: "14:00",
    duration: 60,
    status: "cancelled-student",
    paymentStatus: "unpaid",
    subject: "JavaScript",
    createdAt: "2024-02-27",
  },
]

const initialPayments: Payment[] = [
  {
    id: "p1",
    studentId: "1",
    amount: 200,
    method: "transfer",
    date: "2024-03-01",
    lessonIds: [],
    notes: "Package of 4 lessons",
    createdAt: "2024-03-01",
  },
  {
    id: "p2",
    studentId: "3",
    amount: 180,
    method: "card",
    date: "2024-03-01",
    lessonIds: [],
    notes: "Monthly subscription",
    createdAt: "2024-03-01",
  },
]

const initialPackages: Package[] = [
  {
    id: "pkg1",
    studentId: "1",
    totalLessons: 4,
    remainingLessons: 2,
    amount: 200,
    purchaseDate: "2024-03-01",
    status: "active",
  },
  {
    id: "pkg2",
    studentId: "4",
    totalLessons: 8,
    remainingLessons: 1,
    amount: 400,
    purchaseDate: "2024-01-20",
    expiryDate: "2024-04-20",
    status: "active",
  },
]

const initialHomework: Homework[] = [
  {
    id: "h1",
    lessonId: "l4",
    studentId: "1",
    title: "Complete Snake Game",
    description: "Finish the snake game project we started in class",
    dueDate: formatDate(new Date(today.getTime() + 86400000 * 3)),
    timezone: "UTC",
    status: "assigned",
    attachments: [],
    createdAt: "2024-03-01",
  },
]

const initialMaterials: Material[] = [
  {
    id: "m1",
    title: "Python Basics Guide",
    description: "Introduction to Python programming",
    type: "link",
    url: "https://python.org/docs",
    tags: ["Python", "Beginner"],
    createdAt: "2024-01-01",
  },
]

const defaultUser: User = {
  id: "u1",
  name: "Alex Teacher",
  email: "alex@teacherapp.com",
  role: "teacher",
}

// Helper to safely access localStorage
function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error("Failed to save to localStorage")
  }
}

// Store functions
export const store = {
  // Students
  getStudents: (): Student[] => getStorage(STORAGE_KEYS.students, initialStudents).map(s => ({
    ...s,
    preferences: s.preferences || {
      theme: "indigo",
      avatarEmoji: "👨‍💻",
      greetingStyle: "default",
      confettiEnabled: true,
      showMotivation: true
    }
  })),
  setStudents: (students: Student[]) => setStorage(STORAGE_KEYS.students, students),
  addStudent: (student: Omit<Student, "id" | "createdAt" | "updatedAt">): Student => {
    const students = store.getStudents()
    const newStudent: Student = {
      ...student,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }
    store.setStudents([...students, newStudent])
    return newStudent
  },
  updateStudent: (id: string, updates: Partial<Student>): Student | null => {
    const students = store.getStudents()
    const index = students.findIndex((s) => s.id === id)
    if (index === -1) return null
    students[index] = { ...students[index], ...updates, updatedAt: new Date().toISOString().split("T")[0] }
    store.setStudents(students)
    return students[index]
  },
  deleteStudent: (id: string) => {
    const students = store.getStudents().filter((s) => s.id !== id)
    store.setStudents(students)
  },

  // Lessons
  getLessons: (): Lesson[] => getStorage(STORAGE_KEYS.lessons, initialLessons),
  setLessons: (lessons: Lesson[]) => setStorage(STORAGE_KEYS.lessons, lessons),
  addLesson: (lesson: Omit<Lesson, "id" | "createdAt">): Lesson => {
    const lessons = store.getLessons()
    const newLesson: Lesson = {
      ...lesson,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    store.setLessons([...lessons, newLesson])
    return newLesson
  },
  updateLesson: (id: string, updates: Partial<Lesson>): Lesson | null => {
    const lessons = store.getLessons()
    const index = lessons.findIndex((l) => l.id === id)
    if (index === -1) return null
    lessons[index] = { ...lessons[index], ...updates }
    store.setLessons(lessons)
    return lessons[index]
  },
  deleteLesson: (id: string) => {
    const lessons = store.getLessons().filter((l) => l.id !== id)
    store.setLessons(lessons)
  },

  // Payments
  getPayments: (): Payment[] => getStorage(STORAGE_KEYS.payments, initialPayments),
  setPayments: (payments: Payment[]) => setStorage(STORAGE_KEYS.payments, payments),
  addPayment: (payment: Omit<Payment, "id" | "createdAt">): Payment => {
    const payments = store.getPayments()
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    store.setPayments([...payments, newPayment])
    return newPayment
  },

  // Packages
  getPackages: (): Package[] => getStorage(STORAGE_KEYS.packages, initialPackages),
  setPackages: (packages: Package[]) => setStorage(STORAGE_KEYS.packages, packages),
  addPackage: (pkg: Omit<Package, "id">): Package => {
    const packages = store.getPackages()
    const newPackage: Package = { ...pkg, id: Date.now().toString() }
    store.setPackages([...packages, newPackage])
    return newPackage
  },
  updatePackage: (id: string, updates: Partial<Package>): Package | null => {
    const packages = store.getPackages()
    const index = packages.findIndex((p) => p.id === id)
    if (index === -1) return null
    packages[index] = { ...packages[index], ...updates }
    store.setPackages(packages)
    return packages[index]
  },

  // Homework
  getHomework: (): Homework[] => getStorage(STORAGE_KEYS.homework, initialHomework),
  setHomework: (homework: Homework[]) => setStorage(STORAGE_KEYS.homework, homework),
  addHomework: (hw: Omit<Homework, "id" | "createdAt">): Homework => {
    const homework = store.getHomework()
    const newHw: Homework = {
      ...hw,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    store.setHomework([...homework, newHw])
    return newHw
  },
  updateHomework: (id: string, updates: Partial<Homework>): Homework | null => {
    const homework = store.getHomework()
    const index = homework.findIndex((h) => h.id === id)
    if (index === -1) return null
    homework[index] = { ...homework[index], ...updates }
    store.setHomework(homework)
    return homework[index]
  },

  // Materials
  getMaterials: (): Material[] => getStorage(STORAGE_KEYS.materials, initialMaterials),
  setMaterials: (materials: Material[]) => setStorage(STORAGE_KEYS.materials, materials),
  addMaterial: (material: Omit<Material, "id" | "createdAt">): Material => {
    const materials = store.getMaterials()
    const newMaterial: Material = {
      ...material,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
    }
    store.setMaterials([...materials, newMaterial])
    return newMaterial
  },

  // User
  getCurrentUser: (): User => {
    const user = getStorage(STORAGE_KEYS.currentUser, defaultUser)
    return {
      ...user,
      workingHours: user.workingHours || [
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", active: true },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", active: true },
      ],
      blackoutSlots: user.blackoutSlots || []
    }
  },
  setCurrentUser: (user: User) => setStorage(STORAGE_KEYS.currentUser, user),

  // Reset all data
  resetAll: () => {
    store.setStudents(initialStudents)
    store.setLessons(initialLessons)
    store.setPayments(initialPayments)
    store.setPackages(initialPackages)
    store.setHomework(initialHomework)
    store.setMaterials(initialMaterials)
    store.setCurrentUser(defaultUser)
  },
}
