import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@/lib/supabase/server"
import { getPhoneLookupCandidates, normalizePhoneNumber } from "@/lib/auth/phone"
import { hashPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const nationalId = typeof body.nationalId === "string" ? body.nationalId.trim() : ""
    const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : ""
    const gender = typeof body.gender === "string" ? body.gender : ""
    const password = typeof body.password === "string" ? body.password : ""
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
    const phoneLookupCandidates = getPhoneLookupCandidates(phoneNumber)

    if (phoneNumber.length < 6 || name.length < 2 || nationalId.length < 3 || !dateOfBirth || !gender || password.length < 8) {
      return NextResponse.json({ error: "Missing required registration fields." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id, email, phone_number, name, national_id, date_of_birth, gender, password_hash")
      .in("phone_number", phoneLookupCandidates)
      .limit(1)

    if (checkError) {
      if (checkError.message.includes("password_hash")) {
        return NextResponse.json(
          { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
          { status: 503 },
        )
      }

      if (checkError.message.includes("national_id")) {
        return NextResponse.json(
          { error: "National ID registration is not ready yet. Run scripts/12-add-user-national-id.sql in Supabase first." },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: "Could not verify existing account." }, { status: 500 })
    }

    const generatedEmail = `${normalizedPhoneNumber.replace(/[^0-9]/g, "")}@mentalassess.app`
    const passwordHash = hashPassword(password)

    const existingUser = existingUsers?.[0]

    if (existingUser) {
      if (existingUser.password_hash) {
        return NextResponse.json({ error: "Phone number already registered." }, { status: 409 })
      }

      const { data: updatedUsers, error: updateError } = await supabase
        .from("users")
        .update({
          email: existingUser.email || generatedEmail,
          phone_number: normalizedPhoneNumber,
          name,
          national_id: nationalId,
          date_of_birth: dateOfBirth,
          gender,
          password_hash: passwordHash,
        })
        .eq("id", existingUser.id)
        .select("id, email, phone_number, name, national_id, date_of_birth, gender")

      if (updateError) {
        if (updateError.message.includes("password_hash")) {
          return NextResponse.json(
            { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
            { status: 503 },
          )
        }

        if (updateError.message.includes("national_id")) {
          return NextResponse.json(
            { error: "National ID registration is not ready yet. Run scripts/12-add-user-national-id.sql in Supabase first." },
            { status: 503 },
          )
        }

        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ user: updatedUsers?.[0] ?? null })
    }

    const { data: newUsers, error: insertError } = await supabase
      .from("users")
      .insert({
        id: uuidv4(),
        phone_number: normalizedPhoneNumber,
        email: generatedEmail,
        name,
        national_id: nationalId,
        date_of_birth: dateOfBirth,
        gender,
        password_hash: passwordHash,
      })
      .select("id, email, phone_number, name, national_id, date_of_birth, gender")

    if (insertError) {
      if (insertError.message.includes("password_hash")) {
        return NextResponse.json(
          { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
          { status: 503 },
        )
      }

      if (insertError.message.includes("national_id")) {
        return NextResponse.json(
          { error: "National ID registration is not ready yet. Run scripts/12-add-user-national-id.sql in Supabase first." },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ user: newUsers?.[0] ?? null })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected registration error." },
      { status: 500 },
    )
  }
}