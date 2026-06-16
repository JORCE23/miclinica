import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePhone } from "@/lib/whatsapp/ultramsg"

export const dynamic = "force-dynamic"

// Pausa o reactiva el bot para un contacto (traspaso a atención humana).
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = (await request.json().catch(() => null)) as { phone?: string; paused?: boolean } | null
  const phone = normalizePhone(body?.phone || "")
  if (!phone) return NextResponse.json({ error: "Falta el teléfono." }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from("whatsapp_contacts")
    .upsert(
      { clinic_id: context.clinicId, phone, bot_paused: !!body?.paused, updated_at: new Date().toISOString() },
      { onConflict: "clinic_id,phone" }
    )
  if (error) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 })

  return NextResponse.json({ ok: true, paused: !!body?.paused })
}
