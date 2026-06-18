import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET: datos del consentimiento para mostrar en la página pública de firma
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const { data: consent } = await admin
    .from("consents")
    .select("id, title, body, signed_at, signed_by_patient, clinic_id, patient_id")
    .eq("sign_token", params.token)
    .maybeSingle()

  if (!consent) return NextResponse.json({ error: "Consentimiento no encontrado" }, { status: 404 })

  const [{ data: clinic }, { data: patient }] = await Promise.all([
    admin.from("clinics").select("name, logo_url").eq("id", consent.clinic_id).single(),
    admin.from("profiles").select("full_name").eq("id", consent.patient_id).single(),
  ])

  return NextResponse.json({
    title: consent.title,
    body: consent.body,
    clinic_name: clinic?.name || "Clínica",
    clinic_logo: clinic?.logo_url || null,
    patient_name: patient?.full_name || null,
    already_signed: !!consent.signed_at,
    signed_at: consent.signed_at,
  })
}

// POST: el paciente firma desde su dispositivo
export async function POST(request: Request, { params }: { params: { token: string } }) {
  const body = await request.json().catch(() => null)
  const signature = body?.signature
  if (typeof signature !== "string" || !signature.startsWith("data:image")) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
  }

  const { data: consent } = await admin
    .from("consents")
    .select("id, signed_at")
    .eq("sign_token", params.token)
    .maybeSingle()

  if (!consent) return NextResponse.json({ error: "Consentimiento no encontrado" }, { status: 404 })
  if (consent.signed_at) return NextResponse.json({ error: "Este consentimiento ya fue firmado." }, { status: 400 })

  const { error } = await admin
    .from("consents")
    .update({ signature, signed_at: new Date().toISOString(), signed_by_patient: true })
    .eq("id", consent.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
