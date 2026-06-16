import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Métricas del Agente IA: mensajes, contactos, citas agendadas por la IA y
// tasa de respuesta (últimos 30 días).
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const admin = createAdminClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const inboundQ = admin
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", context.clinicId)
    .eq("direction", "in")
    .gte("created_at", since)

  const outboundQ = admin
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", context.clinicId)
    .eq("direction", "out")
    .gte("created_at", since)

  const bookingsQ = admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", context.clinicId)
    .ilike("notes", "%Agente IA%")

  const contactsQ = admin
    .from("whatsapp_messages")
    .select("contact_phone")
    .eq("clinic_id", context.clinicId)
    .gte("created_at", since)
    .limit(2000)

  const [inbound, outbound, bookings, contacts] = await Promise.all([inboundQ, outboundQ, bookingsQ, contactsQ])

  const inboundCount = inbound.count || 0
  const outboundCount = outbound.count || 0
  const distinctContacts = new Set((contacts.data || []).map((c: { contact_phone: string }) => c.contact_phone)).size
  const responseRate = inboundCount > 0 ? Math.min(100, Math.round((outboundCount / inboundCount) * 100)) : 0

  return NextResponse.json({
    contacts: distinctContacts,
    messages: inboundCount + outboundCount,
    bookingsByAI: bookings.count || 0,
    responseRate,
  })
}
