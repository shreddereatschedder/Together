"use client"
import React, { useEffect, useState, useRef } from "react"
import { Heart, Search, AlertCircle, Star, Film, Tv, Sparkles } from "lucide-react"
import { supabase, isConfigured } from "../app/lib/supabase"

type Item = {
  id: string
  title: string
  poster?: string | null
  subtitle?: string | null
  genres?: string[]
  score?: number | null
}

export default function MoviesWidget({ isFocused }: { isFocused?: boolean }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Item[]>([])
  const [favorites, setFavorites] = useState<Record<string, Item>>({})
  const [heartedOnly, setHeartedOnly] = useState(false)
  const lastResultsRef = useRef<Item[] | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load favourites + subscribe to changes
  useEffect(() => {
    const client = supabase
    if (!client || !isConfigured) return

    let mounted = true

    const load = async () => {
      try {
        const { data, error } = await client.from("widgets").select("favorites").eq("id", "movies").single()
        if (!error && mounted) {
          const favs = data?.favorites ?? { movies: {}, tv: {}, anime: {} }
          setFavorites(favs.anime ?? {})
        }
      } catch {
        // ignore
      }
    }
    load()

    const channel = client
      .channel("movies-favorites-anime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "widgets", filter: "id=eq.movies" },
        (payload: any) => {
          const favs = payload.new?.favorites ?? { movies: {}, tv: {}, anime: {} }
          if (mounted) setFavorites(favs.anime ?? {})
        },
      )
      .subscribe()

    return () => {
      mounted = false
      client.removeChannel(channel)
    }
  }, [])

  
  // Search anime
  async function searchAnime(q: string) {
    if (!q) return fetchAnimeDefaults()
    setLoading(true)
    console.debug("[movies] searchAnime start", q)
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q)}&limit=20`)
      if (res.status === 429) {
        console.warn("[movies] jikan rate limited (429) on search")
        setRateLimited(true)
        if (lastResultsRef.current) setResults(lastResultsRef.current)
        else setResults([])
        return
      }
      const json = await res.json()
      const items: Item[] = (json.data || []).map((a: any) => ({
        id: String(a.mal_id),
        title: a.title,
        poster: a.images?.jpg?.image_url ?? null,
        subtitle: a.type,
        genres: (a.genres || []).map((g: any) => g.name),
        score: typeof a.score === "number" ? a.score : null,
      }))
      setRateLimited(false)
      setResults(items)
      lastResultsRef.current = items
      console.debug("[movies] searchAnime got items:", items.length)
    } catch (err) {
      console.error("[movies] searchAnime error:", err)
      if (lastResultsRef.current) setResults(lastResultsRef.current)
      else setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Search anime
  async function fetchAnimeDefaults() {
    setLoading(true)
    console.debug("[movies] fetchAnimeDefaults start")
    try {
      const res = await fetch("https://api.jikan.moe/v4/top/anime")
      if (res.status === 429) {
        console.warn("[movies] jikan rate limited (429)")
        setRateLimited(true)
        if (lastResultsRef.current) setResults(lastResultsRef.current)
        else setResults([])
        return
      }
      const json = await res.json()
      const items: Item[] = (json.data || []).slice(0, 20).map((a: any) => ({
        id: String(a.mal_id),
        title: a.title,
        poster: a.images?.jpg?.image_url ?? null,
        subtitle: a.type,
        genres: (a.genres || []).map((g: any) => g.name),
        score: typeof a.score === "number" ? a.score : null,
      }))
      setRateLimited(false)
      setResults(items)
      lastResultsRef.current = items
      console.debug("[movies] fetchAnimeDefaults got items:", items.length)
    } catch (err) {
      console.error("[movies] fetchAnimeDefaults error:", err)
      if (lastResultsRef.current) setResults(lastResultsRef.current)
      else setResults([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    // initial load for anime only
    setResults([])
    setQuery("")
    fetchAnimeDefaults()
  }, [])

  // When the search text is cleared, return to the default top anime list
  useEffect(() => {
    if (query.trim() === "") {
      fetchAnimeDefaults()
    }
  }, [query])

  async function toggleHeart(item: Item) {
    if (!supabase || !isConfigured) return

    // optimistic UI update
    setFavorites((prev) => {
      const copy = { ...prev }
      if (copy[item.id]) delete copy[item.id]
      else copy[item.id] = item
      return copy
    })

    // persist to Supabase: fetch current favourites object, update anime key, upsert
    try {
      const { data } = await supabase.from("widgets").select("favorites").eq("id", "movies").single()
      const current = (data?.favorites as any) ?? { movies: {}, tv: {}, anime: {} }
      const updated = {
        movies: current.movies ?? {},
        tv: current.tv ?? {},
        anime: { ...(current.anime ?? {}) },
      }

      if (updated.anime[item.id]) delete updated.anime[item.id]
      else updated.anime[item.id] = item

      const { data: upsertData, error: upsertErr } = await supabase.from("widgets").upsert({ id: "movies", favorites: updated }, { onConflict: "id" }).select()

      if (upsertErr) {
        // revert on error by reloading server state
        try {
          const { data: fresh } = await supabase.from("widgets").select("favorites").eq("id", "movies").single()
          const favs = fresh?.favorites ?? { movies: {}, tv: {}, anime: {} }
          setFavorites(favs.anime ?? {})
        } catch {
          // ignore
        }
      } else {
        // ensure local state matches server
        setFavorites(updated.anime ?? {})
      }
    } catch (err) {
      // on unexpected error reload server state
      try {
        const { data: fresh } = await supabase.from("widgets").select("favorites").eq("id", "movies").single()
        const favs = fresh?.favorites ?? { movies: {}, tv: {}, anime: {} }
        setFavorites(favs.anime ?? {})
      } catch {
        // ignore
      }
      console.error("[movies] toggleHeart error:", err)
    }
  }

  const displayList = heartedOnly ? Object.values(favorites) : results

  if (!isConfigured) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 mb-1">Supabase Not Configured</p>
            <p className="text-xs text-yellow-700">Please add your Supabase environment variables in the Vars section of the sidebar.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isFocused ? "space-y-4 h-full flex flex-col" : "space-y-4"}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-muted text-muted-foreground"
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-muted text-muted-foreground"
          >
            <Tv className="w-3.5 h-3.5" />
            TV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-primary text-primary-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            Anime
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setHeartedOnly((s) => !s)}
            title="Show favourites for anime"
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              heartedOnly ? "bg-red-100 text-red-500" : "bg-background/50 text-muted-foreground hover:bg-background"
            }`}
          >
            <Heart className={`w-4 h-4 ${heartedOnly ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchAnime(query)}
            placeholder="Search anime..."
            className="w-full px-4 py-2 rounded-xl border border-border bg-input text-sm"
          />
          <button onClick={() => searchAnime(query)} className="absolute right-1 top-1 bottom-1 px-3 rounded-r-xl bg-primary text-primary-foreground">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : displayList.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No anime found</div>
        ) : (
          <div className={isFocused ? "grid grid-cols-1 gap-3 flex-1 min-h-0 overflow-auto pb-6 scrollbar-thin" : "grid grid-cols-1 gap-3 h-[22.5rem] overflow-y-auto pb-6 scrollbar-thin"}>
            {displayList.map((it) => (
              <div key={it.id} className="group flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl hover:bg-muted transition-colors h-40">
                <div className="w-20 h-28 bg-muted rounded overflow-hidden flex-shrink-0">
                  {it.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.poster} alt={it.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{it.title}</p>
                      {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {it.genres?.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="inline-flex items-center text-xs px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground select-none transition-colors shadow-sm hover:bg-muted/90 group-hover:bg-muted/90"
                          >
                            {g}
                          </span>
                        ))}
                        {typeof it.score === "number" && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3.5 h-3.5 text-yellow-400" /> {it.score}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleHeart(it)}
                      title="Toggle favourite"
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        favorites[it.id]
                          ? "bg-red-100 text-red-500"
                          : "bg-background/50 text-muted-foreground hover:bg-background"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites[it.id] ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-6 text-center">Tip: Search anime and click the heart to favourite. Favourites are saved and shown when the heart filter is enabled.</div>
    </div>
  )
}
