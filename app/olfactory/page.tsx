import { OlfactoryModule } from "@/components/olfactory/olfactory-module"
import { createClient } from "@/lib/supabase/server"
import { parseOlfactoryProtocolVersion } from "@/lib/olfactory/protocol"

async function getActiveProtocol() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("olfactory_runtime_settings")
      .select("active_protocol")
      .limit(1)
      .single()
    return parseOlfactoryProtocolVersion(data?.active_protocol ?? "sat_v3_14")
  } catch {
    return "sat_v3_14" as const
  }
}

export default async function OlfactoryPage() {
  const protocolVersion = await getActiveProtocol()

  return (
    <main className="container mx-auto px-4 py-6">
      <OlfactoryModule protocolVersion={protocolVersion} />
    </main>
  )
}
