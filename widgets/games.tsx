"use client"
import { useEffect, useState } from "react"
import { Heart, TrendingUp, Sparkles, Gamepad2 } from "lucide-react"

type Game = {
  id: number
  title: string
  poster: string
  developer: string
  free: boolean
}

export default function Games() {
  const [games, setGames] = useState<Game[]>([])
  const [type, setType] = useState<"popular" | "recent">("popular")
  const [freeOnly, setFreeOnly] = useState(false)
  const [favourites, setFavourites] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/steam/games?type=${type}&free=${freeOnly}`)
      .then((res) => res.json())
      .then((data) => {
        setGames(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type, freeOnly])

  const toggleFavourite = (id: number) => {
    setFavourites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const visibleGames = games.slice(0, 6)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setType("popular")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            type === "popular"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Popular
        </button>
        <button
          onClick={() => setType("recent")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            type === "recent"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          New
        </button>
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium cursor-pointer transition-all ml-auto">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={() => setFreeOnly(!freeOnly)}
            className="w-3.5 h-3.5 rounded accent-primary"
          />
          <span className="text-muted-foreground">Free only</span>
        </label>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="text-center py-8">
          <Gamepad2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading games...</p>
        </div>
      ) : games.length > 0 ? (
        <div className="space-y-2 pr-1 overflow-y-auto scrollbar-thin">
          {visibleGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
            >
              <img
                src={game.poster || "/placeholder.svg"}
                alt={game.title}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{game.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{game.developer}</p>
                {game.free && (
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    Free
                  </span>
                )}
              </div>
              <button
                onClick={() => toggleFavourite(game.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  favourites.includes(game.id)
                    ? "bg-red-100 text-red-500"
                    : "bg-background/50 text-muted-foreground hover:bg-background"
                }`}
              >
                <Heart className={`w-4 h-4 ${favourites.includes(game.id) ? "fill-current" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Gamepad2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No games found</p>
        </div>
      )}
    </div>
  )
}
