import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

type TokenPayload = {
  accessToken?: string
  refreshToken?: string
  accessTokenExpires?: number
  error?: "RefreshAccessTokenError"
}

async function refreshSpotifyAccessToken(token: TokenPayload) {
  try {
    if (!token.refreshToken) {
      return { ...token, error: "RefreshAccessTokenError" as const }
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID || "",
      client_secret: process.env.SPOTIFY_CLIENT_SECRET || "",
    })

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    })

    const refreshed = await response.json()
    if (!response.ok) {
      return { ...token, error: "RefreshAccessTokenError" as const }
    }

    return {
      ...token,
      accessToken: refreshed.access_token as string,
      accessTokenExpires: Date.now() + (Number(refreshed.expires_in) || 3600) * 1000,
      refreshToken: (refreshed.refresh_token as string | undefined) || token.refreshToken,
      error: undefined,
    }
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "user-read-email user-read-private playlist-read-private playlist-read-collaborative",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const nextToken: TokenPayload = {
        ...token,
        accessToken: token.accessToken as string | undefined,
        refreshToken: token.refreshToken as string | undefined,
        accessTokenExpires: token.accessTokenExpires as number | undefined,
      }

      if (account?.provider === "spotify") {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: Date.now() + (Number(account.expires_in) || 3600) * 1000,
          error: undefined,
        }
      }

      if (nextToken.accessToken && nextToken.accessTokenExpires && Date.now() < nextToken.accessTokenExpires - 60_000) {
        return token
      }

      const refreshed = await refreshSpotifyAccessToken(nextToken)
      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: refreshed.accessTokenExpires,
        error: refreshed.error,
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.authError = token.error as "RefreshAccessTokenError" | undefined
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})
