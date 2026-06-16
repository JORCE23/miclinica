import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

export async function GET(request: Request) {
  try {
    const ip = getIp(request)
    const { success, limit, remaining } = await checkRateLimit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        { status: 429, headers: { "X-RateLimit-Limit": limit.toString(), "X-RateLimit-Remaining": remaining.toString() } }
      )
    }

    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const supabase = createClient()
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get("include_inactive") === "true"

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("clinic_id", context!.clinicId)
      .eq("role", "client")
      .order("created_at", { ascending: false })

    if (!includeInactive) {
      query = query.eq("is_active", true)
    }

    const { data: patients, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(patients)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
// Debe coincidir con el CHECK de profiles.source
const ALLOWED_SOURCES = new Set([
  "meta_ads",
  "google",
  "referido",
  "organico",
  "directo",
  "whatsapp",
  "otro",
])

function generateProvisionalPassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length]
  return out
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getIp(request)
    const { success, limit, remaining } = await checkRateLimit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Demasiadas peticiones" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        }
      )
    }

    // 2. Auth Guard
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    // 3. Sanitización (password queda intacta — ver sanitize.ts)
    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)

    const { email, password, full_name, rut, birth_date, phone, notes, source } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Normalizar source contra el CHECK de la BD (defensa en profundidad)
    const normalizedSource = source && ALLOWED_SOURCES.has(source) ? source : null

    // Contraseña: usar la provista (>=6) o generar una provisional segura
    const finalPassword = password && password.length >= 6 ? password : generateProvisionalPassword()

    const adminAuthClient = createAdminClient()

    // 3.5. Verificar duplicados de RUT/correo dentro de la misma clínica
    // Scope intencional a clinic_id: RUT y email son únicos por clínica, no globales.
    // Buscar cross-clinic sin este filtro filtraría existencia de pacientes en otras clínicas.
    const orQuery = rut ? `email.eq.${email},rut.eq.${rut}` : `email.eq.${email}`
    const { data: existingProfiles } = await adminAuthClient
      .from("profiles")
      .select("email, rut")
      .eq("clinic_id", context!.clinicId)
      .or(orQuery)

    if (existingProfiles && existingProfiles.length > 0) {
      const existsRut = rut && existingProfiles.some((p) => p.rut === rut)
      const existsEmail = existingProfiles.some((p) => p.email === email)

      if (existsRut && existsEmail) {
        return NextResponse.json({ error: "El RUT y el correo ya están registrados" }, { status: 400 })
      } else if (existsRut) {
        return NextResponse.json({ error: "El RUT ya está registrado" }, { status: 400 })
      } else if (existsEmail) {
        return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 })
      }
    }

    // 4. Crear usuario en Auth
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { role: "client" },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Error al crear usuario" }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 5. Insertar perfil del paciente
    const { error: profileError } = await adminAuthClient.from("profiles").insert({
      id: newUserId,
      clinic_id: context!.clinicId,
      role: "client",
      full_name,
      rut: rut || null,
      birth_date: birth_date || null,
      phone: phone || null,
      email,
      notes: notes || null,
      source: normalizedSource,
    })

    if (profileError) {
      // ROLLBACK: eliminar el usuario de Auth para no dejarlo huérfano
      await adminAuthClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Paciente creado exitosamente", id: newUserId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
