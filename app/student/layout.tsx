import { StudentSidebar } from "@/components/student-sidebar"
import { Header } from "@/components/header"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}
