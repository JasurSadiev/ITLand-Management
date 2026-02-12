"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Student, User } from '@/lib/types'
import { api } from '@/lib/api'
import { store } from '@/lib/store'

interface CustomizationContextType {
  theme: string
  setTheme: (theme: string) => void
  baseMode: "light" | "dark"
  setBaseMode: (mode: "light" | "dark") => void
  preferences: any
  updatePreferences: (newPrefs: any) => Promise<void>
  refreshPreferences: () => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined)

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("indigo")
  const [baseMode, setBaseMode] = useState<"light" | "dark">("light")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [preferences, setPreferences] = useState<any>({})

  const loadPreferences = useCallback(() => {
    if (typeof window === "undefined") return

    // Load sidebar state
    const storedSidebar = localStorage.getItem("sidebarCollapsed")
    if (storedSidebar !== null) {
      setSidebarCollapsed(storedSidebar === "true")
    }

    const storedUser = localStorage.getItem("currentUser") || localStorage.getItem("currentStudent")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser)
        const prefs = parsed.preferences || {}
        setPreferences(prefs)
        if (prefs.theme) {
          setTheme(prefs.theme)
        }
        if (prefs.baseMode === 'dark' || prefs.baseMode === 'light') {
          setBaseMode(prefs.baseMode)
        } else {
            // Default based on time if not set
            const currentHour = new Date().getHours()
            const autoMode = (currentHour >= 19 || currentHour <= 7) ? "dark" : "light"
            setBaseMode(autoMode)
        }
      } catch (e) {
        console.error("Failed to parse user preferences", e)
      }
    }
  }, [])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  // Apply theme
  useEffect(() => {
    if (typeof window === "undefined") return
    const root = document.documentElement

    // Toggle dark mode class
    if (baseMode === 'dark') {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
  }, [baseMode])

  const updatePreferences = async (newPrefs: any) => {
    const updatedPrefs = { ...preferences, ...newPrefs }
    setPreferences(updatedPrefs)
    if (newPrefs.theme) {
      setTheme(newPrefs.theme)
    }
    if (newPrefs.baseMode) {
      setBaseMode(newPrefs.baseMode)
    }

    // Persist to storage and API
    const storedUserStr = localStorage.getItem("currentUser") || localStorage.getItem("currentStudent")
    if (storedUserStr) {
        const parsed = JSON.parse(storedUserStr)
        const isStudent = parsed.role === 'student' || !!parsed.fullName
        
        parsed.preferences = updatedPrefs
        const key = isStudent ? "currentStudent" : "currentUser"
        localStorage.setItem(key, JSON.stringify(parsed))

        try {
            if (isStudent) {
                await api.updateStudent(parsed.id, { preferences: updatedPrefs })
            } else {
                // For teacher, update local store AND DB
                const currentUser = store.getCurrentUser()
                store.setCurrentUser({ ...currentUser, preferences: updatedPrefs })
                try {
                   await api.updateTeacherAvailability({ preferences: updatedPrefs })
                } catch (innerE) {
                   console.warn("Failed to sync teacher prefs to DB, but local saved", innerE)
                }
            }
        } catch (e) {
            console.error("Failed to sync preferences to API", e)
        }
    }
  }

  return (
    <CustomizationContext.Provider value={{ 
        theme: preferences.themeId || 'light', 
        setTheme: (t) => updatePreferences({ themeId: t }), 
        baseMode,
        setBaseMode: (m) => updatePreferences({ baseMode: m }),
        preferences, 
        updatePreferences,
        refreshPreferences: loadPreferences,
        sidebarCollapsed,
        setSidebarCollapsed: (collapsed: boolean) => {
          setSidebarCollapsed(collapsed)
          localStorage.setItem("sidebarCollapsed", String(collapsed))
        },
        mobileMenuOpen,
        setMobileMenuOpen
    }}>
      {children}
    </CustomizationContext.Provider>
  )
}

export function useCustomization() {
  const context = useContext(CustomizationContext)
  if (context === undefined) {
    throw new Error('useCustomization must be used within a CustomizationProvider')
  }
  return context
}
