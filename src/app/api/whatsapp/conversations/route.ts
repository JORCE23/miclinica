import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Devuelve las conversaciones de WhatsApp agrupadas por contacto, y si se pasa
// ?phone= devuelve el hilo completo de ese contacto.
export async function GET(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const admin = createAdminClient()
  const phone = new URL(request.url).searchParams.get("phone")

  if (phone) {
    const { data } = await admin
      .from("whatsapp_messages")
      .select("id, direction, body, created_at, ai_model")
      .eq("clinic_id", context.clinicId)
      .eq("contact_phone", phone)
      .order("created_at", { ascending: true })
      .limit(200)
    return NextResponse.json({ messages: data || [] })
  }

  // Últimos 300 mensajes → agrupar por contacto
  const { data } = await admin
    .from("whatsapp_messages")
    .select("contact_phone, contact_name, body, direction, created_at")
    .eq("clinic_id", context.clinicId)
    .order("created_at", { ascending: false })
    .limit(300)

  const map = new Map<string, { phone: string; name: string | null; lastMessage: string; time: string }>()
  for (const m of data || []) {
    if (!map.has(m.contact_phone)) {
      map.set(m.contact_phone, {
        phone: m.contact_phone,
        name: m.contact_name,
        lastMessage: m.body,
        time: m.created_at,
      })
    }
  }
  return NextResponse.json({ conversations: Array.from(map.values()) })
}
