"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** A anon key é pública por design; a proteção dos dados vem das políticas RLS (supabase/schema.sql). */
export const supabaseConfigured = Boolean(url && anon);

let client: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(url!, anon!);
  return client;
}
