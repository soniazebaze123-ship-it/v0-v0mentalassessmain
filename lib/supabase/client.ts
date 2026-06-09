import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

declare global {
  var __mentalAssessSupabaseClient__: SupabaseClient | undefined
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY

  // If missing, return nulls instead of throwing so the client can mount safely.
  if (!supabaseUrl || !supabasePublishableKey) {
    // In development we want to be noisy; in production prefer graceful degradation.
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_URL, or SUPABASE_ANON_KEY.",
      )
    }

    // Return placeholders so createClient can decide how to proceed.
    return { supabaseUrl: null as unknown as string, supabasePublishableKey: null as unknown as string }
  }

  return { supabaseUrl, supabasePublishableKey }
}

function createNoopPromise<T>(data: T) {
  return Promise.resolve({ data, error: null })
}

function createChainableNoopQuery() {
  const response = createNoopPromise([])

  const handler: ProxyHandler<(...args: unknown[]) => unknown> = {
    get(_target, prop) {
      if (prop === "then") return response.then.bind(response)
      if (prop === "catch") return response.catch.bind(response)
      if (prop === "finally") return response.finally.bind(response)
      if (prop === "single" || prop === "maybeSingle") {
        return () => createNoopPromise(null)
      }
      return createChainableNoopQuery()
    },
    apply() {
      return createChainableNoopQuery()
    },
  }

  return new Proxy(() => response, handler) as unknown as ReturnType<typeof createBrowserClient>
}

export function createClient() {
  if (typeof window !== "undefined" && globalThis.__mentalAssessSupabaseClient__) {
    return globalThis.__mentalAssessSupabaseClient__
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig()

  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn(
      "Supabase client not initialized: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. Falling back to noop client.",
    )

    const noop = {
      from: createChainableNoopQuery,
      rpc: async () => ({ data: null, error: null }),
      auth: {
        signIn: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        user: () => null,
        onAuthStateChange: () => ({ data: null, error: null }),
        refreshSession: async () => ({ data: null, error: null }),
      },
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: null }, error: null }),
          upload: async () => ({ data: null, error: null }),
          download: async () => ({ data: null, error: null }),
          remove: async () => ({ data: null, error: null }),
        }),
      },
      functions: {
        invoke: async () => ({ data: null, error: null }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>

    if (typeof window !== "undefined") {
      globalThis.__mentalAssessSupabaseClient__ = noop
    }

    return noop
  }

  const client = createBrowserClient(supabaseUrl, supabasePublishableKey)

  if (typeof window !== "undefined") {
    globalThis.__mentalAssessSupabaseClient__ = client
  }

  return client
}
