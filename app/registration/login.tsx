"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Heart, Lock, Mail, Sparkles } from "lucide-react"
import { signIn } from "next-auth/react";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string
        const result = await signIn("credentials", { email, password, redirect: false })
        setIsSubmitting(false)

		if (result?.error) {    
			alert(result.error)
		} else {
			router.push("/room")
		}       
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
							Together
						</h1>
						<p className="text-sm text-muted-foreground">Welcome back 💜</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
					<section className="bg-card rounded-3xl border border-border shadow-lg p-6 sm:p-8 flex flex-col justify-between">
						<div>
							<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5">
								<Sparkles className="w-3.5 h-3.5" />
								Couple Space
							</div>

							<h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-3 font-[family-name:var(--font-display)]">
								Log in to your cozy dashboard
							</h2>

							<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
								Keep your playlists, watch list, games, and favourites all in one place — beautifully synced for both of you.
							</p>
						</div>

						<div className="mt-8 rounded-2xl border border-border bg-muted/40 p-4">
							<p className="text-sm text-foreground font-medium mb-1">New here?</p>
							<p className="text-sm text-muted-foreground mb-3">Create an account and start customizing your space together.</p>
							<Link
								href="/registration"
								className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
							>
								Create account <ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</section>

					<section className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden">
						<div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-muted/50 to-transparent border-b border-border">
							<h3 className="text-lg font-semibold text-foreground">Sign in</h3>
						</div>

						<form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
							{error && <p className="text-sm text-red-600">{error}</p>}

							<div className="space-y-2">
								<label htmlFor="email" className="text-sm font-medium text-foreground">
									Email
								</label>
								<div className="relative">
									<Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
									<input
										id="email"
										name="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										placeholder="you@example.com"
										className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between gap-3">
									<label htmlFor="password" className="text-sm font-medium text-foreground">
										Password
									</label>
									<Link href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
										Forgot password?
									</Link>
								</div>

								<div className="relative">
									<Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
									<input
										id="password"
										name="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										placeholder="Enter your password"
										className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
									/>
									<button
										type="button"
										onClick={() => setShowPassword((prev) => !prev)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
									</button>
								</div>
							</div>

							<button
								type="submit"
								disabled={isSubmitting}
								className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
							>
								{isSubmitting ? "Signing you in..." : "Log in"}
							</button>

							<p className="text-sm text-center text-muted-foreground">
								Want to look around first?{" "}
								<Link href="/" className="text-primary font-medium hover:text-primary/80 transition-colors">
									Go to dashboard
								</Link>
							</p>
						</form>
					</section>
				</div>
			</div>
		</main>
	)
}
