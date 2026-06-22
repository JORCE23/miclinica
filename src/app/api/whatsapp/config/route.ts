import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifyMetaConfig } from "@/lib/whatsapp/meta"
import { getClinicWhatsappConfig } from "@/lib/whatsapp/config"

export const dynamic = "force-dynamic"

function genToken() {
  return "vt_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

// Estado actual (sin exponer el token de acceso).
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const admin = createAdminClient()
  const cfg = await getClinicWhatsappConfig(admin, context.clinicId)

  return NextResponse.json({
    connected: !!cfg?.connected,
    provider: cfg?.provider || "meta",
    phone_number_id: cfg?.phone_number_id || "",
    waba_id: cfg?.waba_id || "",
    display_phone: cfg?.display_phone || "",
    verify_token: cfg?.verify_token || "",
    has_token: !!cfg?.access_token,
  })
}

// Guarda y verifica las credenciales de Meta de la clínica.
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = await request.json().catch(() => ({}))
  const phone_number_id = String(body?.phone_number_id || "").trim()
  const access_token = String(body?.access_token || "").trim()
  const waba_id = String(body?.waba_id || "").trim() || null

  if (!phone_number_id || !access_token) {
    return NextResponse.json({ error: "Faltan el Phone Number ID y el Token." }, { status: 400 })
  }

  // Verificar contra Meta antes de guardar como conectado.
  const check = await verifyMetaConfig({ phone_number_id, access_token })
  if (!check.ok) {
    return NextResponse.json({ error: `No se pudo verificar con Meta: ${check.error}` }, { status: 400 })
  }

  const admin = createAdminClient()
  const existing = await getClinicWhatsappConfig(admin, context.clinicId)
  const verify_token = existing?.verify_token || genToken()

  const { error } = await admin.from("whatsapp_config").upsert({
    clinic_id: context.clinicId,
    provider: "meta",
    phone_number_id,
    waba_id,
    access_token,
    verify_token,
    display_phone: check.display_phone || null,
    connected: true,
    updated_at: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, connected: true, display_phone: check.display_phone, verify_token })
}

// Desconectar.
export async function DELETE() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse
  const admin = createAdminClient()
  await admin.from("whatsapp_config").update({ connected: false, access_token: null }).eq("clinic_id", context.clinicId)
  return NextResponse.json({ ok: true })
}
