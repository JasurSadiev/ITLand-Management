"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Save, Shield } from "lucide-react"
import { store } from "@/lib/store"
import { PersonalizationCard } from "@/components/personalization-card"
import type { User } from "@/lib/types"

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUser(store.getCurrentUser())
  }, [])

  if (!mounted || !user) {
    return null
  }

  const handleSave = () => {
    if (user) {
      store.setCurrentUser(user)
      alert("Settings saved!")
    }
  }

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all data? This will restore the demo data.")) {
      store.resetAll()
      window.location.reload()
    }
  }

  const handleUpdatePreferences = (updates: Partial<User["preferences"]>) => {
    if (!user) return
    const updatedUser = { 
        ...user, 
        preferences: { ...(user.preferences || {}), ...updates } 
    }
    setUser(updatedUser)
    store.setCurrentUser(updatedUser)
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header title="Settings" subtitle="Manage your account and preferences" />
        <main className="p-6">
          <div className="max-w-2xl space-y-6">
            {/* Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <Badge className="mt-1 capitalize">{user.role}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={user.role}
                    onValueChange={(value: "teacher" | "assistant") => setUser({ ...user, role: value })}
                  >
                    <SelectTrigger className="sm:max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher (Full Access)</SelectItem>
                      <SelectItem value="assistant">Assistant (Limited Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <PersonalizationCard 
                preferences={user.preferences || {}} 
                onChange={(updates) => handleUpdatePreferences(updates as any)} 
            />

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions
                </CardTitle>
                <CardDescription>Role-based access control</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Teacher</p>
                        <p className="text-sm text-muted-foreground">Full access to all features</p>
                      </div>
                      {user.role === "teacher" && <Badge>Current</Badge>}
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <li>- Manage all students and lessons</li>
                      <li>- Access payment and finance data</li>
                      <li>- View all insights and analytics</li>
                      <li>- Manage settings and permissions</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Assistant</p>
                        <p className="text-sm text-muted-foreground">Limited edit access</p>
                      </div>
                      {user.role === "assistant" && <Badge>Current</Badge>}
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <li>- View students and lessons</li>
                      <li>- Schedule and manage lessons</li>
                      <li>- Cannot access payment data</li>
                      <li>- Cannot modify settings</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Reset or export your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <p className="font-medium text-destructive">Reset All Data</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will reset all students, lessons, payments, and other data to the demo defaults.
                  </p>
                  <Button variant="destructive" className="mt-4" onClick={handleResetData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Demo Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About TeachFlow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  TeachFlow is a teacher admin panel for managing private lessons, students, payments, and more. This is
                  a demo version using localStorage for data persistence.
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Version 1.0.0</span>
                  <span>|</span>
                  <span>Demo Mode</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
