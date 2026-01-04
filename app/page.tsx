"use client"

import { useState, useCallback, useEffect } from "react"
import brandConfig from "../brand.config.json"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Sprout, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

import { getUsers, getLatestSelection, saveSelection, getSummaryOrder, saveSummaryOrder } from "./actions"

interface Candidate {
  id: string
  name: string
  color: string
  avatar?: string
  selectionCount: number
}

function getNextSaturday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() + (6 - day)
  const nextSat = new Date(d.setDate(diff))
  return nextSat.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function shuffle<T>(array: T[]): T[] {
  // 1. Initial Sort (for consistent starting point)
  const sorted = [...array].sort((a, b) => String(a).localeCompare(String(b)))

  // 2. First Pass Randomization
  const randomized = [...sorted]
  for (let i = randomized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]]
  }

  // 3. Custom random placement (picking random index, repeating if filled)
  const result = new Array(array.length).fill(null)
  for (const item of randomized) {
    let placed = false
    while (!placed) {
      const randomIndex = Math.floor(Math.random() * array.length)
      if (result[randomIndex] === null) {
        result[randomIndex] = item
        placed = true
      }
    }
  }
  return result
}

export default function PickerPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [picking, setPicking] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)
  const [winner, setWinner] = useState<Candidate | null>(null)
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null)
  const [hasSelectedThisWeek, setHasSelectedThisWeek] = useState(false)
  const [summaryOrder, setSummaryOrder] = useState<any[] | null>(null)
  const [isGeneratingOrder, setIsGeneratingOrder] = useState(false)

  const [mounted, setMounted] = useState(false)
  const [nextSaturday, setNextSaturday] = useState("")

  useEffect(() => {
    setMounted(true)
    setNextSaturday(getNextSaturday())

    // Fetch all users from DB
    getUsers().then((users) => {
      const mappedCandidates = users.map((u: any) => ({
        id: u._id,
        name: u.name,
        color: "bg-primary/20", // Default color
        selectionCount: u.selectionCount || 0,
      }))
      setCandidates(mappedCandidates)

      // Fetch latest selection from DB after users are loaded
      getLatestSelection().then((selection) => {
        if (selection) {
          setWinner({
            id: selection.userId._id,
            name: selection.userId.name,
            color: "bg-primary/20",
          })
          setHasSelectedThisWeek(true)
          setHighlightIdx(mappedCandidates.findIndex((c: any) => c.id === selection.userId._id))
        }
      })

      // Fetch summary order for the week
      getSummaryOrder().then((order) => {
        if (order) {
          setSummaryOrder(order.orderedUserIds)
        }
      })
    })

    const savedLastWinner = localStorage.getItem("gm-last-facilitator")
    if (savedLastWinner) {
      setLastWinnerId(savedLastWinner)
    }
  }, [])

  const pickRandom = useCallback(() => {
    if (picking || hasSelectedThisWeek) return

    setPicking(true)
    setWinner(null)

    let iterations = 0
    const maxIterations = 25
    const interval = setInterval(async () => {
      setHighlightIdx(Math.floor(Math.random() * candidates.length))
      iterations++

      if (iterations >= maxIterations) {
        clearInterval(interval)

        const availableCandidates = candidates.filter((c) => c.id !== lastWinnerId)
        
        // --- Weighted Random Logic ---
        // Favor those with fewer selection counts
        // Weight = (MaxCount + 1) - count
        const counts = availableCandidates.map(c => c.selectionCount)
        const maxCount = Math.max(...counts)
        const weights = availableCandidates.map(c => (maxCount + 1) - c.selectionCount)
        const totalWeight = weights.reduce((acc, w) => acc + w, 0)
        
        let random = Math.random() * totalWeight
        let chosen = availableCandidates[0]
        
        for (let i = 0; i < weights.length; i++) {
          if (random < weights[i]) {
            chosen = availableCandidates[i]
            break
          }
          random -= weights[i]
        }
        // -----------------------------

        try {
          // Save to DB
          await saveSelection(chosen.id)

          setLastWinnerId(chosen.id)
          localStorage.setItem("gm-last-facilitator", chosen.id)

          setHighlightIdx(candidates.findIndex((c) => c.id === chosen.id))
          setWinner(chosen)
          setHasSelectedThisWeek(true)
        } catch (error) {
          console.error("Failed to save selection:", error)
          // Maybe show a toast here? For now just reset picking
        } finally {
          setPicking(false)
        }
      }
    }, 100)
  }, [picking, candidates, lastWinnerId, hasSelectedThisWeek])

  const generateSummaryOrder = useCallback(async () => {
    if (!candidates.length || summaryOrder) return
    setIsGeneratingOrder(true)

    // 100% Random Fisher-Yates shuffle
    const userIds = candidates.map((c) => c.id)
    const shuffledIds = shuffle(userIds)

    try {
      const order = await saveSummaryOrder(shuffledIds)
      setSummaryOrder(order.orderedUserIds)
    } catch (error) {
      console.error("Failed to save summary order:", error)
    } finally {
      setIsGeneratingOrder(false)
    }
  }, [candidates, summaryOrder])

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10" />

      <div className="max-w-5xl w-full space-y-8 md:space-y-12 relative z-10">
        <header className="text-center space-y-4">
          <Badge
            variant="outline"
            className="px-4 py-1 text-base text-primary border-primary/20 bg-primary/5 rounded-full font-medium tracking-wide"
          >
            <Sprout className="w-3.5 h-3.5 mr-2 inline" />
            Next Facilitator Selection
          </Badge>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Growing <span className="text-primary">Minds</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground/80 font-medium text-sm md:text-base mt-2">
              <Calendar className="w-4 h-4" />
              <span>{mounted ? nextSaturday : "Loading date..."}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
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
                      "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-all duration-300 border-2",
                      highlightIdx === idx
                        ? "border-primary shadow-2xl shadow-primary/30 scale-110 z-20"
                        : "border-border/50 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100",
                      winner?.id === candidate.id && "border-primary ring-8 ring-primary/5 opacity-100 grayscale-0",
                    )}
                  >
                    <AvatarImage src={candidate.avatar} alt={candidate.name} />
                    <AvatarFallback
                      className={cn(
                        "text-2xl md:text-3xl font-bold tracking-tighter bg-linear-to-br from-primary/10 to-primary/30 text-primary",
                        highlightIdx === idx && "from-primary to-primary/80 text-primary-foreground",
                      )}
                    >
                      {getInitials(candidate.name)}
                    </AvatarFallback>
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
                      : "opacity-60 translate-y-1",
                  )}
                >
                  <h3 className="font-semibold text-sm md:text-base tracking-tight truncate max-w-[100px] sm:max-w-none">
                    {candidate.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                    Picked {candidate.selectionCount} {candidate.selectionCount === 1 ? "time" : "times"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <Button
            size="lg"
            onClick={pickRandom}
            disabled={picking || hasSelectedThisWeek}
            className="h-12 md:h-14 px-8 md:px-12 rounded-full text-base md:text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {picking ? "Selecting..." : hasSelectedThisWeek ? "Selection Locked" : "Pick Facilitator"}
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

          {winner && !summaryOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateSummaryOrder}
              disabled={isGeneratingOrder}
              className="mt-4 border-primary/20 text-primary hover:bg-primary/5 rounded-full px-6 font-medium"
            >
              {isGeneratingOrder ? "Sorting..." : "Generate Summary Order"}
            </Button>
          )}

          {summaryOrder && (
            <div className="mt-8 w-full max-w-md bg-primary/5 rounded-3xl p-6 border border-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-center text-xs font-black text-primary/40 tracking-[0.3em] uppercase mb-6">
                Summary Presentation Order
              </h3>
              <div className="space-y-4">
                {summaryOrder.map((user, idx) => (
                  <div key={user._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-sm text-foreground/80 group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                    </div>
                    {user._id === winner?.id && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase px-2 py-0">
                        Facilitator
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
