// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if all required Supabase config values are present
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== "your_supabase_url_here" && supabaseAnonKey !== "your_supabase_anon_key_here"

if (!isSupabaseConfigured) {
  console.error(
    "[v0] Supabase configuration is incomplete. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
  )
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null
export const isConfigured = isSupabaseConfigured
