import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// Listar análisis faciales del paciente
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("facial_analyses")
    .select("id, kind, photo_url, harmony, metrics, recs, notes, created_at")
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// Crear análisis (la foto ya se subió a Storage; aquí guardamos URL + métricas)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = sanitizeInput(await request.json())
  const harmony = Number.isFinite(+body?.harmony) ? Math.round(+body.harmony) : null

  const supabase = createClient()
  const { data, error } = await supabase
    .from("facial_analyses")
    .insert({
      clinic_id: context.clinicId,
      patient_id: params.id,
      kind: body?.kind === "ricketts" ? "ricketts" : "aureo",
      photo_url: body?.photo_url || null,
      harmony,
      metrics: body?.metrics ?? null,
      recs: body?.recs ?? null,
      notes: (body?.notes || "").toString().slice(0, 4000) || null,
      created_by: context.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// Eliminar análisis (?analysisId=...)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const analysisId = new URL(request.url).searchParams.get("analysisId")
  if (!analysisId) return NextResponse.json({ error: "Falta el análisis" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("facial_analyses")
    .delete()
    .eq("id", analysisId)
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
