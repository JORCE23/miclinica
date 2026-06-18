import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, patient_id, record_id, created_at")
    .eq("clinic_id", context!.clinicId)
    .order("created_at", { ascending: false })
    .limit(150)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Mapear nombres de actor y paciente
  const ids = Array.from(new Set([
    ...(logs || []).map((l) => l.actor_id),
    ...(logs || []).map((l) => l.patient_id).filter(Boolean),
  ])) as string[]

  const names: Record<string, string> = {}
  if (ids.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids)
    for (const p of profiles || []) names[p.id] = p.full_name
  }

  const items = (logs || []).map((l) => ({
    ...l,
    actor_name: names[l.actor_id] || "—",
    patient_name: l.patient_id ? names[l.patient_id] || "—" : null,
  }))

  return NextResponse.json(items)
}
