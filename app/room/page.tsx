"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Copy, Heart, Link2, PlusCircle, Sparkles, Users } from "lucide-react"

interface RoomDto {
	id: string
	code: string
	name: string
	ownerId: string
	createdAt: string
}

export default function RoomPage() {
	const router = useRouter()
	const [createdRoom, setCreatedRoom] = useState<RoomDto | null>(null)
	const [roomName, setRoomName] = useState("My Dashboard")
	const [joinInput, setJoinInput] = useState("")
	const [isCreating, setIsCreating] = useState(false)
	const [isJoining, setIsJoining] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	const createdRoomLink = useMemo(() => {
		if (!createdRoom?.code) return ""
		if (typeof window === "undefined") return ""
		return `${window.location.origin}/room/${createdRoom.code}/dashboard`
	}, [createdRoom?.code])

	async function handleCreateRoom() {
		setError(null)
		setIsCreating(true)
		setCopied(false)

		try {
			const response = await fetch("/api/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: roomName,
					userId: "demo-user",
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to create room")
			}

			const data = (await response.json()) as { room: RoomDto }
			setCreatedRoom(data.room)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not create room")
		} finally {
			setIsCreating(false)
		}
	}

	async function copyRoomLink() {
		if (!createdRoomLink) return
		await navigator.clipboard.writeText(createdRoomLink)
		setCopied(true)
	}

	function normalizeCode(value: string) {
		const normalized = value.trim()
		if (!normalized) return ""

		try {
			const parsed = new URL(normalized)
			const segments = parsed.pathname.split("/").filter(Boolean)
			const roomIndex = segments.findIndex((segment) => segment === "room")
			if (roomIndex >= 0 && segments[roomIndex + 1]) {
				return decodeURIComponent(segments[roomIndex + 1])
			}
			return decodeURIComponent(segments[segments.length - 1] ?? "")
		} catch {
			const segments = normalized.split("/").filter(Boolean)
			const roomIndex = segments.findIndex((segment) => segment === "room")
			if (roomIndex >= 0 && segments[roomIndex + 1]) {
				return decodeURIComponent(segments[roomIndex + 1])
			}
			return decodeURIComponent(segments[segments.length - 1] ?? "")
		}
	}

	async function handleJoinRoom(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setError(null)
		setIsJoining(true)
		const code = normalizeCode(joinInput)

		if (!code) {
			setError("Please provide a valid room code or link")
			setIsJoining(false)
			return
		}

		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: "demo-user" }),
			})

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Room not found")
				}
				throw new Error("Failed to join room")
			}

			router.push(`/room/${encodeURIComponent(code)}/dashboard`)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not join room")
		} finally {
			setIsJoining(false)
		}
	}

	return (
		<main className="h-screen overflow-hidden bg-background p-3 sm:p-4 lg:p-5 transition-colors duration-300">
			<div className="mx-auto flex h-full max-w-5xl flex-col">
				<div className="mb-4 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-md">
						<Heart className="h-6 w-6 fill-white text-white" />
					</div>
					<div>
						<h1 className="text-3xl font-bold text-foreground sm:text-4xl font-[family-name:var(--font-display)] text-balance">
							Together
						</h1>
						<p className="text-sm text-muted-foreground">Create or join your room ✨</p>
					</div>
				</div>

				<div className="mb-3 flex items-end justify-between gap-4">
					<div>
						<p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							<Sparkles className="h-3.5 w-3.5" />
							Room Setup
						</p>
						<h2 className="text-xl font-bold text-foreground sm:text-2xl font-[family-name:var(--font-display)]">
							Create or join your shared room
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Your room connects both of you to one dashboard.
						</p>
					</div>
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
					>
						Go to dashboard <ArrowRight className="h-4 w-4" />
					</Link>
				</div>

				{error && (
					<div className="mb-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
						{error}
					</div>
				)}

				<div className="mx-auto grid h-full min-h-0 w-full max-w-5xl grid-cols-1 items-start gap-3 lg:grid-cols-2">
					<section className="flex min-h-0 flex-col rounded-3xl border border-border bg-card p-4 shadow-lg sm:p-5">
						<div className="mb-5 flex items-center gap-3">
							<PlusCircle className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold text-foreground">Create a room</h2>
						</div>

						<p className="mb-3 text-sm leading-relaxed text-muted-foreground">
							Generate a unique room code and share the invite link with your partner.
						</p>

						<label htmlFor="room-name" className="mb-2 block text-sm font-medium text-foreground">
							Room name
						</label>
						<input
							id="room-name"
							type="text"
							value={roomName}
							onChange={(e) => setRoomName(e.target.value)}
							className="mb-3 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
						/>

						<button
							type="button"
							onClick={handleCreateRoom}
							disabled={isCreating}
							className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
						>
							{isCreating ? "Creating room..." : "Generate room code"}
						</button>

						{createdRoom?.code && (
							<div className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your room code</p>
								<p className="text-xl font-bold tracking-widest text-foreground">{createdRoom.code}</p>
								<p className="truncate text-xs text-muted-foreground" title={createdRoomLink}>{createdRoomLink}</p>

								<div className="flex flex-wrap items-center gap-2">
									<button
										type="button"
										onClick={copyRoomLink}
										className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
									>
										<Copy className="h-3.5 w-3.5" />
										{copied ? "Copied" : "Copy room link"}
									</button>
									<button
										type="button"
										onClick={() => router.push(`/room/${encodeURIComponent(createdRoom.code)}/dashboard`)}
										className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
									>
										<Users className="h-3.5 w-3.5" />
										Open room
									</button>
								</div>
							</div>
						)}
					</section>

					<section className="h-fit self-start rounded-3xl border border-border bg-card p-4 shadow-lg sm:p-5">
						<div className="mb-5 flex items-center gap-3">
							<Link2 className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold text-foreground">Join a room</h2>
						</div>

						<p className="mb-3 text-sm leading-relaxed text-muted-foreground">
							Paste a room code or full invite link to join.
						</p>

						<form onSubmit={handleJoinRoom} className="space-y-3">
							<label htmlFor="room-input" className="text-sm font-medium text-foreground">
								Room code or link
							</label>
							<input
								id="room-input"
								type="text"
								value={joinInput}
								onChange={(e) => setJoinInput(e.target.value)}
								placeholder="V1StGXR8_Z or https://.../room/V1StGXR8_Z"
								required
								className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
							/>
							<button
								type="submit"
								disabled={isJoining}
								className="h-10 w-full rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted"
							>
								{isJoining ? "Joining room..." : "Join room"}
							</button>
						</form>
					</section>
				</div>
			</div>
		</main>
	)
}
