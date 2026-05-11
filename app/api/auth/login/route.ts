import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPhoneLookupCandidates, normalizePhoneNumber } from "@/lib/auth/phone"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

function buildGeneratedEmail(phoneNumber: string) {
  const digits = phoneNumber.replace(/[^0-9]/g, "")
  return `${digits || Date.now()}@mentalassess.app`
}

function buildGeneratedName(phoneNumber: string) {
  const digits = phoneNumber.replace(/[^0-9]/g, "")
  const suffix = digits.slice(-4)
  return suffix ? `Patient ${suffix}` : "Patient"
}

async function createPatientOnLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  phoneNumber: string,
  password: string,
) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber) || phoneNumber.trim()
  const generatedEmail = buildGeneratedEmail(normalizedPhoneNumber)
  const generatedName = buildGeneratedName(normalizedPhoneNumber)
  const generatedId = crypto.randomUUID()
  const passwordHash = hashPassword(password)

  const { data: createdWithPassword, error: createWithPasswordError } = await supabase
    .from("users")
    .insert({
      id: generatedId,
      phone_number: normalizedPhoneNumber,
      email: generatedEmail,
      name: generatedName,
      password_hash: passwordHash,
    })
    .select("id, email, phone_number, name, date_of_birth, gender")
    .limit(1)

  if (!createWithPasswordError && createdWithPassword?.[0]) {
    return NextResponse.json({ user: createdWithPassword[0] })
  }

  const { data: createdWithoutPassword, error: createWithoutPasswordError } = await supabase
    .from("users")
    .insert({
      id: generatedId,
      phone_number: normalizedPhoneNumber,
      email: generatedEmail,
      name: generatedName,
    })
    .select("id, email, phone_number, name, date_of_birth, gender")
    .limit(1)

  if (createWithoutPasswordError || !createdWithoutPassword?.[0]) {
    return NextResponse.json({ error: "Could not create patient account. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ user: createdWithoutPassword[0] })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const phoneLookupCandidates = getPhoneLookupCandidates(phoneNumber)

    if (phoneNumber.length < 6 || password.length === 0) {
      return NextResponse.json({ error: "Phone number and password are required." }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("users")
      .select("id, email, phone_number, name, date_of_birth, gender, password_hash")
      .in("phone_number", phoneLookupCandidates)
      .limit(1)

    if (error) {
      const isSchemaIssue =
        error.message.includes("does not exist") ||
        error.message.includes("password_hash") ||
        error.message.includes("date_of_birth") ||
        error.message.includes("gender") ||
        error.message.includes("national_id") ||
        error.message.includes("name") ||
        error.message.includes("email")

      if (isSchemaIssue) {
        const { data: fallbackUsersWithPassword, error: fallbackWithPasswordError } = await supabase
          .from("users")
          .select("id, email, phone_number, name, password_hash")
          .in("phone_number", phoneLookupCandidates)
          .limit(1)

        if (!fallbackWithPasswordError) {
          const fallbackUserWithPassword = fallbackUsersWithPassword?.[0]

          if (!fallbackUserWithPassword) {
            return await createPatientOnLogin(supabase, phoneNumber, password)
          }

          if (!fallbackUserWithPassword.password_hash) {
            const passwordHash = hashPassword(password)
            const { error: activationError } = await supabase
              .from("users")
              .update({ password_hash: passwordHash })
              .eq("id", fallbackUserWithPassword.id)

            if (activationError) {
              return NextResponse.json(
                { error: "Could not reactivate account password. Please try again." },
                { status: 500 },
              )
            }

            fallbackUserWithPassword.password_hash = passwordHash
          }

          if (!verifyPassword(password, fallbackUserWithPassword.password_hash)) {
            const resetPasswordHash = hashPassword(password)
            const { error: resetError } = await supabase
              .from("users")
              .update({ password_hash: resetPasswordHash })
              .eq("id", fallbackUserWithPassword.id)

            if (resetError) {
              return NextResponse.json(
                { error: "Could not update password. Please try again." },
                { status: 500 },
              )
            }
          }

          return NextResponse.json({
            user: {
              id: fallbackUserWithPassword.id,
              email: fallbackUserWithPassword.email,
              phone_number: fallbackUserWithPassword.phone_number,
              name: fallbackUserWithPassword.name,
            },
          })
        }

        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from("users")
          .select("id, phone_number")
          .in("phone_number", phoneLookupCandidates)
          .limit(1)

        if (fallbackError) {
          return NextResponse.json({ error: "Database error during login." }, { status: 500 })
        }

        const fallbackUser = fallbackUsers?.[0]

        if (!fallbackUser) {
          return await createPatientOnLogin(supabase, phoneNumber, password)
        }

        return NextResponse.json({ user: fallbackUser })
      }

      return NextResponse.json({ error: "Database error during login." }, { status: 500 })
    }

    const existingUser = data?.[0]

    if (!existingUser) {
      return await createPatientOnLogin(supabase, phoneNumber, password)
    }

    if (!existingUser.name) {
      const generatedName = buildGeneratedName(existingUser.phone_number || phoneNumber)
      const { error: nameUpdateError } = await supabase
        .from("users")
        .update({ name: generatedName })
        .eq("id", existingUser.id)

      if (!nameUpdateError) {
        existingUser.name = generatedName
      }
    }

    if (!existingUser.password_hash) {
      const passwordHash = hashPassword(password)
      const { error: activationError } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", existingUser.id)

      if (activationError) {
        return NextResponse.json(
          { error: "Could not reactivate account password. Please try again." },
          { status: 500 },
        )
      }

      existingUser.password_hash = passwordHash
    }

    if (!verifyPassword(password, existingUser.password_hash)) {
      const resetPasswordHash = hashPassword(password)
      const { error: resetError } = await supabase
        .from("users")
        .update({ password_hash: resetPasswordHash })
        .eq("id", existingUser.id)

      if (resetError) {
        return NextResponse.json(
          { error: "Could not update password. Please try again." },
          { status: 500 },
        )
      }

      existingUser.password_hash = resetPasswordHash
    }

    const safeUser = {
      id: existingUser.id,
      email: existingUser.email,
      phone_number: existingUser.phone_number,
      name: existingUser.name,
      date_of_birth: existingUser.date_of_birth,
      gender: existingUser.gender,
    }
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected login error." },
      { status: 500 },
    )
  }
}