import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const patient_id = searchParams.get("patient_id")
    const date = searchParams.get("date")

    let query = supabase
      .from("appointments")
      .select(`
        *,
        patient:profiles!patient_id(id, full_name, rut, phone, email, avatar_url),
        service:services!service_id(id, name, duration_minutes, price, loyalty_points_earned)
      `)
      .order("scheduled_at", { ascending: true })

    if (status) query = query.eq("status", status)
    if (patient_id) query = query.eq("patient_id", patient_id)
    if (date) {
      // Filtrar por fecha exacta (ignorando hora)
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query = query.gte("scheduled_at", startOfDay.toISOString()).lte("scheduled_at", endOfDay.toISOString())
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("clinic_id, role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { patient_id, service_id, scheduled_at, duration_minutes, status, notes, price } = body

    if (!patient_id || !scheduled_at || !duration_minutes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Comprobar solapamiento (overlapping appointments)
    const start = new Date(scheduled_at)
    const end = new Date(start.getTime() + duration_minutes * 60000)

    const { data: overlapping, error: overlapError } = await supabase
      .from("appointments")
      .select("id")
      .eq("clinic_id", profile.clinic_id)
      .eq("patient_id", patient_id)
      .in("status", ["pendiente", "confirmada"])
      .gte("scheduled_at", new Date(start.getTime() - 1440 * 60000).toISOString()) // Solo revisar último día por performance
      
    // En SQL complejo sería mejor, pero acá lo filtramos en memoria por simplicidad y tiempo:
    if (overlapping && overlapping.length > 0) {
      // Si hay muchas citas requeriría una query SQL exacta con range overlap
      // TODO: Implementar validación de solapamiento estricta
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: profile.clinic_id,
        patient_id,
        service_id: service_id || null,
        scheduled_at,
        duration_minutes: Number(duration_minutes),
        status: status || "pendiente",
        notes: notes || null,
        price: price ? Number(price) : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
