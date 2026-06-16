import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

const ALLOWED = ["esperando", "en_atencion", "finalizado", "por_llegar"]

// Actualiza el estado de llegada de una cita (sala de espera).
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const body = await request.json().catch(() => null)
  const arrival = body?.arrival_status
  if (!ALLOWED.includes(arrival)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const supabase = createClient()
  const { error } = await supabase
    .from("appointments")
    .update({ arrival_status: arrival === "por_llegar" ? null : arrival, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("clinic_id", context!.clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
