"use client"

import { StudentSidebar } from "@/components/student-sidebar"
import type { Student } from "@/lib/types"
import { useCustomization } from "@/lib/context"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useCustomization()

  return (
    <div className={`min-h-screen bg-background theme-${theme}`}>
      <StudentSidebar theme={theme} />
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}
