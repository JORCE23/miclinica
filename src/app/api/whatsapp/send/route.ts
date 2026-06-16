import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendWhatsappMessage, isUltramsgConfigured, normalizePhone } from "@/lib/whatsapp/ultramsg"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// Envío manual de un mensaje desde la bandeja (respuesta del operador).
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  if (!isUltramsgConfigured()) {
    return NextResponse.json({ error: "WhatsApp no está conectado todavía." }, { status: 400 })
  }

  const raw = await request.json().catch(() => null)
  const body = sanitizeInput(raw) as { phone?: string; message?: string } | null
  const phone = normalizePhone(body?.phone || "")
  const message = (body?.message || "").trim()
  if (!phone || !message) {
    return NextResponse.json({ error: "Falta teléfono o mensaje." }, { status: 400 })
  }

  const ok = await sendWhatsappMessage(phone, message)
  if (!ok) return NextResponse.json({ error: "No se pudo enviar." }, { status: 502 })

  const admin = createAdminClient()
  await admin.from("whatsapp_messages").insert({
    clinic_id: context.clinicId,
    contact_phone: phone,
    direction: "out",
    body: message,
  })

  return NextResponse.json({ ok: true })
}
