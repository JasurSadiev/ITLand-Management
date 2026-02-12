"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import { Bell, Search, Settings, Globe, Sparkles, Moon, Sun, Menu, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { useCustomization } from "@/lib/context"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"

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
  const [profile, setProfile] = useState<{ name: string; email: string; preferences?: any } | null>(null)
  const [greeting, setGreeting] = useState(title)
  const { theme, setTheme, baseMode, setBaseMode, preferences, setMobileMenuOpen } = useCustomization()

  const THEMES = [
// ... (rest of themes)
    { name: "indigo", color: "#4f46e5" },
    { name: "rose", color: "#e11d48" },
    { name: "emerald", color: "#10b981" },
    { name: "amber", color: "#d97706" },
    { name: "violet", color: "#7c3aed" },
  ]

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/student')) return

    const fetchUnread = async () => {
        try {
            // Only fetch if we are likely a teacher (or just try, it won't hurt, RLS protects)
            const count = await api.getUnreadMessageCount()
            setUnreadCount(count)
        } catch (e) {
            // Ignore error (e.g. if student or not logged in)
        }
    }

    fetchUnread()

    // Subscribe to changes to update count
    const channel = supabase
        .channel('header-chat-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
             fetchUnread()
        })
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const updateHeaderDetails = () => {
        const stored = localStorage.getItem("currentUser") || localStorage.getItem("currentStudent")
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                const isStudent = parsed.role === 'student' || !!parsed.fullName
                const prefs = parsed.preferences || {}
                
                setProfile({ 
                    name: isStudent ? parsed.fullName : parsed.name, 
                    email: parsed.contactEmail || parsed.email || "",
                    preferences: prefs
                })

                // Calculate personalized greeting if title is "Dashboard" or "Welcome"
                if (title.toLowerCase().includes("dashboard") || title.toLowerCase().includes("welcome")) {
                    const name = isStudent ? parsed.fullName.split(" ")[0] : parsed.name.split(" ")[0]
                    const style = prefs.greetingStyle || "default"
                    
                    switch (style) {
                        case "motivator":
                            setGreeting(`Keep pushing, ${name}! 🚀`)
                            break
                        case "space":
                            setGreeting(`Ready for launch, ${name}? 🌌`)
                            break
                        case "cyber":
                            setGreeting(`System Online: Hello ${name} ⚡`)
                            break
                        default:
                            setGreeting(`Welcome back, ${name}`)
                    }
                } else {
                    setGreeting(title)
                }
            } catch (e) {
                console.error("Failed to parse user session", e)
                setGreeting(title)
            }
        }
    }

    if (user) {
      setProfile({ name: user.name, email: user.email || "" })
    } else {
      updateHeaderDetails()
    }
  }, [user, title, preferences.greetingStyle]) // Depend on greetingStyle for real-time update

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

  const pathname = usePathname()
  const isStudent = pathname?.startsWith("/student")

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{greeting}</h1>
          {subtitle && <p className="text-sm text-muted-foreground hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 pl-9" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-muted/50 rounded-full h-9 w-9 border border-border/50 hover:bg-muted transition-all">
                    {baseMode === 'dark' ? <Moon className="h-4.5 w-4.5 text-indigo-400" /> : <Sun className="h-4.5 w-4.5 text-amber-500" />}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2">
                <DropdownMenuItem onClick={() => setBaseMode('light')} className="flex items-center gap-3 rounded-md cursor-pointer">
                    <Sun className="h-4 w-4 text-amber-500" /> <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBaseMode('dark')} className="flex items-center gap-3 rounded-md cursor-pointer">
                    <Moon className="h-4 w-4 text-indigo-400" /> <span>Dark</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {!isStudent && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative bg-transparent h-9 w-9"
                    onClick={() => window.location.href = '/chat'}
                >
                    <MessageSquare className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            )}

            {/* <Button variant="ghost" size="icon" className="relative bg-transparent h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
          </Button> */}
        </div>
      </div>

      {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {profile?.preferences?.avatarEmoji || displayInitials}
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
            <DropdownMenuItem onClick={() => {
              window.location.href = '/settings/availability'
            }}>
              Availability
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
