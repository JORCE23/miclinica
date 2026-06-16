import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"

// Citas de hoy con su estado de llegada (para la sala de espera).
export async function GET() {
  const { context, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const from = startOfDay(new Date()).toISOString()
  const to = endOfDay(new Date()).toISOString()

  const { data, error } = await supabase
    .from("appointments")
    .select("id, scheduled_at, status, arrival_status, patient:profiles!appointments_patient_id_fkey(full_name), service:services(name)")
    .eq("clinic_id", context!.clinicId)
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .not("status", "in", '("cancelada","no_asistio")')
    .order("scheduled_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
