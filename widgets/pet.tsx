"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Heart, Sparkles } from "lucide-react"

import idleCat from "../assets/idle cat.gif"
import hungryCat from "../assets/hungry cat.gif"
import eatingCat from "../assets/eating cat.gif"
import happyCat from "../assets/happy cat.gif"
import sadCat from "../assets/sad cat.gif"
import pettingCat from "../assets/petting cat.gif"

type CatState = "idle" | "hungry" | "eating" | "happy" | "sad" | "petting"

const RANDOM_EVENT_MIN_MS = 30_000
const RANDOM_EVENT_MAX_MS = 60_000
const EATING_DURATION_MS = 9_000
const HAPPY_DURATION_MS = 7_000
const PETTING_DURATION_MS = 6_000

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function Pet() {
  const [state, setState] = useState<CatState>("idle")
  const [petName, setPetName] = useState("Cat")
  const [lastFed, setLastFed] = useState<Date | null>(null)
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const scheduleRandomEvent = () => {
      const nextIn = randomBetween(RANDOM_EVENT_MIN_MS, RANDOM_EVENT_MAX_MS)
      eventTimeoutRef.current = setTimeout(() => {
        // Interrupt only calm states; avoid overriding active user-triggered animations.
        setState((current) => {
          if (current === "eating" || current === "hungry" || current === "sad") {
            return current
          }

          return Math.random() < 0.6 ? "hungry" : "sad"
        })
        scheduleRandomEvent()
      }, nextIn)
    }

    scheduleRandomEvent()

    return () => {
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current)
      }
      if (eventTimeoutRef.current) {
        clearTimeout(eventTimeoutRef.current)
      }
    }
  }, [])

  const playHappyThenIdle = () => {
    setState("happy")

    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current)
    }

    actionTimeoutRef.current = setTimeout(() => {
      setState("idle")
    }, HAPPY_DURATION_MS)
  }

  const feedPet = () => {
    setLastFed(new Date())
    setState("eating")

    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current)
    }

    actionTimeoutRef.current = setTimeout(() => {
      playHappyThenIdle()
    }, EATING_DURATION_MS)
  }

  const petPet = () => {
    setState("petting")

    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current)
    }

    actionTimeoutRef.current = setTimeout(() => {
      setState("idle")
    }, PETTING_DURATION_MS)
  }

  const stateLabel = useMemo(() => {
    switch (state) {
      case "idle":
        return "Idle"
      case "hungry":
        return "Hungry"
      case "eating":
        return "Eating"
      case "happy":
        return "Happy"
      case "sad":
        return "Sad"
      case "petting":
        return "Petting"
    }
  }, [state])

  const currentGif = useMemo(() => {
    switch (state) {
      case "idle":
        return idleCat
      case "hungry":
        return hungryCat
      case "eating":
        return eatingCat
      case "happy":
        return happyCat
      case "sad":
        return sadCat
      case "petting":
        return pettingCat
    }
  }, [state])

  const displayName = useMemo(() => {
    const trimmed = petName.trim()
    return trimmed.length > 0 ? trimmed : "Cat"
  }, [petName])

  const stateCaption = useMemo(() => {
    switch (state) {
      case "idle":
        return `${displayName} is chilling`
      case "hungry":
        return `${displayName} is hungry`
      case "eating":
        return `${displayName} is eating`
      case "happy":
        return `${displayName} is vibing`
      case "petting":
        return `${displayName} is happy`
      case "sad":
        return `${displayName} is crashing out`
    }
  }, [displayName, state])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pet-name" className="text-xs font-medium text-muted-foreground">
          Pet name
        </label>
        <input
          id="pet-name"
          type="text"
          value={petName}
          onChange={(e) => setPetName(e.target.value)}
          placeholder="Name your cat"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          maxLength={24}
        />
      </div>

      {/* Pet Display */}
      <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-4 text-center sm:p-6">
        <div className="mx-auto mb-3 h-36 w-36 overflow-hidden rounded-2xl border border-border/60 bg-background/70 sm:h-40 sm:w-40">
          <Image
            src={currentGif}
            alt={stateCaption}
            className="h-full w-full object-cover"
            unoptimized
            priority
          />
        </div>
        <p className="text-lg font-bold text-foreground">{stateCaption}</p>
        {lastFed && <p className="text-xs text-muted-foreground mt-1">Last fed: {lastFed.toLocaleTimeString()}</p>}
        {state === "happy" && <Sparkles className="absolute right-4 top-4 h-6 w-6 animate-pulse text-secondary" />}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={feedPet}
          className="py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Feed
        </button>
        <button
          onClick={petPet}
          className="py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Pet
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground">Idle lasts longest. Hungry or sad can appear every 30-60s.</p>
    </div>
  )
}
