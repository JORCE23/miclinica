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
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "Este Año"
    
    const now = new Date()
    const currentYear = now.getFullYear()
    
    let startOfPeriod = new Date(currentYear, 0, 1) // default: Este Año
    let endOfPeriod = new Date(currentYear + 1, 0, 1)

    if (range === "Este Mes") {
      startOfPeriod = new Date(currentYear, now.getMonth(), 1)
      endOfPeriod = new Date(currentYear, now.getMonth() + 1, 1)
    } else if (range === "Últimos 3 Meses") {
      startOfPeriod = new Date(currentYear, now.getMonth() - 2, 1)
      endOfPeriod = new Date(currentYear, now.getMonth() + 1, 1)
    } else if (range === "Últimos 6 Meses") {
      startOfPeriod = new Date(currentYear, now.getMonth() - 5, 1)
      endOfPeriod = new Date(currentYear, now.getMonth() + 1, 1)
    }

    const startIso = startOfPeriod.toISOString()
    const endIso = endOfPeriod.toISOString()

    // 1. Ingresos Mensuales (de citas completadas este año)
    const { data: completedAppointmentsThisYear } = await supabase
      .from("appointments")
      .select("price, scheduled_at")
      .eq("clinic_id", clinicId)
      .eq("status", "completada")
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const revenueByMonth = new Array(12).fill(0)
    
    let totalRevenue = 0
    let completedCount = 0

    completedAppointmentsThisYear?.forEach(apt => {
      if (apt.price) {
        const date = new Date(apt.scheduled_at)
        revenueByMonth[date.getMonth()] += Number(apt.price)
        totalRevenue += Number(apt.price)
      }
      completedCount++
    })

    // Cortar los meses hasta el mes actual para no mostrar ceros innecesarios en el futuro
    const currentMonthIndex = now.getMonth()
    const monthlyRevenue = months.slice(0, currentMonthIndex + 1).map((m, i) => ({
      name: m,
      ingresos: revenueByMonth[i]
    }))

    // 2. Servicios más populares (todas las citas no canceladas)
    const { data: servicesWithAppointments } = await supabase
      .from("appointments")
      .select(`
        service_id,
        service:services(name)
      `)
      .eq("clinic_id", clinicId)
      .neq("status", "cancelada")
      .not("service_id", "is", null)

    const serviceCountMap: Record<string, { name: string, count: number }> = {}
    
    servicesWithAppointments?.forEach((apt: any) => {
      if (apt.service_id && apt.service?.name) {
        if (!serviceCountMap[apt.service_id]) {
          serviceCountMap[apt.service_id] = { name: apt.service.name, count: 0 }
        }
        serviceCountMap[apt.service_id].count++
      }
    })

    const servicesData = Object.values(serviceCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(s => ({ name: s.name, citas: s.count }))

    // 3. Métricas Clave
    // Ingresos Hoy
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const { data: todayCompletedAppointments } = await supabase
      .from("appointments")
      .select("price")
      .eq("clinic_id", clinicId)
      .eq("status", "completada")
      .gte("scheduled_at", startOfToday)
      .lt("scheduled_at", endOfToday)

    const revenueToday = todayCompletedAppointments?.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0) || 0

    // Ticket Promedio
    const ticketPromedio = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0

    // No-Show Rate
    const { count: totalAppointmentsThisYear } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)
      .neq("status", "cancelada")

    const { count: noShowAppointments } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .eq("status", "no_asistio")
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)

    const noShowRate = totalAppointmentsThisYear && totalAppointmentsThisYear > 0 
      ? Math.round(((noShowAppointments || 0) / totalAppointmentsThisYear) * 100) 
      : 0

    // Retención de Pacientes (>1 cita completada)
    const { data: patientApptCounts } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("clinic_id", clinicId)
      .eq("status", "completada")

    const patientApptMap: Record<string, number> = {}
    patientApptCounts?.forEach(apt => {
      patientApptMap[apt.patient_id] = (patientApptMap[apt.patient_id] || 0) + 1
    })

    const totalPatientsWithAppts = Object.keys(patientApptMap).length
    const patientsWithMultipleAppts = Object.values(patientApptMap).filter(count => count > 1).length
    
    const retencionPacientes = totalPatientsWithAppts > 0 
      ? Math.round((patientsWithMultipleAppts / totalPatientsWithAppts) * 100) 
      : 0

    // CAC (Mocjeado por ahora)
    const cac = 15000 // mock

    return NextResponse.json({
      monthlyRevenue,
      servicesData,
      keyMetrics: {
        ticketPromedio,
        retencionPacientes,
        noShowRate,
        cac,
        revenueToday
      }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
