"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// Use BookOpen as logo icon, LogOut for logout
import { BookOpen, LogOut, LayoutDashboard, Calendar, FileText, Settings, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useCustomization } from "@/lib/context"
import { Button } from "./ui/button"

const navigation = [
  { name: "Dashboard", href: "/student", icon: LayoutDashboard },
  { name: "Schedule", href: "/student/schedule", icon: Calendar },
  { name: "Homework", href: "/student/homework", icon: FileText },
  { name: "Settings", href: "/student/settings", icon: Settings },
]

interface StudentSidebarProps {
  theme?: string
}

export function StudentSidebar({ theme: propTheme }: StudentSidebarProps) {
  const pathname = usePathname()
  const { theme: contextTheme, preferences, sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useCustomization()
  const theme = propTheme || contextTheme

  const sidebarClasses = cn(
    "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 ease-in-out",
    sidebarCollapsed ? "w-20" : "w-64",
    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
  )

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-border px-6",
            sidebarCollapsed && "justify-center px-0"
          )}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              {!sidebarCollapsed && <span className="text-lg font-semibold text-foreground">ITLand</span>}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    sidebarCollapsed && "justify-center px-0 gap-0"
                  )}
                  title={sidebarCollapsed ? item.name : ""}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Profile & Logout */}
          <div className="border-t border-border px-3 py-4 space-y-2">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
                  {preferences?.avatarEmoji || "👨‍💻"}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">
                        {typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentStudent") || "{}").fullName || "Student" : "Student"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">Student</p>
                </div>
              </div>
            )}

            {sidebarCollapsed && (
              <div className="flex justify-center py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xl ring-2 ring-primary/20">
                  {preferences?.avatarEmoji || "👨‍💻"}
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                localStorage.removeItem("currentUser")
                localStorage.removeItem("currentStudent")
                window.location.href = "/login"
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive",
                sidebarCollapsed && "justify-center px-0 gap-0"
              )}
              title={sidebarCollapsed ? "Logout" : ""}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>

            {/* Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="mt-4 hidden w-full lg:flex items-center justify-center gap-2 border border-border/50 bg-muted/30"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
