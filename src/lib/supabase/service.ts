import { createClient } from "@supabase/supabase-js";

// Cliente con service role — bypasa RLS. Solo usar en API routes del servidor.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
