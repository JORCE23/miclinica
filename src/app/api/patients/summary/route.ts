import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

// Resumen por paciente para las etiquetas de estado en la lista:
//  - upcoming: tiene una cita futura (pendiente/confirmada)
//  - done: cantidad de procedimientos completados
//  - pendingConsent: tiene un consentimiento sin firmar
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const nowIso = new Date().toISOString()

  const [{ data: appts }, { data: consents }] = await Promise.all([
    supabase.from("appointments").select("patient_id, status, scheduled_at").eq("clinic_id", context.clinicId),
    supabase.from("consents").select("patient_id, signed_at").eq("clinic_id", context.clinicId).is("signed_at", null),
  ])

  const map: Record<string, { upcoming: boolean; done: number; pendingConsent: boolean }> = {}
  const get = (id: string) => (map[id] ||= { upcoming: false, done: 0, pendingConsent: false })

  for (const a of appts || []) {
    if (!a.patient_id) continue
    const e = get(a.patient_id)
    if (a.status === "completada") e.done++
    if ((a.status === "pendiente" || a.status === "confirmada") && a.scheduled_at >= nowIso) e.upcoming = true
  }
  for (const c of consents || []) {
    if (!c.patient_id) continue
    get(c.patient_id).pendingConsent = true
  }

  return NextResponse.json(map)
}
