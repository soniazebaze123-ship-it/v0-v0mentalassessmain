const { createClient } = require("@supabase/supabase-js")

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(url, key)

  const { data: rows, error } = await supabase
    .from("sensory_assessments")
    .select("user_id, raw_score, normalized_score, test_date")
    .eq("test_type", "olfactory")

  if (error) {
    console.error("query error:", error.message)
    process.exit(1)
  }

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone_number")
    .in("id", userIds)

  const userMap = new Map(users.map((u) => [u.id, u]))
  const nameOf = (id) => {
    const u = userMap.get(id)
    if (!u) return id
    return u.name || u.phone_number || id
  }

  const scored = rows.filter((r) => r.normalized_score !== null || r.raw_score !== null)
  const nul = rows.filter((r) => r.normalized_score === null && r.raw_score === null)

  scored.sort((a, b) => (b.normalized_score ?? 0) - (a.normalized_score ?? 0))
  nul.sort((a, b) => String(nameOf(a.user_id)).localeCompare(String(nameOf(b.user_id))))

  console.log("TOTAL olfactory rows:", rows.length)
  console.log("SCORED:", scored.length, "| NULL:", nul.length)
  console.log("\n===== SCORED PATIENTS =====")
  scored.forEach((r, i) => {
    console.log(
      `${i + 1}. ${nameOf(r.user_id)} | raw=${r.raw_score} | normalized=${r.normalized_score} | date=${r.test_date}`,
    )
  })
  console.log("\n===== NULL PATIENTS =====")
  nul.forEach((r, i) => {
    console.log(`${i + 1}. ${nameOf(r.user_id)} | raw=${r.raw_score} | normalized=${r.normalized_score} | date=${r.test_date}`)
  })
}

main()
