import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { isGroqConfigured } from "@/lib/ai/groq"
import { isUltramsgConfigured } from "@/lib/whatsapp/ultramsg"

export const dynamic = "force-dynamic"

// Indica si el Agente IA está conectado (sin exponer ninguna credencial).
export async function GET() {
  const { errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const whatsapp = isUltramsgConfigured()
  const ai = isGroqConfigured()
  return NextResponse.json({
    connected: whatsapp && ai,
    whatsapp,
    ai,
  })
}
