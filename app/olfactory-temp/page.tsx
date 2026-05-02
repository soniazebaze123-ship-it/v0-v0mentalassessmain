import { OlfactoryModule } from "@/components/olfactory/olfactory-module"
import type { OlfactoryProtocolVersion } from "@/lib/olfactory/types"
import { createClient } from "@/lib/supabase/server"

async function getActiveOlfactoryProtocol(): Promise<OlfactoryProtocolVersion> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("olfactory_runtime_settings")
      .select("active_protocol")
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn("[v0] Failed to load olfactory runtime setting, defaulting to temp_v1:", error.message)
      return "temp_v1"
    }

    return data?.active_protocol === "sat_v2" ? "sat_v2" : "temp_v1"
  } catch (error) {
    console.warn("[v0] Runtime setting table unavailable, defaulting to temp_v1", error)
    return "temp_v1"
  }
}

export default async function OlfactoryTempPage() {
  const activeProtocol = await getActiveOlfactoryProtocol()

  return (
    <main className="container mx-auto px-4 py-6">
      <OlfactoryModule protocolVersion={activeProtocol} />
    </main>
  )
}
