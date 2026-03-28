"use client"

import { useMemo, useState } from "react"
import { AlertCircle, Music2 } from "lucide-react"

function extractTrackId(input: string) {
  const value = input.trim()
  if (!value) return ""

  if (/^[A-Za-z0-9]{22}$/.test(value)) {
    return value
  }

  const uriMatch = value.match(/^spotify:track:([A-Za-z0-9]{22})$/)
  if (uriMatch) {
    return uriMatch[1]
  }

  try {
    const url = new URL(value)
    const parts = url.pathname.split("/").filter(Boolean)
    const trackIndex = parts.findIndex((part) => part === "track")
    if (trackIndex >= 0 && parts[trackIndex + 1]) {
      const id = parts[trackIndex + 1]
      if (/^[A-Za-z0-9]{22}$/.test(id)) {
        return id
      }
    }
  } catch {
    return ""
  }

  return ""
}

export default function Spotify({ isFocused }: { isFocused?: boolean }) {
  const [trackInput, setTrackInput] = useState("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")

  const trackId = useMemo(() => extractTrackId(trackInput), [trackInput])
  const embedUrl = useMemo(() => {
    if (!trackId) return ""
    return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`
  }, [trackId])

  return (
    <div className={isFocused ? "h-full flex flex-col min-h-0" : "space-y-3"}>
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Music2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Spotify Track Embed</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Paste a Spotify track link, URI, or track ID and play it using Spotify&apos;s official embed player.
        </p>

        <input
          value={trackInput}
          onChange={(e) => setTrackInput(e.target.value)}
          placeholder="https://open.spotify.com/track/..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />

        {!trackId && trackInput.trim() && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>Invalid Spotify track link/URI/ID. Use a track value only.</span>
          </div>
        )}

        {trackId && (
          <a
            href={`https://open.spotify.com/track/${trackId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            Open Track in Spotify
          </a>
        )}
      </div>

      <section className="rounded-2xl border border-border bg-card p-3 sm:p-4 min-h-0 overflow-hidden">
        {embedUrl ? (
          <iframe
            title="Spotify track player"
            src={embedUrl}
            width="100%"
            height={isFocused ? "432" : "352"}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Enter a valid Spotify track to display player</div>
        )}
      </section>
    </div>
  )
}
