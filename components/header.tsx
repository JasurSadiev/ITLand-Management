"use client"

import { useState, useEffect } from "react"

import { Bell, Search, Settings, Globe } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string
  subtitle?: string
  user?: {
    name: string
    email?: string
    image?: string
  }
}

export function Header({ title, subtitle, user }: HeaderProps) {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email || "" })
    } else {
      const stored = localStorage.getItem("currentUser")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setProfile({ 
            name: parsed.role === 'student' ? parsed.fullName : parsed.name, 
            email: parsed.contactEmail || parsed.email || "" 
          })
        } catch (e) {
          console.error("Failed to parse user session", e)
        }
      }
    }
  }, [user])

  const handleLogout = async () => {
    // Clear server-side session
    await fetch("/api/auth/logout", { method: "POST" })
    
    // Clear storage
    localStorage.removeItem("currentUser")
    localStorage.removeItem("currentStudent")
    window.location.href = "/login"
  }

  const displayName = profile?.name || "User"
  const displayEmail = profile?.email || ""
  const displayInitials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative bg-transparent">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">
                    {displayInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              const role = document.cookie.match(/user-role=([^;]+)/)?.[1]
              window.location.href = role === 'student' ? '/student/settings' : '/settings'
            }}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
