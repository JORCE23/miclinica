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
    const { patient_id, service_id, professional_id, campaign_id, scheduled_at, duration_minutes, status, notes, price } = body

    if (!patient_id || !scheduled_at || !duration_minutes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Comprobar solapamiento (overlapping appointments)
    const start = new Date(scheduled_at)
    const end = new Date(start.getTime() + duration_minutes * 60000)

    let overlapQuery = supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, patient_id, professional_id")
      .eq("clinic_id", profile.clinic_id)
      .in("status", ["pendiente", "confirmada"])
      .gte("scheduled_at", new Date(start.getTime() - 1440 * 60000).toISOString())
      .lte("scheduled_at", new Date(end.getTime() + 1440 * 60000).toISOString())

    if (professional_id) {
      overlapQuery = overlapQuery.or(`patient_id.eq.${patient_id},professional_id.eq.${professional_id}`)
    } else {
      overlapQuery = overlapQuery.eq("patient_id", patient_id)
    }

    const { data: potentialOverlaps } = await overlapQuery

    if (potentialOverlaps && potentialOverlaps.length > 0) {
      const hasOverlap = potentialOverlaps.some((apt: any) => {
        const aptStart = new Date(apt.scheduled_at).getTime()
        const aptEnd = aptStart + apt.duration_minutes * 60000
        return start.getTime() < aptEnd && end.getTime() > aptStart
      })

      if (hasOverlap) {
        return NextResponse.json({ error: "El horario se solapa con otra cita del paciente o del profesional" }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: profile.clinic_id,
        patient_id,
        service_id: service_id || null,
        professional_id: professional_id || null,
        campaign_id: campaign_id || null,
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
