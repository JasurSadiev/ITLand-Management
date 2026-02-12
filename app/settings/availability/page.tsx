"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Clock, Calendar as CalendarIcon, Save, Plus, ArrowLeft, RefreshCw } from "lucide-react"
import { store } from "@/lib/store"
import { User } from "@/lib/types"
import { toast } from "sonner"
import { TIMEZONES } from "@/lib/constants"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api"

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
]

export default function AvailabilityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadAvailability() {
        try {
            const data = await api.getTeacherAvailability()
            setUser(data)
        } catch (error) {
            console.error("Failed to load availability:", error)
            toast.error("Failed to load settings from server.")
            // Fallback to local store
            setUser(store.getCurrentUser())
        } finally {
            setLoading(false)
        }
    }
    loadAvailability()
  }, [])

  const handleAddSlot = (dayIndex: number) => {
    if (!user) return
    const currentHours = user.workingHours || []
    const newSlot = { 
      id: Math.random().toString(36).substring(2, 11), 
      dayOfWeek: dayIndex, 
      startTime: "09:00", 
      endTime: "17:00", 
      active: true 
    }
    setUser({ ...user, workingHours: [...currentHours, newSlot] })
  }

  const handleRemoveSlot = (dayIndex: number, slotIndex: number) => {
    if (!user) return
    const daySlots = (user.workingHours || []).filter(h => h.dayOfWeek === dayIndex)
    const otherSlots = (user.workingHours || []).filter(h => h.dayOfWeek !== dayIndex)
    
    const updatedDaySlots = daySlots.filter((_, i) => i !== slotIndex)
    setUser({ ...user, workingHours: [...otherSlots, ...updatedDaySlots] })
  }

  const handleUpdateTime = (dayIndex: number, slotIndex: number, field: "startTime" | "endTime", value: string) => {
    if (!user) return
    const allSlots = [...(user.workingHours || [])]
    const daySlots = allSlots.filter(h => h.dayOfWeek === dayIndex)
    daySlots[slotIndex] = { ...daySlots[slotIndex], [field]: value }
    
    const otherSlots = allSlots.filter(h => h.dayOfWeek !== dayIndex)
    setUser({ ...user, workingHours: [...otherSlots, ...daySlots] })
  }

  const handleUpdateTimezone = (tz: string) => {
    if (!user) return
    setUser({ ...user, timezone: tz })
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
        await api.updateTeacherAvailability({
            workingHours: user.workingHours,
            timezone: user.timezone
        })
        store.setCurrentUser(user) // Sync local store too
        toast.success("Availability saved successfully!")
    } catch (error) {
        console.error("Save failed:", error)
        toast.error("Failed to save settings. Please try again.")
    } finally {
        setSaving(false)
    }
  }

  const handleAddBlackout = async () => {
    const date = prompt("Enter date (YYYY-MM-DD):", new Date().toISOString().split("T")[0])
    if (!date) return
    
    const startTime = prompt("Enter start time (HH:MM):", "09:00")
    if (!startTime) return
    
    const endTime = prompt("Enter end time (HH:MM):", "17:00")
    if (!endTime) return

    const notes = prompt("Enter notes (optional):") || ""

    try {
        await api.addBlackoutSlot({ date, startTime, endTime, notes })
        toast.success("Blackout slot added!")
        // Refresh data
        setLoading(true)
        const data = await api.getTeacherAvailability()
        setUser(data)
    } catch (error) {
        toast.error("Failed to add blackout slot.")
    } finally {
        setLoading(false)
    }
  }

  const handleDeleteBlackout = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blackout slot?")) return
    try {
        await api.deleteBlackoutSlot(id)
        toast.success("Blackout slot deleted.")
        // Refresh data
        setLoading(true)
        const data = await api.getTeacherAvailability()
        setUser(data)
    } catch (error) {
        toast.error("Failed to delete blackout slot.")
    } finally {
        setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
      <div className="flex flex-col gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Availability Settings</h1>
            <p className="text-muted-foreground">Manage your working hours and blackout slots for the rescheduling system.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 h-11 px-6 text-primary-foreground">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Schedule & Timezone</CardTitle>
                <CardDescription>Set your standard working shifts. Times will be converted relative to your students.</CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">My Timezone:</Label>
                <Select value={user?.timezone || "UTC"} onValueChange={handleUpdateTimezone}>
                    <SelectTrigger className="w-[240px] bg-background">
                        <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border pt-6">
          {DAYS.map((day, dayIndex) => {
            const daySlots = (user?.workingHours || []).filter(h => h.dayOfWeek === dayIndex)
            const hasSlots = daySlots.length > 0

            return (
              <div key={day} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 md:gap-8">
                <div className="w-32 flex flex-col gap-1">
                  <span className="font-semibold text-lg text-foreground">{day}</span>
                  {!hasSlots && <span className="text-xs text-muted-foreground italic">Unavailable</span>}
                </div>

                <div className="flex-1 space-y-3">
                  {daySlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="time" 
                          value={slot.startTime} 
                          onChange={(e) => handleUpdateTime(dayIndex, slotIndex, "startTime", e.target.value)}
                          className="w-32 bg-background border-border"
                        />
                        <span className="text-muted-foreground text-sm font-medium">to</span>
                        <Input 
                          type="time" 
                          value={slot.endTime} 
                          onChange={(e) => handleUpdateTime(dayIndex, slotIndex, "endTime", e.target.value)}
                          className="w-32 bg-background border-border"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveSlot(dayIndex, slotIndex)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAddSlot(dayIndex)}
                    className="border-dashed border-2 bg-transparent text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Shift
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b bg-muted/20">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Blackout Slots</CardTitle>
                  <CardDescription>Add one-off dates when you are completely unavailable.</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddBlackout} className="border-amber-200 hover:bg-amber-50">
                <Plus className="h-4 w-4 mr-2" /> Add Blackout
              </Button>
           </div>
        </CardHeader>
        <CardContent className="pt-6">
           {user?.blackoutSlots && user.blackoutSlots.length > 0 ? (
             <div className="space-y-3">
               {user.blackoutSlots.map((slot) => (
                 <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                       <div className="bg-amber-50 p-2 rounded text-amber-700 font-bold text-xs">
                          {slot.date}
                       </div>
                       <div>
                          <p className="font-medium text-sm">{slot.startTime} - {slot.endTime}</p>
                          {slot.notes && <p className="text-xs text-muted-foreground">{slot.notes}</p>}
                       </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => slot.id && handleDeleteBlackout(slot.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                       <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground italic">No blackout slots added.</p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  )
}
