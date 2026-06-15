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

    // 5. Ingresos Hoy
    const { data: todayCompletedAppointments } = await supabase
      .from("appointments")
      .select("price")
      .eq("clinic_id", clinicId)
      .eq("status", "completada")
      .gte("scheduled_at", startOfToday)
      .lt("scheduled_at", endOfToday)

    const revenueToday = todayCompletedAppointments?.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0) || 0

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
      .in("status", ["pendiente", "confirmada"])
      .order("scheduled_at", { ascending: true })
      .limit(5)

    // Calcular ingresos estimados y reales de la semana actual (Lunes a Domingo)
    const currentDay = now.getDay()
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay // 0 es Domingo
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() + diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    
    const { data: weekAppointments } = await supabase
      .from("appointments")
      .select("price, scheduled_at, status")
      .eq("clinic_id", clinicId)
      .in("status", ["pendiente", "confirmada", "completada"])
      .gte("scheduled_at", startOfWeek.toISOString())
      .lt("scheduled_at", endOfWeek.toISOString())

    const revenueMap: Record<string, number> = {
      'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0, 'Dom': 0
    }
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    weekAppointments?.forEach(apt => {
      if (apt.price) {
        const date = new Date(apt.scheduled_at)
        const dayName = days[date.getDay()]
        revenueMap[dayName] += Number(apt.price)
      }
    })

    const revenueData = [
      { name: 'Lun', ingresos: revenueMap['Lun'] },
      { name: 'Mar', ingresos: revenueMap['Mar'] },
      { name: 'Mié', ingresos: revenueMap['Mié'] },
      { name: 'Jue', ingresos: revenueMap['Jue'] },
      { name: 'Vie', ingresos: revenueMap['Vie'] },
      { name: 'Sáb', ingresos: revenueMap['Sáb'] },
      { name: 'Dom', ingresos: revenueMap['Dom'] },
    ]

    return NextResponse.json({
      stats: {
        activePatients: activePatientsCount || 0,
        todayAppointments: todayAppointmentsCount || 0,
        next7DaysAppointments: next7DaysAppointmentsCount || 0,
        newPatientsThisMonth: newPatientsThisMonth || 0,
        revenueToday
      },
      upcomingAppointments: upcomingAppointments || [],
      revenueData
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
