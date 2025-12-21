"use client"
import { useEffect, useState, useRef } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Plus, Sparkles, Trash2, AlertCircle, X, RotateCcw, Star } from "lucide-react"

// Generate pastel colour shades based on HSL with good text contrast
function generateColorShades(baseColor: string, count: number): string[] {
  // Parse hex colour
  const hex = baseColor.replace("#", "")
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  const shades: string[] = []
  for (let i = 0; i < count; i++) {
    // Pastel colours with good contrast: 60-70% lightness (darker than pure pastels) and 35-45% saturation (muted)
    const lightness = 62 + (i % 4) * 2.5
    const hue = (h * 360 + (i % count) * (360 / count)) % 360
    const saturation = 40 + (i % 3) * 2.5
    shades.push(`hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`)
  }
  return shades
}

export default function Spinner() {
  const [options, setOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState("")
  const [result, setResult] = useState("")
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [themeColor, setThemeColor] = useState("#3B82F6")

  // Continuous slow spin when idle
  useEffect(() => {
    if (isSpinning || showResult) return

    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [isSpinning, showResult])

  useEffect(() => {
    if (!supabase || !isConfigured) return

    const channel = supabase
      .channel("spinner")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.spinner" }, (payload: any) => {
        if (payload.new?.options) setOptions(payload.new.options)
        if (payload.new?.result) setResult(payload.new.result)
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("options,result")
      .eq("id", "spinner")
      .single()
      .then(({ data }: any) => {
        if (data?.options) setOptions(data.options)
        if (data?.result) setResult(data.result)
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  // Watch for theme changes
  useEffect(() => {
    const updateThemeColor = () => {
      const root = document.documentElement
      const computedColor = getComputedStyle(root).getPropertyValue("--color-primary").trim()
      if (computedColor) {
        setThemeColor(`#${computedColor}`)
      }
    }

    // Initial call
    updateThemeColor()

    // Watch for class changes on html element
    const observer = new MutationObserver(updateThemeColor)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })

    // Also listen to custom events
    window.addEventListener("themeChange", updateThemeColor)

    return () => {
      observer.disconnect()
      window.removeEventListener("themeChange", updateThemeColor)
    }
  }, [])



  const addOption = async () => {
    if (!newOption.trim() || !supabase) return
    const updatedOptions = [...options, newOption]
    
    // Update UI immediately
    setOptions(updatedOptions)
    setNewOption("")
    
    // Sync to Supabase
    const { error } = await supabase.from("widgets").update({ options: updatedOptions }).eq("id", "spinner")
    if (error) {
      console.error("Error adding option:", error)
      // Revert on error
      setOptions(options)
    }
  }

  const removeOption = async (option: string) => {
    if (!supabase) return
    const updatedOptions = options.filter((o: string) => o !== option)
    
    // Update UI immediately
    setOptions(updatedOptions)
    
    // Sync to Supabase
    const { error } = await supabase.from("widgets").update({ options: updatedOptions }).eq("id", "spinner")
    if (error) {
      console.error("Error removing option:", error)
      // Revert on error
      setOptions(options)
    }
  }

  const spinWheel = async () => {
    if (options.length === 0 || !supabase || isSpinning) return
    setIsSpinning(true)
    setShowResult(false)

    const prizeIndex = Math.floor(Math.random() * options.length)
    const finalChoice = options[prizeIndex]
    const segmentAngle = 360 / options.length
    // We need the segment's mid-angle to end up at the top (-90deg).
    // finalRotation = fullSpins + (-90 - midAngle)
    const midAngle = prizeIndex * segmentAngle + segmentAngle / 2
    const finalRotation = 360 * 5 - 90 - midAngle

    // Animate the spin
    setRotation(finalRotation)

    // Update UI and Supabase after spin completes
    setTimeout(() => {
      setResult(finalChoice)
      setShowResult(true)
      supabase!.from("widgets").update({ result: finalChoice }).eq("id", "spinner")
      setIsSpinning(false)
    }, 2000)
  }

  const resetWheel = async () => {
    if (!supabase) return
    
    // Clear UI
    setOptions([])
    setResult("")
    setShowResult(false)
    setNewOption("")
    setRotation(0)
    
    // Clear Supabase
    const { error } = await supabase.from("widgets").update({ options: [], result: "" }).eq("id", "spinner")
    if (error) {
      console.error("Error resetting wheel:", error)
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 mb-1">Firebase Not Configured</p>
            <p className="text-xs text-yellow-700">
              Please add your Firebase environment variables in the Vars section of the sidebar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const colors = generateColorShades(themeColor, Math.max(8, options.length))
  const segmentAngle = options.length > 0 ? 360 / options.length : 0

  return (
    <div className="space-y-4 relative">
      {/* Reset Button */}
      {options.length > 0 && (
        <button
          onClick={resetWheel}
          className="absolute top-0 right-0 w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
          title="Reset wheel and clear all options"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}

      {/* Wheel Display */}
      {options.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          {/* Wheel Container */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
            
            {/* Spinning Wheel */}
            <svg
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 2s cubic-bezier(0.17, 0.67, 0.12, 0.98)" : "none",
              }}
              viewBox="0 0 200 200"
            >
              {options.length === 1 ? (
                // Single item: full circle
                <>
                  <circle cx="100" cy="100" r="100" fill={colors[0]} stroke="white" strokeWidth="2" />
                  <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-bold fill-white"
                    style={{ pointerEvents: "none" }}
                  >
                    {options[0]}
                  </text>
                </>
              ) : (
                // Multiple items: segments
                options.map((option, index) => {
                  const startAngle = (index * segmentAngle * Math.PI) / 180
                  const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180
                  const x1 = 100 + 100 * Math.cos(startAngle)
                  const y1 = 100 + 100 * Math.sin(startAngle)
                  const x2 = 100 + 100 * Math.cos(endAngle)
                  const y2 = 100 + 100 * Math.sin(endAngle)
                  const largeArc = segmentAngle > 180 ? 1 : 0

                  return (
                    <g key={index}>
                      {/* Segment */}
                      <path
                        d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={colors[index % colors.length]}
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Text */}
                      <text
                        x={100 + 65 * Math.cos((startAngle + endAngle) / 2)}
                        y={100 + 65 * Math.sin((startAngle + endAngle) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold fill-white"
                        style={{ pointerEvents: "none" }}
                      >
                        {option}
                      </text>
                    </g>
                  )
                })
              )}
            </svg>

            {/* Result Overlay */}
            {showResult && result && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="animate-in fade-in scale-in duration-300 relative bg-white/95 dark:bg-slate-950/95 rounded-2xl p-8 text-center shadow-2xl border-2 border-primary w-80">
                  <button
                    onClick={() => setShowResult(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
                    title="Close result"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Star className="w-5 h-5 fill-primary text-primary" />
                    <p className="text-lg font-bold text-primary uppercase tracking-widest">Winner</p>
                    <Star className="w-5 h-5 fill-primary text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground break-words mb-3">{result}</p>
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Spin Button */}
          <button
            onClick={spinWheel}
            disabled={isSpinning}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
            {isSpinning ? "Spinning..." : "Spin the Wheel"}
          </button>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Add options to create your wheel</p>
        </div>
      )}

      {/* Add Option */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addOption()}
          placeholder="Add an option..."
          className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <button
          onClick={addOption}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Options List */}
      {options.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Options ({options.length})</p>
          <div className="space-y-1.5 max-h-14 overflow-y-auto">
            {options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
              >
                <span className="text-sm text-foreground">{opt}</span>
                <button
                  onClick={() => removeOption(opt)}
                  className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
