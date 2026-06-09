import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const { status, assignPoints } = body

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
        // Insertar transacción de fidelidad
        const { error: txError } = await supabase.from("loyalty_transactions").insert({
          clinic_id: profile.clinic_id,
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          type: "ganados",
          points: points,
          description: `Puntos ganados por servicio completado`,
        })

        if (txError) throw txError

        // Actualizar o crear la cuenta de fidelidad
        const { data: loyaltyAccount } = await supabase
          .from("loyalty_accounts")
          .select("*")
          .eq("patient_id", appointment.patient_id)
          .eq("clinic_id", profile.clinic_id)
          .single()

        if (loyaltyAccount) {
          await supabase
            .from("loyalty_accounts")
            .update({
              total_points: loyaltyAccount.total_points + points,
              lifetime_points: loyaltyAccount.lifetime_points + points,
            })
            .eq("id", loyaltyAccount.id)
        } else {
          await supabase
            .from("loyalty_accounts")
            .insert({
              clinic_id: profile.clinic_id,
              patient_id: appointment.patient_id,
              total_points: points,
              lifetime_points: points,
            })
        }
      }
    }

    // 3. Actualizar el estado de la cita
    const { data, error } = await supabase
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
