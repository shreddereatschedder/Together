import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
// Your own logic for dealing with plaintext password strings; be careful!
import saltAndHashPassword from "@/lib/utils"
import { getUserFromDb } from "@/lib/data"
import bcrypt from "bcrypt"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        console.log("[DEBUG] Authorize called with credentials:", credentials);
        // Fetch user from DB by email
        const user = await getUserFromDb(String(credentials.email));
        console.log("[DEBUG] User from DB:", user);
        if (!user) {
          console.log("[DEBUG] No user found for email:", credentials.email);
          return null;
        }
        if (!user.password_hash) {
          console.log("[DEBUG] User found but no password_hash field:", user);
          return null;
        }
        // Compare provided password with stored hash
        try {
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );
          console.log("[DEBUG] Password match result:", passwordMatch);
          if (!passwordMatch) {
            console.log("[DEBUG] Password did not match for user:", user.email);
            return null;
          }
        } catch (err) {
          console.log("[DEBUG] Error during bcrypt.compare:", err);
          return null;
        }
        // Return minimal user object for session
        console.log("[DEBUG] Authentication successful for user:", user.email);
        return { id: String(user.user_id), email: user.email, name: user.user_name };
      },
    }),
  ],
})