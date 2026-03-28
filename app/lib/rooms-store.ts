import { nanoid } from "nanoid"

export interface Room {
	id: string
	code: string
	name: string
	ownerId: string
	createdAt: string
	expiresAt?: string
}

export interface RoomMember {
	roomId: string
	userId: string
	role: "owner" | "member"
	joinedAt: string
}

interface RoomsStore {
	roomsByCode: Map<string, Room>
	membersByRoomId: Map<string, Map<string, RoomMember>>
}

declare global {
	var __togetherRoomsStore: RoomsStore | undefined
}

function getStore(): RoomsStore {
	if (!globalThis.__togetherRoomsStore) {
		globalThis.__togetherRoomsStore = {
			roomsByCode: new Map<string, Room>(),
			membersByRoomId: new Map<string, Map<string, RoomMember>>(),
		}
	}

	return globalThis.__togetherRoomsStore
}

async function roomCodeExists(code: string) {
	return getStore().roomsByCode.has(code)
}

async function generateUniqueRoomCode() {
	let code = nanoid(10)

	while (await roomCodeExists(code)) {
		code = nanoid(10)
	}

	return code
}

export async function createRoom(userId: string, name: string) {
	const now = new Date().toISOString()
	const room: Room = {
		id: crypto.randomUUID(),
		code: await generateUniqueRoomCode(),
		name,
		ownerId: userId,
		createdAt: now,
	}

	const store = getStore()
	store.roomsByCode.set(room.code, room)

	const ownerMember: RoomMember = {
		roomId: room.id,
		userId,
		role: "owner",
		joinedAt: now,
	}

	store.membersByRoomId.set(room.id, new Map([[userId, ownerMember]]))

	return room
}

export async function getRoomByCode(code: string) {
	return getStore().roomsByCode.get(code) ?? null
}

export async function joinRoom(code: string, userId: string) {
	const room = await getRoomByCode(code)
	if (!room) {
		return null
	}

	const members = getStore().membersByRoomId.get(room.id) ?? new Map<string, RoomMember>()
	const existing = members.get(userId)

	if (!existing) {
		members.set(userId, {
			roomId: room.id,
			userId,
			role: userId === room.ownerId ? "owner" : "member",
			joinedAt: new Date().toISOString(),
		})
	}

	getStore().membersByRoomId.set(room.id, members)

	return {
		room,
		member: members.get(userId)!,
		memberCount: members.size,
	}
}
