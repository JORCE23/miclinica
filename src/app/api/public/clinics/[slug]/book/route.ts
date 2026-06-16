import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"
import { z } from "zod"
import { parseISO, addMinutes, isBefore, isAfter } from "date-fns"
import { validateRut } from "@/lib/validations/rut"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const bookingSchema = z.object({
  service_id: z.string().uuid("ID de servicio inválido"),
  scheduled_at: z.string()
    .refine((val) => !isNaN(Date.parse(val)), "Fecha y hora inválidas")
    .refine((val) => new Date(val) > new Date(), "No puedes reservar en una fecha pasada"),
  rut: z.string().refine((val) => validateRut(val), "RUT inválido"),
  full_name: z.string().trim().min(2, "El nombre completo es requerido"),
  email: z.union([
    z.string().email("El email no tiene un formato válido"),
    z.literal(""),
    z.undefined(),
  ]).optional(),
  phone: z.string().trim().optional(),
})

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  // Rate limiting: 5 reservas por IP cada 5 minutos
  const ip = getIp(request)
  const { success } = checkRateLimit(ip, { limit: 5, windowMs: 5 * 60 * 1000 })
  if (!success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Por favor espera unos minutos antes de intentar de nuevo." },
      { status: 429 }
    )
  }

  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 })
    }

    const parsed = bookingSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { service_id, scheduled_at, rut, full_name, email, phone } = parsed.data

    // 1. Obtener clínica activa
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, slug, name")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single()
    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    // 2. Verificar que el servicio pertenece a esta clínica y está activo
    const { data: service } = await supabase
      .from("services")
      .select("id, duration_minutes, price")
      .eq("id", service_id)
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .single()
    if (!service) return NextResponse.json({ error: "Servicio no disponible" }, { status: 400 })

    // 3. Chequeo de solapamiento: verificar que el slot sigue libre
    const slotStart = parseISO(scheduled_at)
    const slotEnd = addMinutes(slotStart, service.duration_minutes)

    // Traer citas activas que podrían solapar (ventana de 4 horas hacia atrás)
    const { data: nearbyAppts } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("clinic_id", clinic.id)
      .not("status", "in", '("cancelada","no_asistio")')
      .lt("scheduled_at", slotEnd.toISOString())
      .gte("scheduled_at", addMinutes(slotStart, -240).toISOString())

    const isSlotTaken = nearbyAppts?.some((apt) => {
      const aptStart = new Date(apt.scheduled_at)
      const aptEnd = addMinutes(aptStart, apt.duration_minutes)
      return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart)
    })

    if (isSlotTaken) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible. Por favor elige otro." },
        { status: 409 }
      )
    }

    // 4. Buscar paciente existente por RUT en esta clínica
    let patientId: string | null = null
    const { data: existingPatient } = await supabase
      .from("profiles")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("rut", rut)
      .single()

    if (existingPatient) {
      patientId = existingPatient.id
    } else {
      // Nuevo paciente: se requiere email para crear la cuenta
      if (!email) {
        return NextResponse.json(
          { error: "Para nuevos pacientes, el email es obligatorio para enviarte la confirmación de tu cita." },
          { status: 400 }
        )
      }

      const password = randomBytes(8).toString("hex") + "A1!"
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "client" },
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: "Error al crear la cuenta: " + (authError?.message || "Inténtalo de nuevo") },
          { status: 500 }
        )
      }

      patientId = authData.user.id
      const { error: profileError } = await supabase.from("profiles").insert({
        id: patientId,
        clinic_id: clinic.id,
        role: "client",
        full_name,
        rut,
        phone: phone || null,
        email,
      })

      if (profileError) {
        await supabase.auth.admin.deleteUser(patientId)
        return NextResponse.json({ error: "Error creando perfil: " + profileError.message }, { status: 500 })
      }
    }

    // 5. Crear la cita
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        clinic_id: clinic.id,
        patient_id: patientId,
        service_id,
        scheduled_at,
        duration_minutes: service.duration_minutes,
        price: service.price,
        status: "pendiente",
      })
      .select()
      .single()

    if (aptError) {
      return NextResponse.json({ error: "Error al agendar: " + aptError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Cita agendada exitosamente", appointment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
