import Dashboard from "@/app/dashboard"

export default async function RoomDashboardPage({
	params,
}: {
	params: Promise<{ code: string }>
}) {
	const { code } = await params

	return <Dashboard roomCode={code} />
}
