"use client"
import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../app/lib/supabase"
import { Play, X, AlertCircle } from "lucide-react"

function extractVideoId(url: string): string | null {
  console.log("[v0] Extracting video ID from:", url)
  try {
    const u = new URL(url)

    // youtu.be/ID
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1)
      console.log("[v0] Extracted from youtu.be:", id)
      return id
    }

    // youtube.com/watch?v=ID
    if (u.searchParams.get("v")) {
      const id = u.searchParams.get("v")
      console.log("[v0] Extracted from watch param:", id)
      return id
    }

    // youtube.com/embed/ID
    if (u.pathname.includes("/embed/")) {
      const id = u.pathname.split("/embed/")[1]
      console.log("[v0] Extracted from embed:", id)
      return id
    }
  } catch (error) {
    console.log("[v0] Error parsing URL:", error)
    return null
  }

  console.log("[v0] No video ID found")
  return null
}

export default function YouTubeWidget({ isFocused }: { isFocused?: boolean }) {
  const [videos, setVideos] = useState<string[]>([])
  const [newVideo, setNewVideo] = useState("")
  const [meta, setMeta] = useState<Record<string, { title: string; author: string }>>({})

  useEffect(() => {
    if (!supabase || !isConfigured) {
      console.log("[v0] Supabase not configured")
      return
    }

    const channel = supabase
      .channel("youtube")
      .on("postgres_changes", { event: "*", schema: "public", table: "widgets", filter: "id=eq.youtube" }, (payload: any) => {
        if (payload.new?.video) {
          setVideos(payload.new.video)
        } else {
          setVideos([])
        }
      })
      .subscribe()

    // Initial fetch
    supabase
      .from("widgets")
      .select("video")
      .eq("id", "youtube")
      .single()
      .then(({ data }: any) => {
        if (data?.video) {
          setVideos(data.video)
        } else {
          setVideos([])
        }
      })

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [])

  const addVideo = async () => {
    if (!newVideo.trim() || !supabase) return
    const id = extractVideoId(newVideo)
    if (!id) return
    const updatedVideos = [id]
    
    // Update UI immediately
    setVideos(updatedVideos)
    setNewVideo("")
    
    // Sync to Supabase
    try {
      const { error } = await supabase.from("widgets").update({ video: updatedVideos }).eq("id", "youtube")
      if (error) {
        console.error("[v0] Error updating video:", error)
        // Revert on error
        setVideos(videos)
      }
    } catch (error) {
      console.error("[v0] Error updating video:", error)
      // Revert on error
      setVideos(videos)
    }
  }

  const removeVideo = async (id: string) => {
    if (!supabase) return
    const updatedVideos = videos.filter((v) => v !== id)
    
    // Update UI immediately
    setVideos(updatedVideos)
    
    // Sync to Supabase
    try {
      const { error } = await supabase.from("widgets").update({ video: updatedVideos }).eq("id", "youtube")
      if (error) {
        console.error("[v0] Error removing video:", error)
        // Revert on error
        setVideos(videos)
      }
    } catch (error) {
      console.error("[v0] Error removing video:", error)
      // Revert on error
      setVideos(videos)
    }
    // remove cached meta for removed video
    setMeta((m) => {
      const copy = { ...m }
      delete copy[id]
      return copy
    })
  }

  // Fetch oEmbed metadata (title + author) for videos
  useEffect(() => {
    if (videos.length === 0) return

    videos.forEach(async (id) => {
      if (meta[id]) return // already fetched
      try {
        const url = `https://www.youtube.com/watch?v=${id}`
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
        if (!res.ok) throw new Error("oEmbed fetch failed")
        const data = await res.json()
        setMeta((m) => ({ ...m, [id]: { title: data.title, author: data.author_name } }))
      } catch (err) {
        console.warn("YouTube oEmbed failed for", id, err)
      }
    })
  }, [videos])

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
      <div className="flex gap-2">
        <input
          type="text"
          value={newVideo}
          onChange={(e) => setNewVideo(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addVideo()}
          placeholder="Paste YouTube URL..."
          className="flex-1 px-4 py-2.5 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        />
        <button
          onClick={addVideo}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Play className="w-5 h-5" />
        </button>
      </div>

      {videos.length > 0 ? (
        <div className={isFocused ? "space-y-3 pr-2 flex-1 flex flex-col min-h-0 overflow-hidden" : "space-y-3 max-h-72 overflow-y-auto pr-2"}>
            {videos.map((videoId) => (
              <div key={videoId} className={isFocused ? "relative flex-1 flex flex-col items-center min-h-0" : "relative"}>
                <div
                  className={`relative rounded-xl overflow-hidden bg-muted ${isFocused ? "w-full max-w-[960px] mx-auto flex-1 min-h-0" : "pt-[56.25%]"}`}
                  style={isFocused ? undefined : undefined}
                >
                  <iframe className="absolute top-0 left-0 w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} allow="autoplay; encrypted-media" allowFullScreen />
                </div>

                <button onClick={() => removeVideo(videoId)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors backdrop-blur-sm" title="Remove video">
                  <X className="w-4 h-4" />
                </button>

                <div className={isFocused ? "mt-3 px-1 w-full max-w-[960px] mx-auto text-center" : "mt-3 px-1"}>
                  {meta[videoId] ? (
                    <div className="flex flex-col items-start gap-1">
                      <p className="text-base sm:text-lg font-semibold text-foreground leading-tight">{meta[videoId].title}</p>
                      <p className="text-sm text-muted-foreground">{meta[videoId].author}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Loading title...</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <Play className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No videos added yet</p>
        </div>
      )}
    </div>
  )
}

