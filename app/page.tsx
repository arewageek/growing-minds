"use client"

import { useState, useCallback, useEffect } from "react"
import brandConfig from "../brand.config.json"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Sprout, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  color: string
  avatar?: string
}

function getNextSaturday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() + (6 - day)
  const nextSat = new Date(d.setDate(diff))
  return nextSat.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function PickerPage() {
  const [candidates] = useState<Candidate[]>(brandConfig.candidates)
  const [picking, setPicking] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)
  const [winner, setWinner] = useState<Candidate | null>(null)
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null)

  useEffect(() => {
    const savedLastWinner = localStorage.getItem("gm-last-facilitator")
    if (savedLastWinner) {
      setLastWinnerId(savedLastWinner)
    }
  }, [])

  const pickRandom = useCallback(() => {
    if (picking) return

    setPicking(true)
    setWinner(null)

    let iterations = 0
    const maxIterations = 25
    const interval = setInterval(() => {
      setHighlightIdx(Math.floor(Math.random() * candidates.length))
      iterations++

      if (iterations >= maxIterations) {
        clearInterval(interval)

        const availableCandidates = candidates.filter((c) => c.id !== lastWinnerId)

        const chosen = availableCandidates[Math.floor(Math.random() * availableCandidates.length)]

        setLastWinnerId(chosen.id)
        localStorage.setItem("gm-last-facilitator", chosen.id)

        setHighlightIdx(candidates.findIndex((c) => c.id === chosen.id))
        setWinner(chosen)
        setPicking(false)
      }
    }, 100)
  }, [picking, candidates, lastWinnerId])

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-5xl w-full space-y-8 md:space-y-12 relative z-10">
        <header className="text-center space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1 text-primary border-primary/20 bg-primary/5 rounded-full font-medium tracking-wide"
          >
            <Sprout className="w-3.5 h-3.5 mr-2 inline" />
            Growing Minds
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Next <span className="text-primary">Facilitator</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
              <Calendar className="w-4 h-4" />
              <span>For Saturday, {getNextSaturday()}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {candidates.map((candidate, idx) => (
            <Card
              key={candidate.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 border-0 shadow-none bg-transparent group",
                highlightIdx === idx && "scale-105",
              )}
            >
              <CardContent className="p-2 flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full blur-xl transition-opacity duration-300 opacity-0",
                      highlightIdx === idx && "bg-primary/30 opacity-100",
                    )}
                  />
                  <Avatar
                    className={cn(
                      "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 border-2 transition-all duration-300",
                      highlightIdx === idx
                        ? "border-primary shadow-xl shadow-primary/20 scale-110"
                        : "border-transparent opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100",
                      winner?.id === candidate.id && "border-primary ring-4 ring-primary/10 opacity-100 grayscale-0",
                    )}
                  >
                    <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
                    <AvatarFallback className={candidate.color}>{candidate.name[0]}</AvatarFallback>
                  </Avatar>
                  {winner?.id === candidate.id && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg animate-in zoom-in duration-300">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "transition-all duration-300",
                    highlightIdx === idx || winner?.id === candidate.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-40 translate-y-1",
                  )}
                >
                  <h3 className="font-semibold text-sm md:text-base tracking-tight truncate max-w-[100px] sm:max-w-none">
                    {candidate.name}
                  </h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            onClick={pickRandom}
            disabled={picking}
            className="h-12 md:h-14 px-8 md:px-12 rounded-full text-base md:text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {picking ? "Selecting..." : "Pick Facilitator"}
          </Button>

          {winner && (
            <div className="text-center animate-in fade-in zoom-in slide-in-from-top-2 duration-500">
              <p className="text-[10px] md:text-xs font-black text-primary/40 tracking-[0.4em] uppercase">
                Chosen for this week
              </p>
              <p className="text-3xl md:text-5xl lg:text-6xl font-black text-primary mt-1 tracking-tight">
                {winner.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
