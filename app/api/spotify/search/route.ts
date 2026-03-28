import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

interface SpotifyArtist {
  name: string
}

interface SpotifyImage {
  url: string
}

interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  uri?: string
  external_urls?: {
    spotify?: string
  }
  album?: {
    images?: SpotifyImage[]
  }
  duration_ms?: number
}

function mapTrack(track: SpotifyTrack) {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name).join(", "),
    uri: track.uri,
    url: track.external_urls?.spotify,
    image: track.album?.images?.[0]?.url,
    duration: track.duration_ms,
  }
}

async function spotifyFetch(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  const raw = await response.text()
  let data: any = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = {}
  }

  if (!response.ok) {
    const reason =
      data?.error?.message ||
      data?.error ||
      (raw ? `Spotify API request failed: ${raw}` : `Spotify API request failed with status ${response.status}`)
    throw new Error(String(reason))
  }

  return data
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const token = session?.accessToken
    if (!token) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    const searchData = await spotifyFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      token,
    )

    const tracks = (searchData?.tracks?.items ?? []).map((track: SpotifyTrack) => mapTrack(track))

    return NextResponse.json({ tracks })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search Spotify"
    console.error("Spotify search error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
