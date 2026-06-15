import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data, error } = await supabase
      .from("appointments")
      .select("*, patient:profiles!patient_id(*), service:services!service_id(*)")
      .eq("id", params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { service_id, professional_id, campaign_id, scheduled_at, duration_minutes, notes, price } = body

    const { data, error } = await supabase
      .from("appointments")
      .update({
        service_id: service_id || null,
        professional_id: professional_id !== undefined ? professional_id : null,
        campaign_id: campaign_id !== undefined ? campaign_id : null,
        scheduled_at,
        duration_minutes: Number(duration_minutes),
        notes: notes || null,
        price: price ? Number(price) : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Desenlazar las transacciones de fidelidad asociadas para evitar el error de llave foránea
    await supabase
      .from("loyalty_transactions")
      .update({ appointment_id: null })
      .eq("appointment_id", params.id)

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
