"use client"
import React, { useState, ChangeEvent, useRef } from "react"
import Link from "next/link"
import {
  Heart,
  Plus,
  X,
  ChevronDown,
  Music,
  Sparkles,
  Film,
  Gamepad2,
  PawPrint,
  Youtube,
  ListChecks,
  Star,
  Gift,
  Palette,
  Link2,
} from "lucide-react"

// Widgets
import Spotify from "../widgets/spotify"
import Spinner from "../widgets/spinner"
import Movies from "../widgets/movies"
import Games from "../widgets/games"
import Pet from "../widgets/pet"
import YouTube from "../widgets/youtube"
import Checklist from "../widgets/checklist"
import Favourites from "../widgets/favourites"
import Wishlist from "../widgets/wishlist"

// Define all widgets with proper icons
const allWidgets = [
  { id: "spotify", name: "Music Together", component: <Spotify />, icon: Music },
  // Move pet and videos to 2nd and 3rd
  { id: "pet", name: "Our Pet", component: <Pet />, icon: PawPrint },
  { id: "youtube", name: "Videos", component: <YouTube />, icon: Youtube },
  { id: "games", name: "Games", component: <Games />, icon: Gamepad2 },
  // Place spinner and watchlist after games
  { id: "spinner", name: "Decision Wheel", component: <Spinner />, icon: Sparkles },
  { id: "movies", name: "Watch List", component: <Movies />, icon: Film },
  { id: "checklist", name: "To-Do Together", component: <Checklist />, icon: ListChecks },
  { id: "favourites", name: "Favourites", component: <Favourites />, icon: Star },
  { id: "wishlist", name: "Wishlist", component: <Wishlist />, icon: Gift },
]

const themes = [
  { id: "cozy-sunset", name: "Cozy Sunset", emoji: "🌅" },
  { id: "lavender-dreams", name: "Lavender Dreams", emoji: "💜" },
  { id: "mint-fresh", name: "Mint Fresh", emoji: "🌿" },
  { id: "ocean-breeze", name: "Ocean Breeze", emoji: "🌊" },
  { id: "rose-garden", name: "Rose Garden", emoji: "🌹" },
]

interface DashboardProps {
  roomCode?: string
}

export default function Dashboard({ roomCode }: DashboardProps) {
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(allWidgets.map((w) => w.id))
  const [currentTheme, setCurrentTheme] = useState("cozy-sunset")
  const [focusWidget, setFocusWidget] = useState<string | null>(null)
  const prevVisibleRef = useRef<string[] | null>(null)
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  const toggleWidget = (id: string) => {
    if (visibleWidgets.includes(id)) {
      setVisibleWidgets(visibleWidgets.filter((w: string) => w !== id))
      // if closing the focused widget, exit focus and restore previous visible widgets
      if (focusWidget === id) {
        const restored = (prevVisibleRef.current || []).filter((v) => v !== id)
        setVisibleWidgets(restored.length ? restored : [])
        prevVisibleRef.current = null
        setFocusWidget(null)
      }
    } else {
      setVisibleWidgets([...visibleWidgets, id])
    }
  }

  function enterFocus(id: string) {
    if (focusWidget === id) return
    prevVisibleRef.current = visibleWidgets
    setVisibleWidgets([id])
    setFocusWidget(id)
  }

  function exitFocus() {
    const restored = prevVisibleRef.current ?? allWidgets.map((w) => w.id)
    setVisibleWidgets(restored)
    prevVisibleRef.current = null
    setFocusWidget(null)
  }

  const changeTheme = (themeId: string) => {
    setCurrentTheme(themeId)
    if (themeId === "cozy-sunset") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", themeId)
    }
    setShowThemeSelector(false)
  }

  return (
    <main className="min-h-screen flex flex-col bg-background p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Header with Theme Selector */}
      <div className={`${focusWidget ? "max-w-7xl mx-auto mb-2" : "max-w-7xl mx-auto mb-8"}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground font-[family-name:var(--font-display)] text-balance">
                Together
              </h1>
              <p className="text-sm text-muted-foreground">
                {roomCode ? `Connected in room ${roomCode}` : "Connected across the miles"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/room"
              className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium text-foreground"
            >
              <Link2 className="w-4 h-4 text-primary" />
              Test room flow
            </Link>

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="flex items-center gap-2 px-4 py-2 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${showThemeSelector ? "rotate-180" : ""}`}
                />
              </button>

              {showThemeSelector && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl border border-border shadow-xl p-2 z-50">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => changeTheme(theme.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        currentTheme === theme.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-xl">{theme.emoji}</span>
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Widgets Chips */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-medium text-muted-foreground">Widgets:</label>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {allWidgets.map((w) => {
              const active = visibleWidgets.includes(w.id)
              const Icon = w.icon as any
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card/50 text-muted-foreground border border-border hover:bg-card/60"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span className="truncate max-w-[10rem]">{w.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className={`${focusWidget ? "w-full mx-0" : "max-w-7xl mx-auto"} flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 auto-rows-auto min-h-0`}>
        {allWidgets.map(
          (w) =>
            visibleWidgets.includes(w.id) && (
              <div
                key={w.id}
                className={`bg-card rounded-3xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${
                  focusWidget === w.id ? "col-span-full min-h-0 h-full overflow-hidden h-[calc(100vh-6rem)]" : ""
                }`}
              >
                {/* Widget Header (click title to focus) */}
                <div
                  className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-muted/50 to-transparent select-none border-b border-border cursor-pointer"
                  onClick={() => enterFocus(w.id)}
                >
                  <w.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-semibold text-foreground flex-1 truncate">{w.name}</span>

                  {focusWidget === w.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        exitFocus()
                      }}
                      title="Minimise"
                      className="w-7 h-7 rounded-full bg-card/60 hover:bg-card/70 text-muted-foreground flex items-center justify-center transition-colors flex-shrink-0 mr-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // remove widget from visible list
                      toggleWidget(w.id)
                    }}
                    className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Widget Content */}
                <div className="p-5 flex-1 min-h-0 overflow-auto">
                  {React.isValidElement(w.component)
                    ? React.cloneElement(w.component as any, { isFocused: focusWidget === w.id })
                    : w.component}
                </div>
              </div>
            ),
        )}
      </div>
    </main>
  )
}
