import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { UserRow } from "@/lib/types/db"

export async function getUserFromDb(email: string): Promise<UserRow | null> {
    const supabase = getSupabaseServerClient()

    if (!supabase) {
        return null
    }

    const { data, error } = await supabase
        .from("users")
        .select("user_id, email, user_name, password_hash")
        .eq("email", email)
        .maybeSingle<UserRow>()

    if (error) {
        console.error("Error fetching user from Supabase:", error.message)
        return null
    }

    return data
}