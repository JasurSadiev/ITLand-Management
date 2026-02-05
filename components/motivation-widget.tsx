"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Quote, Sparkles } from "lucide-react"

const QUOTES = [
  "The only way to learn a new programming language is by writing programs in it.",
  "Education is the most powerful weapon which you can use to change the world.",
  "First, solve the problem. Then, write the code.",
  "Talk is cheap. Show me the code.",
  "Knowledge is power. Information is liberating.",
  "Code is like humor. When you have to explain it, it’s bad.",
  "Mistakes are proof that you are trying.",
  "Programming isn't about what you know; it's about what you can figure out.",
  "The beautiful thing about learning is that nobody can take it away from you.",
]

export function MotivationWidget() {
  const [quote, setQuote] = useState("")

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length)
    setQuote(QUOTES[randomIndex])
  }, [])

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20 shadow-sm overflow-hidden group">
      <CardContent className="p-6 relative">
        <Sparkles className="absolute top-2 right-2 h-4 w-4 text-primary/40 group-hover:rotate-12 transition-transform" />
        <Quote className="h-5 w-5 text-primary mb-3 opacity-50" />
        <p className="text-sm font-medium text-foreground/80 italic leading-relaxed">
          "{quote}"
        </p>
        <div className="mt-4 flex items-center gap-2">
            <div className="h-1 w-8 bg-primary/30 rounded-full" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Daily Insight</span>
        </div>
      </CardContent>
    </Card>
  )
}
