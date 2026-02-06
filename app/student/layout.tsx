"use client"

import { StudentSidebar } from "@/components/student-sidebar"
import type { Student } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme, sidebarCollapsed } = useCustomization()

  return (
    <div className={cn("min-h-screen bg-background transition-all duration-300 ease-in-out", `theme-${theme}`)}>
      <StudentSidebar theme={theme} />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {children}
      </div>
    </div>
  )
}
