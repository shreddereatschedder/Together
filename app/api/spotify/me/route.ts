import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
  }

  const response = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  const data = await response.json().catch(() => ({} as any))
  if (!response.ok) {
    const message = data?.error?.message || data?.error || "Failed to load Spotify profile"
    return NextResponse.json({ error: String(message) }, { status: response.status })
  }

  return NextResponse.json(data)
}
