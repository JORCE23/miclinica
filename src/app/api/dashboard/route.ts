import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const clinicId = profile.clinic_id
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    const endOfNextWeek = nextWeek.toISOString()

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // 1. Total pacientes activos
    const { count: activePatientsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("role", "client")
      .eq("is_active", true)

    // 2. Citas hoy
    const { count: todayAppointmentsCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", startOfToday)
      .lt("scheduled_at", endOfToday)
      .neq("status", "cancelada")

    // 3. Citas próximos 7 días
    const { count: next7DaysAppointmentsCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", endOfToday)
      .lte("scheduled_at", endOfNextWeek)
      .neq("status", "cancelada")

    // 4. Nuevos pacientes este mes
    const { count: newPatientsThisMonth } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("role", "client")
      .gte("created_at", startOfMonth)

    // 5. Puntos de fidelidad otorgados este mes
    const { data: loyaltyTx } = await supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("clinic_id", clinicId)
      .eq("type", "ganados")
      .gte("created_at", startOfMonth)

    const pointsGrantedThisMonth = loyaltyTx?.reduce((sum, tx) => sum + tx.points, 0) || 0

    // 6. Próximas 5 citas de hoy
    const { data: upcomingAppointments } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, duration_minutes,
        patient:profiles!patient_id(id, full_name, avatar_url),
        service:services!service_id(name)
      `)
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", now.toISOString())
      .lt("scheduled_at", endOfToday)
      .in("status", ["pendiente", "confirmada"])
      .order("scheduled_at", { ascending: true })
      .limit(5)

    return NextResponse.json({
      stats: {
        activePatients: activePatientsCount || 0,
        todayAppointments: todayAppointmentsCount || 0,
        next7DaysAppointments: next7DaysAppointmentsCount || 0,
        newPatientsThisMonth: newPatientsThisMonth || 0,
        pointsGrantedThisMonth
      },
      upcomingAppointments: upcomingAppointments || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
