import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { isGroqConfigured } from "@/lib/ai/groq"
import { createAdminClient } from "@/lib/supabase/admin"
import { getClinicWhatsappConfig, metaCredsFrom } from "@/lib/whatsapp/config"

export const dynamic = "force-dynamic"

// Indica si el Agente IA está conectado (sin exponer ninguna credencial).
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const admin = createAdminClient()
  const cfg = await getClinicWhatsappConfig(admin, context.clinicId)
  const metaConnected = !!metaCredsFrom(cfg)

  // Multi-cliente: el estado refleja SOLO la conexión propia de la clínica (Meta).
  // Ultramsg global queda como respaldo de envío, no como señal de "conectado".
  const whatsapp = metaConnected
  const ai = isGroqConfigured()
  return NextResponse.json({
    connected: whatsapp && ai,
    whatsapp,
    ai,
    provider: metaConnected ? "meta" : null,
  })
}
