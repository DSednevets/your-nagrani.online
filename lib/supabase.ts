import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        `Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL=${url ?? "undefined"}, NEXT_PUBLIC_SUPABASE_ANON_KEY=${key ? "[set]" : "undefined"}`
      );
    }

    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Named export for convenience — created lazily on first access
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
