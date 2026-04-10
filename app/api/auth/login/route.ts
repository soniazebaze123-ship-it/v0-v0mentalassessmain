import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPhoneLookupCandidates } from "@/lib/auth/phone"
import { verifyPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const phoneLookupCandidates = getPhoneLookupCandidates(phoneNumber)

    if (phoneNumber.length < 6 || password.length < 8) {
      return NextResponse.json({ error: "Phone number and password are required." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, phone_number, name, date_of_birth, gender, password_hash")
      .in("phone_number", phoneLookupCandidates)
      .limit(1)

    if (error) {
      if (error.message.includes("password_hash")) {
        return NextResponse.json(
          { error: "Password login is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: "Database error during login." }, { status: 500 })
    }

    const existingUser = data?.[0]

    if (!existingUser) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 })
    }

    if (!existingUser.password_hash) {
      return NextResponse.json(
        { error: "This account does not have a password yet. Please register again or add a password migration first." },
        { status: 409 },
      )
    }

    if (!verifyPassword(password, existingUser.password_hash)) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 })
    }

    const { password_hash: _passwordHash, ...safeUser } = existingUser
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected login error." },
      { status: 500 },
    )
  }
}