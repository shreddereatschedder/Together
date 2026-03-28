import { NextRequest, NextResponse } from "next/server"
import { joinRoom } from "@/app/lib/rooms-store"

interface RouteParams {
	params: Promise<{
		code: string
	}>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { code } = await params
		const body = await request.json()
		const userId = typeof body?.userId === "string" && body.userId.trim() ? body.userId.trim() : "demo-user"

		const result = await joinRoom(code, userId)
		if (!result) {
			return NextResponse.json({ error: "Room not found" }, { status: 404 })
		}

		return NextResponse.json(result)
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
	}
}
