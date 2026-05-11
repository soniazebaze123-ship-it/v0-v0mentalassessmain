import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@/lib/supabase/server"
import { getPhoneLookupCandidates, normalizePhoneNumber } from "@/lib/auth/phone"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : ""
    const gender = typeof body.gender === "string" ? body.gender : ""
    const password = typeof body.password === "string" ? body.password : ""
    const nationalId = typeof body.nationalId === "string" ? body.nationalId.trim() : ""
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
    const phoneLookupCandidates = getPhoneLookupCandidates(phoneNumber)

    if (phoneNumber.length < 6 || name.length < 2 || !dateOfBirth || !gender || password.length < 8) {
      return NextResponse.json({ error: "Missing required registration fields." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("id, email, phone_number, name, date_of_birth, gender, password_hash")
      .in("phone_number", phoneLookupCandidates)
      .limit(1)

    if (checkError) {
      if (checkError.message.includes("password_hash")) {
        return NextResponse.json(
          { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
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
        if (!verifyPassword(password, existingUser.password_hash)) {
          return NextResponse.json({ error: "Phone number already registered." }, { status: 409 })
        }

        const completeProfilePayload: Record<string, unknown> = {
          email: existingUser.email || generatedEmail,
          phone_number: normalizedPhoneNumber,
          name,
          date_of_birth: dateOfBirth,
          gender,
          password_hash: existingUser.password_hash,
        }
        if (nationalId) completeProfilePayload.national_id = nationalId

        const { data: completedUsers, error: completeError } = await supabase
          .from("users")
          .update(completeProfilePayload)
          .eq("id", existingUser.id)
          .select("id, email, phone_number, name, date_of_birth, gender, national_id")

        if (completeError) {
          if (completeError.message.includes("national_id")) {
            const { data: retryCompleted, error: retryCompleteError } = await supabase
              .from("users")
              .update({ ...completeProfilePayload, national_id: undefined })
              .eq("id", existingUser.id)
              .select("id, email, phone_number, name, date_of_birth, gender")
            if (retryCompleteError) return NextResponse.json({ error: retryCompleteError.message }, { status: 500 })
            return NextResponse.json({ user: retryCompleted?.[0] ?? null })
          }

          return NextResponse.json({ error: completeError.message }, { status: 500 })
        }

        return NextResponse.json({ user: completedUsers?.[0] ?? null })
      }

      const updatePayload: Record<string, unknown> = {
        email: existingUser.email || generatedEmail,
        phone_number: normalizedPhoneNumber,
        name,
        date_of_birth: dateOfBirth,
        gender,
        password_hash: passwordHash,
      }
      if (nationalId) updatePayload.national_id = nationalId

      const { data: updatedUsers, error: updateError } = await supabase
        .from("users")
        .update(updatePayload)
        .eq("id", existingUser.id)
        .select("id, email, phone_number, name, date_of_birth, gender, national_id")

      if (updateError) {
        if (updateError.message.includes("national_id")) {
          const { data: retryUpdated, error: retryUpdateError } = await supabase
            .from("users")
            .update({ ...updatePayload, national_id: undefined })
            .eq("id", existingUser.id)
            .select("id, email, phone_number, name, date_of_birth, gender")
          if (retryUpdateError) return NextResponse.json({ error: retryUpdateError.message }, { status: 500 })
          return NextResponse.json({ user: retryUpdated?.[0] ?? null })
        }
        if (updateError.message.includes("password_hash")) {
          return NextResponse.json(
            { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
            { status: 503 },
          )
        }

        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ user: updatedUsers?.[0] ?? null })
    }

    const insertPayload: Record<string, unknown> = {
      id: uuidv4(),
      phone_number: normalizedPhoneNumber,
      email: generatedEmail,
      name,
      date_of_birth: dateOfBirth,
      gender,
      password_hash: passwordHash,
    }
    if (nationalId) insertPayload.national_id = nationalId

    const { data: newUsers, error: insertError } = await supabase
      .from("users")
      .insert(insertPayload)
      .select("id, email, phone_number, name, date_of_birth, gender, national_id")

    if (insertError) {
      if (insertError.message.includes("national_id")) {
        const { data: retryUsers, error: retryError } = await supabase
          .from("users")
          .insert({ ...insertPayload, national_id: undefined })
          .select("id, email, phone_number, name, date_of_birth, gender")
        if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 })
        return NextResponse.json({ user: retryUsers?.[0] ?? null })
      }
      if (insertError.message.includes("password_hash")) {
        return NextResponse.json(
          { error: "Password registration is not ready yet. Run scripts/08-add-user-password-auth.sql in Supabase first." },
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