"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import ReactConfetti from "react-confetti"
import { useWindowSize } from "react-use"

interface ConfettiContextType {
  fire: () => void
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined)

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const [isFiring, setIsFiring] = useState(false)
  const { width, height } = useWindowSize()

  const fire = useCallback(() => {
    setIsFiring(true)
    setTimeout(() => setIsFiring(false), 5000)
  }, [])

  return (
    <ConfettiContext.Provider value={{ fire }}>
      {isFiring && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.15}
          className="z-[9999] pointer-events-none"
        />
      )}
      {children}
    </ConfettiContext.Provider>
  )
}

export const useConfetti = () => {
  const context = useContext(ConfettiContext)
  if (!context) {
    throw new Error("useConfetti must be used within a ConfettiProvider")
  }
  return context
}
