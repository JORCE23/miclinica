import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// Listar simulaciones del paciente
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("treatment_simulations")
    .select("id, title, before_url, after_url, plan, created_at")
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// Crear simulación (las imágenes ya se subieron a Storage; aquí guardamos las URLs)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = sanitizeInput(await request.json())
  const title = (body?.title || "").toString().trim()
  if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from("treatment_simulations")
    .insert({
      clinic_id: context.clinicId,
      patient_id: params.id,
      title,
      before_url: body?.before_url || null,
      after_url: body?.after_url || null,
      plan: (body?.plan || "").toString().slice(0, 4000) || null,
      created_by: context.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// Eliminar simulación (?simId=...)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const simId = new URL(request.url).searchParams.get("simId")
  if (!simId) return NextResponse.json({ error: "Falta la simulación" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("treatment_simulations")
    .delete()
    .eq("id", simId)
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
