import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPhoneLookupCandidates, normalizePhoneNumber } from "@/lib/auth/phone"
import { verifyPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (phoneNumber.length < 6 || password.length === 0) {
      return NextResponse.json({ error: "Phone number and password are required." }, { status: 400 })
    }

    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber) || phoneNumber.trim()
    const normalizedCandidates = getPhoneLookupCandidates(normalizedPhoneNumber)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, phone_number, name, date_of_birth, gender, national_id, password_hash")
      .in("phone_number", normalizedCandidates)
      .limit(1)

    let existingUser = data?.[0]

    if (error) {
      const isSchemaIssue =
        error.code === "42703" ||
        error.code === "PGRST204" ||
        error.message.includes("does not exist") ||
        error.message.includes("password_hash") ||
        error.message.includes("date_of_birth") ||
        error.message.includes("gender") ||
        error.message.includes("national_id") ||
        error.message.includes("name") ||
        error.message.includes("email")

      if (!isSchemaIssue) {
        return NextResponse.json({ error: "Database error during login. Please try again." }, { status: 500 })
      }

      // Older schemas may lack optional profile fields, but password verification
      // is always required. Never fall back to a passwordless user lookup.
      const { data: fallbackUsers, error: fallbackError } = await supabase
        .from("users")
        .select("id, phone_number, password_hash")
        .in("phone_number", normalizedCandidates)
        .limit(1)

      if (fallbackError) {
        return NextResponse.json(
          { error: "Password login is unavailable. Please contact the app administrator." },
          { status: 503 },
        )
      }

      const fallbackUser = fallbackUsers?.[0]
      existingUser = fallbackUser
        ? { ...fallbackUser, email: null, name: null, date_of_birth: null, gender: null, national_id: null }
        : undefined
    }

    if (!existingUser) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 })
    }

    if (!existingUser.password_hash) {
      return NextResponse.json(
        { error: "This account needs a secure password reset. Please contact the app administrator." },
        { status: 403 },
      )
    }

    if (!verifyPassword(password, existingUser.password_hash)) {
      return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 })
    }

    const safeUser = {
      id: existingUser.id,
      email: existingUser.email,
      phone_number: existingUser.phone_number,
      name: existingUser.name,
      date_of_birth: existingUser.date_of_birth,
      gender: existingUser.gender,
      national_id: (existingUser as Record<string, unknown>).national_id as string | undefined,
    }
    return NextResponse.json({ user: safeUser })
  } catch {
    return NextResponse.json({ error: "Unable to log in. Please try again." }, { status: 500 })
  }
}
