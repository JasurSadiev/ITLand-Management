import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ITLand - Teacher Admin Panel",
  description: "Manage your private lessons, students, payments, and more",
  generator: "v0.app",
// ... icons ...
}

import { ThemeProvider } from "@/components/theme-provider"

// ... font and metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Calculate default theme based on current hour for initial load if no preference
  const currentHour = new Date().getHours()
  const defaultTheme = (currentHour >= 19 || currentHour <= 7) ? "dark" : "light"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
