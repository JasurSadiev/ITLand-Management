"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, Search, Filter, Mail, Phone, Link as LinkIcon, Copy, Check } from "lucide-react"
import type { Student } from "@/lib/types"
import { cn, copyToClipboard } from "@/lib/utils"

interface StudentTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (id: string) => void
  onView: (student: Student) => void
}

export function StudentTable({ students, onEdit, onDelete, onView }: StudentTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStudentForLink, setSelectedStudentForLink] = useState<Student | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      student.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    finished: "bg-gray-100 text-gray-700",
  }

  const paymentModelLabels = {
    "per-lesson": "Per Lesson",
    package: "Package",
    monthly: "Monthly",
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students, subjects, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("paused")}>Paused</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("finished")}>Finished</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(student)}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{student.fullName}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {student.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{student.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map((subject) => (
                        <span key={subject} className="text-sm text-muted-foreground">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${student.lessonPrice}</p>
                      <p className="text-xs text-muted-foreground">{paymentModelLabels[student.paymentModel]}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[student.status]}`}>
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {student.contactEmail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `mailto:${student.contactEmail}`
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      {student.contactPhone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `tel:${student.contactPhone}`
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(student)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(student)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStudentForLink(student)
                          setIsCopied(false)
                        }}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Copy Portal Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(student.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedStudentForLink} onOpenChange={(open) => !open && setSelectedStudentForLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Reschedule Portal</DialogTitle>
            <DialogDescription>
              Any parent with this link can reschedule lessons for {selectedStudentForLink?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <label htmlFor="link" className="sr-only">
                Link
              </label>
              <Input
                id="link"
                readOnly
                value={selectedStudentForLink ? `${window.location.origin}/reschedule/student/${selectedStudentForLink.id}` : ""}
                className="h-9 px-3 text-xs"
              />
            </div>
            <Button 
                size="sm" 
                className="px-3"
                onClick={async () => {
                    if (selectedStudentForLink) {
                        const url = `${window.location.origin}/reschedule/student/${selectedStudentForLink.id}`
                        const success = await copyToClipboard(url)
                        if (success) {
                            setIsCopied(true)
                            setTimeout(() => setIsCopied(false), 2000)
                        }
                    }
                }}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
