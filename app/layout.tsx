import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ITLand | Management Portal for Teachers & Students",
  description: "Secure management platform for ITLand lessons, students, and curriculum. Access your schedule, homework, and payments in one place.",
  keywords: ["ITLand", "education", "management", "learning", "student portal", "teacher admin"],
  authors: [{ name: "ITLand Team" }],
  creator: "ITLand",
  publisher: "ITLand",
  robots: "index, follow",
}

import { ClientLayoutWrapper } from "@/components/client-layout-wrapper"

// ... font and metadata ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${_geist.className} font-sans antialiased`}>
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  )
}
