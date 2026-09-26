import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key - bypasses RLS, so this
// must never be imported from client components. Everything that touches
// it today (lib/db.ts) is only ever used from API routes.
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
