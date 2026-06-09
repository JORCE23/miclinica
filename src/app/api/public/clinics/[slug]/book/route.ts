import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS for public booking and user creation
)

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json()
    const { service_id, scheduled_at, rut, full_name, phone, email } = body

    if (!service_id || !scheduled_at || !rut || !full_name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // 1. Get Clinic
    const { data: clinic } = await supabase
      .from("clinics")
      .select("id, slug")
      .eq("slug", params.slug)
      .single()

    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    // 2. Get Service to know duration and price
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes, price")
      .eq("id", service_id)
      .single()

    if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })

    // 3. Find if patient exists by RUT
    let patientId = null

    const { data: existingPatient } = await supabase
      .from("profiles")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("rut", rut)
      .single()

    if (existingPatient) {
      patientId = existingPatient.id
    } else {
      // Create new patient using Admin API
      const patientEmail = email || `${rut.replace(/[^0-9kK]/g, '')}@${clinic.slug}.pacientes.com`
      const password = randomBytes(8).toString('hex') + "A1!"

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: patientEmail,
        password: password,
        email_confirm: true,
        user_metadata: { role: "client" },
      })

      if (authError || !authData.user) {
        return NextResponse.json({ error: "Error creando cuenta de paciente: " + (authError?.message || "") }, { status: 500 })
      }

      patientId = authData.user.id

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: patientId,
          clinic_id: clinic.id,
          role: "client",
          full_name,
          rut,
          phone: phone || null,
          email: patientEmail,
        })

      if (profileError) {
        await supabase.auth.admin.deleteUser(patientId) // Rollback
        return NextResponse.json({ error: "Error creando perfil: " + profileError.message }, { status: 500 })
      }
    }

    // 4. Create the appointment
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .insert({
        clinic_id: clinic.id,
        patient_id: patientId,
        service_id: service_id,
        scheduled_at: scheduled_at,
        duration_minutes: service.duration_minutes,
        price: service.price,
        status: "pendiente"
      })
      .select()
      .single()

    if (aptError) {
      return NextResponse.json({ error: "Error al agendar: " + aptError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Cita agendada exitosamente", appointment })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
