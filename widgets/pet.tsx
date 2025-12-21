"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Heart, Sparkles, AlertCircle } from "lucide-react"
import { DogIcon, CatIcon } from "../components/animal-icons"

export default function Pet() {
  const [mood, setMood] = useState("happy")
  const [species, setSpecies] = useState("dog")
  const [lastFed, setLastFed] = useState<Date | null>(null)

  useEffect(() => {
    if (!supabase || !isConfigured) return

    const channel = supabase
      .channel("pet")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.pet" }, (payload: any) => {
        if (payload.new?.mood) setMood(payload.new.mood)
        if (payload.new?.lastFed) setLastFed(new Date(payload.new.lastFed))
        if (payload.new?.species) setSpecies(payload.new.species)
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("mood,lastFed,species")
      .eq("id", "pet")
      .single()
      .then(({ data }: any) => {
        if (data?.mood) setMood(data.mood)
        if (data?.lastFed) setLastFed(new Date(data.lastFed))
        if (data?.species) setSpecies(data.species)
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const feedPet = async () => {
    if (!supabase) return
    await supabase.from("widgets").update({ mood: "happy", lastFed: new Date().toISOString() }).eq("id", "pet")
  }

  const petPet = async () => {
    if (!supabase) return
    await supabase.from("widgets").update({ mood: "loved" }).eq("id", "pet")
    setTimeout(async () => {
      await supabase!.from("widgets").update({ mood: "happy" }).eq("id", "pet")
    }, 3000)
  }

  const switchSpecies = async (newSpecies: string) => {
    if (!supabase) {
      setSpecies(newSpecies)
      return
    }

    const previous = species
    setSpecies(newSpecies)
    try {
      await supabase.from("widgets").update({ species: newSpecies }).eq("id", "pet")
    } catch (e) {
      setSpecies(previous)
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 mb-1">Supabase Not Configured</p>
            <p className="text-xs text-yellow-700">
              Please add your Supabase environment variables in the Vars section of the sidebar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Pet Display */}
      <div className="relative p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl text-center">
        <button
          onClick={() => switchSpecies(species === "dog" ? "cat" : "dog")}
          className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-xs font-medium bg-muted text-foreground hover:opacity-90 transition"
          aria-label="Toggle species"
        >
          {species === "dog" ? "Dog" : "Cat"}
        </button>

        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          {species === "dog" ? (
            <DogIcon size={48} mood={mood} className="text-white" />
          ) : (
            <CatIcon size={48} mood={mood} className="text-white" />
          )}
        </div>
        <p className="text-lg font-bold text-foreground capitalize">{mood}</p>
        {lastFed && <p className="text-xs text-muted-foreground mt-1">Last fed: {lastFed.toLocaleTimeString()}</p>}
        {mood === "loved" && <Sparkles className="absolute top-4 right-4 w-6 h-6 text-secondary animate-pulse" />}
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

      <p className="text-xs text-center text-muted-foreground">Take care of your virtual pet together</p>
    </div>
  )
}
