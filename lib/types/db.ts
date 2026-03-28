export type UserRow = {
  user_id: number;
  email: string;
  user_name: string | null;
  password_hash: string | null;
  created_at?: string;
}
