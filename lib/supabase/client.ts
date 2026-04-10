import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

declare global {
  var __mentalAssessSupabaseClient__: SupabaseClient | undefined
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return { supabaseUrl, supabasePublishableKey }
}

export function createClient() {
  if (typeof window !== "undefined" && globalThis.__mentalAssessSupabaseClient__) {
    return globalThis.__mentalAssessSupabaseClient__
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig()
  const client = createBrowserClient(supabaseUrl, supabasePublishableKey)

  if (typeof window !== "undefined") {
    globalThis.__mentalAssessSupabaseClient__ = client
  }

  return client
}
