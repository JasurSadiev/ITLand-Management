"use client"

import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ConfettiProvider } from "@/components/confetti-provider"
import { store } from "@/lib/store"
import { Analytics } from "@vercel/analytics/next"
import { CustomizationProvider, useCustomization } from "@/lib/context"

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CustomizationProvider>
        <ClientLayoutContent>
            {children}
        </ClientLayoutContent>
    </CustomizationProvider>
  )
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const { theme, baseMode } = useCustomization()
  
  // Calculate default base theme (dark/light) based on time
  const currentHour = new Date().getHours()
  const defaultBaseTheme = (currentHour >= 19 || currentHour <= 7) ? "dark" : "light"

  // Check if we are in a dark-like mode for next-themes provider
  const themeProviderMode = (baseMode === 'dark' || baseMode === 'midnight' || baseMode === 'nord') ? 'dark' : 'light'

  return (
    <div className={`theme-${theme} mode-${baseMode} ${baseMode === 'dark' ? 'dark' : ''}`}>
        <ThemeProvider
            attribute="class"
            defaultTheme={baseMode === 'light' || baseMode === 'dark' ? baseMode : themeProviderMode}
            enableSystem={false}
            forcedTheme={baseMode === 'light' || baseMode === 'dark' ? baseMode : themeProviderMode}
            disableTransitionOnChange
        >
            <ConfettiProvider>
                {children}
            </ConfettiProvider>
            <Analytics />
        </ThemeProvider>
    </div>
  )
}
