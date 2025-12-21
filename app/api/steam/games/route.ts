import type { NextRequest } from "next/server"

const COOP_TAG = "1685" // Co-op
const MULTIPLAYER_TAG = "3859" // Multiplayer

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

    const type = searchParams.get("type") || "popular" // popular | recent
    const free = searchParams.get("free") === "true"
    const sort = type === "recent" ? "Released_DESC" : "Popular_DESC"
    const url = new URL("https://store.steampowered.com/api/storesearch")

    url.searchParams.set("l", "english")
    url.searchParams.set("cc", "GB")
    url.searchParams.set("page", "1")
    url.searchParams.set("page_size", "20")
    url.searchParams.set("sort_by", sort)
    url.searchParams.set("tags", `${COOP_TAG},${MULTIPLAYER_TAG}`)

    if (free) {
      url.searchParams.set("maxprice", "0")
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    })

    const data = await res.json()

    const games = data.items.map((g: any) => ({
      id: g.id,
      title: g.name,
      poster: g.tiny_image,
      developer: g.developer || "Unknown",
      free: g.price?.final === 0,
    }))

    return Response.json(games)
  } catch (error) {
    console.error("Steam API error:", error)
    return Response.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}
