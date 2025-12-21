import { NextRequest, NextResponse } from "next/server"

let accessToken: string | null = null
let tokenExpiresAt: number = 0

async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured")
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error("Failed to get Spotify access token")
  }

  const data = await response.json()
  accessToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000

  return accessToken
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    const token = await getAccessToken()

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to search Spotify")
    }

    const data = await response.json()

    const songs = data.tracks.items.map((track: any) => ({
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      url: track.external_urls.spotify,
      image: track.album.images[0]?.url,
      preview: track.preview_url,
      id: track.id,
      duration: track.duration_ms,
    }))

    return NextResponse.json({ songs })
  } catch (error) {
    console.error("Spotify search error:", error)
    return NextResponse.json({ error: "Failed to search Spotify" }, { status: 500 })
  }
}
