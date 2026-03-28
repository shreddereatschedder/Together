import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Heart, UserRound } from "lucide-react"

interface RoomDto {
	id: string
	code: string
	name: string
	ownerId: string
	createdAt: string
	expiresAt?: string
}

async function getRoom(code: string): Promise<RoomDto | null> {
	const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/rooms/${encodeURIComponent(code)}`, {
		cache: "no-store",
	})

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw new Error("Failed to load room")
	}

	const data = (await response.json()) as { room: RoomDto }
	return data.room
}

export default async function RoomDetailsPage({
	params,
}: {
	params: Promise<{ code: string }>
}) {
	const { code } = await params
	const room = await getRoom(code)

	if (!room) {
		notFound()
	}

	return (
		<main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 transition-colors duration-300">
			<div className="max-w-5xl mx-auto">
				<div className="flex items-center gap-3 mb-8">
					<div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
						<Heart className="w-6 h-6 text-white fill-white" />
					</div>
					<div>
						<h1 className="text-3xl sm:text-4xl font-bold text-foreground font-[family-name:var(--font-display)] text-balance">
							Together Room
						</h1>
						<p className="text-sm text-muted-foreground">Your shared dashboard space</p>
					</div>
				</div>

				<section className="bg-card rounded-3xl border border-border shadow-lg p-6 sm:p-8">
					<div className="flex items-center justify-between gap-3 mb-5">
						<h2 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">{room.name}</h2>
						<p className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">Code: {room.code}</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="rounded-2xl border border-border bg-muted/40 p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Owner</p>
							<p className="flex items-center gap-2 text-sm font-medium text-foreground">
								<UserRound className="w-4 h-4 text-primary" />
								{room.ownerId}
							</p>
						</div>

						<div className="rounded-2xl border border-border bg-muted/40 p-4">
							<p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Created</p>
							<p className="flex items-center gap-2 text-sm font-medium text-foreground">
								<Calendar className="w-4 h-4 text-primary" />
								{new Date(room.createdAt).toLocaleString()}
							</p>
						</div>
					</div>

					<div className="mt-6">
						<Link
							href="/"
							className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
						>
							<ArrowLeft className="w-4 h-4" /> Back to dashboard
						</Link>
					</div>
				</section>
			</div>
		</main>
	)
}
