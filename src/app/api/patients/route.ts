import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAuth } from "@/lib/security/auth-guard"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getIp(request)
    const { success, limit, remaining } = checkRateLimit(ip)
    
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        }
      })
    }

    // 2. Auth Guard y variables
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    // 3. Sanitización y obtención de datos
    const rawBody = await request.json()
    const body = sanitizeInput(rawBody) // Sanitizar TODOS los inputs del body
    
    const { email, password, full_name, rut, birth_date, phone, notes } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // 4. Crear el usuario en Auth usando la API de Admin
    const adminAuthClient = createAdminClient()
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "client",
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Error al crear usuario" }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 5. Insertar el perfil del paciente en la tabla profiles
    const { error: profileError } = await adminAuthClient
      .from("profiles")
      .insert({
        id: newUserId,
        clinic_id: context!.clinicId,
        role: "client",
        full_name,
        rut: rut || null,
        birth_date: birth_date || null,
        phone: phone || null,
        email,
        notes: notes || null,
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Paciente creado exitosamente", id: newUserId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
