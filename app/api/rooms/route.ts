import { NextRequest, NextResponse } from "next/server"
import { createRoom } from "@/app/lib/rooms-store"

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const userId = typeof body?.userId === "string" && body.userId.trim() ? body.userId.trim() : "demo-user"
		const roomName = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "My Dashboard"

		const room = await createRoom(userId, roomName)

		return NextResponse.json({ room }, { status: 201 })
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}
}
