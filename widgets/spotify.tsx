"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Search, Music2, ListMusic, AlertCircle, Trash2, Play, SkipBack, SkipForward } from "lucide-react"

interface Song {
  title: string
  artist: string
  url?: string
  image?: string
  id?: string
  duration?: number
}

export default function Spotify({ isFocused }: { isFocused?: boolean }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)


  useEffect(() => {
    if (!supabase || !isConfigured) return

    const channel = supabase
      .channel("spotify")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.spotify" }, (payload: any) => {
        if (payload.new?.currentsong) setCurrentSong(payload.new.currentsong)
        if (payload.new?.queue) setPlaylist(payload.new.queue || [])
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("currentsong,queue")
      .eq("id", "spotify")
      .single()
      .then(({ data }: any) => {
        if (data?.currentsong) setCurrentSong(data.currentsong)
        if (data?.queue) setPlaylist(data.queue || [])
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const searchSongs = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.songs) {
        setSearchResults(data.songs)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const playSong = async (song: Song) => {
    if (!supabase) return
    
    // Update UI immediately
    setCurrentSong(song)
    setSearchQuery("")
    setSearchResults([])
    
    // Set current index in playlist
    const index = playlist.findIndex(s => s.id === song.id)
    setCurrentIndex(index === -1 ? 0 : index)
    
    // Sync to Supabase
    const { error } = await supabase.from("widgets").update({ currentsong: song }).eq("id", "spotify")
    if (error) {
      console.error("Error playing song:", error)
      setCurrentSong(null)
    }
  }

  const playNext = () => {
    if (playlist.length === 0) return
    const nextIndex = (currentIndex + 1) % playlist.length
    playSong(playlist[nextIndex])
  }

  const playPrevious = () => {
    if (playlist.length === 0) return
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1
    playSong(playlist[prevIndex])
  }

  const addToPlaylist = async (song: Song) => {
    if (!supabase || !isConfigured) return
    const newPlaylist = [...playlist, song]
    
    // Update UI immediately
    setPlaylist(newPlaylist)
    
    // Sync to Supabase
    const { error } = await supabase.from("widgets").update({ queue: newPlaylist }).eq("id", "spotify")
    if (error) {
      console.error("Error adding to playlist:", error)
      setPlaylist(playlist)
    }
  }

  const removeFromPlaylist = async (index: number) => {
    if (!supabase || !isConfigured) return
    const newPlaylist = playlist.filter((_, i) => i !== index)
    
    // Update UI immediately
    setPlaylist(newPlaylist)
    
    // Sync to Supabase
    const { error } = await supabase.from("widgets").update({ queue: newPlaylist }).eq("id", "spotify")
    if (error) {
      console.error("Error removing from playlist:", error)
      setPlaylist(playlist)
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

  return (
    <div className={isFocused ? "space-y-4 h-full flex flex-col" : "space-y-4"}>
      {/* Spotify Player */}
      {currentSong ? (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-4">
            <iframe
              style={{ borderRadius: "12px" }}
              src={`https://open.spotify.com/embed/track/${currentSong.id}?utm_source=generator`}
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            ></iframe>
          </div>
          {/* Playback Controls */}
          {playlist.length > 1 && (
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={playPrevious}
                className="w-10 h-10 rounded-lg bg-secondary/20 text-secondary-foreground hover:bg-secondary/40 transition-colors flex items-center justify-center"
                title="Previous"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <div className="text-xs text-muted-foreground">
                {currentIndex >= 0 ? `${currentIndex + 1}/${playlist.length}` : "—"}
              </div>
              <button
                onClick={playNext}
                className="w-10 h-10 rounded-lg bg-secondary/20 text-secondary-foreground hover:bg-secondary/40 transition-colors flex items-center justify-center"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Now Playing</p>
            <p className="font-semibold text-foreground">Nothing playing</p>
            <p className="text-sm text-muted-foreground">Search for a song to get started</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchSongs()}
              placeholder="Search for a song..."
              className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button
            onClick={searchSongs}
            disabled={isSearching}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className={isFocused ? "space-y-2 flex-1 min-h-0 overflow-auto scrollbar-thin" : "space-y-2 max-h-56 overflow-y-auto scrollbar-thin"}>
            {searchResults.map((song, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
              >
                {song.image && (
                  <img
                    src={song.image}
                    alt={song.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                </div>
                <button
                  onClick={() => playSong(song)}
                  className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Play now"
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </button>
                <button
                  onClick={() => addToPlaylist(song)}
                  className="w-8 h-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Add to playlist"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playlist Toggle */}
      <button
        onClick={() => setShowPlaylist(!showPlaylist)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ListMusic className="w-4 h-4" />
        {showPlaylist ? "Hide" : "Show"} Playlist ({playlist.length})
      </button>

      {/* Playlist */}
      {showPlaylist && playlist.length > 0 && (
        <div className={isFocused ? "space-y-2 flex-1 min-h-0 overflow-auto scrollbar-thin" : "space-y-2 max-h-72 overflow-y-auto scrollbar-thin"}>
          {playlist.map((song, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
              {song.image && (
                <img
                  src={song.image}
                  alt={song.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
              </div>
              <button
                onClick={() => playSong(song)}
                className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Play"
              >
                <Play className="w-4 h-4 ml-0.5" />
              </button>
              <button
                onClick={() => removeFromPlaylist(idx)}
                className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
