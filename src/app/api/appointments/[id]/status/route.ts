import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/security/audit"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { status, assignPoints, paymentMethod } = body

    if (!status) {
      return NextResponse.json({ error: "Falta el estado" }, { status: 400 })
    }

    // 1. Obtener cita actual
    const { data: appointment, error: getError } = await supabase
      .from("appointments")
      .select("*, service:services(id, loyalty_points_earned)")
      .eq("id", params.id)
      .single()

    if (getError || !appointment) {
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
    }

    // 2. Si se marca como completada y se asignan puntos
    if (status === "completada" && appointment.status !== "completada" && assignPoints) {
      const points = appointment.service?.loyalty_points_earned || 0

      if (points > 0) {
        const { error: rpcError } = await supabase.rpc("award_loyalty_points", {
          p_clinic_id:      profile.clinic_id,
          p_patient_id:     appointment.patient_id,
          p_appointment_id: appointment.id,
          p_points:         points,
        })

        if (rpcError) throw rpcError
      }
    }

    const updateData: any = { status, updated_at: new Date().toISOString() }
    if (status === "completada" && paymentMethod) {
      updateData.payment_method = paymentMethod
    }

    // 3. Actualizar el estado de la cita
    const { data, error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (status === "completada" && appointment.status !== "completada") {
      await logAudit(supabase, {
        clinicId:  profile.clinic_id,
        actorId:   user.id,
        action:    "COMPLETE_APPOINTMENT",
        patientId: appointment.patient_id,
        recordId:  params.id,
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
