import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

// Listar consentimientos del paciente
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("consents")
    .select("id, title, body, signature, signed_at, created_at, sign_token, signed_by_patient, professional_id, patient_email, patient_phone, professional:professionals(full_name)")
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// Crear consentimiento (con firma opcional)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  // No sanitizamos con stripHtml para no romper el dataURL de la firma; validamos manualmente.
  const body = await request.json().catch(() => null)
  const title = (body?.title || "").toString().trim()
  if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })

  const signature = typeof body?.signature === "string" && body.signature.startsWith("data:image") ? body.signature : null

  const supabase = createClient()
  const { data, error } = await supabase
    .from("consents")
    .insert({
      clinic_id: context.clinicId,
      patient_id: params.id,
      title,
      body: (body?.body || "").toString().slice(0, 8000) || null,
      signature,
      signed_at: signature ? new Date().toISOString() : null,
      signed_by_patient: false,
      professional_id: body?.professional_id || null,
      patient_email: (body?.patient_email || "").toString().trim() || null,
      patient_phone: (body?.patient_phone || "").toString().trim() || null,
      sign_token: randomUUID(), // siempre, para poder enviar a firmar remotamente
      created_by: context.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

// Eliminar consentimiento (?consentId=...)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const consentId = new URL(request.url).searchParams.get("consentId")
  if (!consentId) return NextResponse.json({ error: "Falta el consentimiento" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("consents")
    .delete()
    .eq("id", consentId)
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
