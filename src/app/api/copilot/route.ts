import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isGroqConfigured, type ChatMessage } from "@/lib/ai/groq"
import { requireAuth } from "@/lib/security/auth-guard"
import { runCopilotReply } from "@/lib/ai/copilot-agent"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse || !context) return errorResponse

    if (!isGroqConfigured()) {
      return NextResponse.json({
        reply:
          "El asistente todavía no está conectado. Falta configurar la clave **GROQ_API_KEY** en el servidor (es gratis en groq.com). En cuanto la agregues, podré agendar citas, buscar pacientes y más desde aquí. 🙂",
      })
    }

    const supabase = createClient()
    const { data: clinic } = await supabase.from("clinics").select("name").eq("id", context.clinicId).single()

    const body = await req.json().catch(() => ({}))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incoming: any[] = Array.isArray(body?.messages) ? body.messages : []
    const normalized: ChatMessage[] = incoming.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }))

    // El último mensaje del usuario es el texto nuevo; el resto es historial.
    let userText = ""
    const history: ChatMessage[] = []
    for (let i = normalized.length - 1; i >= 0; i--) {
      if (!userText && normalized[i].role === "user") {
        userText = normalized[i].content || ""
        history.unshift(...normalized.slice(0, i))
        break
      }
    }
    if (!userText) return NextResponse.json({ reply: "¿En qué te ayudo?" })

    const reply = await runCopilotReply({
      clinicId: context.clinicId,
      clinicName: clinic?.name || "la clínica",
      history,
      userText,
    })
    return NextResponse.json({ reply })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("copilot error:", msg)
    if (/429|rate|quota|saturad/i.test(msg)) {
      return NextResponse.json({
        reply: "El asistente está recibiendo muchas solicitudes en este momento (límite del plan gratuito de Groq). Espera unos segundos e inténtalo de nuevo. 🙏",
      })
    }
    return NextResponse.json({ reply: "Ups, tuve un problema para responder. Intenta nuevamente en un momento." })
  }
}
