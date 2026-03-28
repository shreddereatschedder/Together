import { NextResponse } from "next/server"
import { getRoomByCode } from "@/app/lib/rooms-store"

interface RouteParams {
	params: Promise<{
		code: string
	}>
}

export async function GET(_: Request, { params }: RouteParams) {
	const { code } = await params
	const room = await getRoomByCode(code)

	if (!room) {
		return NextResponse.json({ error: "Room not found" }, { status: 404 })
	}

	return NextResponse.json({ room })
}
