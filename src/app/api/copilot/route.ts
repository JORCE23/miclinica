import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { groqChat, isGroqConfigured, type ChatMessage } from "@/lib/ai/groq"

const SYSTEM = `Eres "Copilot", el asistente de IA de Medique, un software de gestión para clínicas estéticas.
Ayudas al equipo de la clínica (administradores y profesionales) a usar la plataforma y a resolver dudas del día a día.

La app tiene estas secciones:
- Resumen/Dashboard: indicadores de la clínica.
- Mi Panel: widgets personalizables.
- Pacientes: fichas, antecedentes, alergias, procedimientos, consentimientos (con firma), fidelidad.
- Agenda/Reservas: calendario con un botón "+" en cada horario libre para agendar directo.
- Sala de espera, Caja, Servicios, Inventario, Equipo, Fidelidad, Marketing, Automatizaciones.
- Agente IA: bandeja de WhatsApp.
- Reportes y Configuración (ahí está el link de reserva online + código QR).

Pautas:
- Responde SIEMPRE en español, de forma breve, clara y amable. Usa viñetas cuando ayuden.
- Si preguntan cómo hacer algo, da los pasos concretos dentro de la app.
- Puedes ayudar a redactar mensajes para pacientes (recordatorios, postventa, cumpleaños, etc.).
- Si no sabes algo o requiere datos que no tienes, dilo con honestidad y sugiere dónde mirar.
- No inventes datos clínicos ni precios; pídelos si hacen falta.`

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    if (!isGroqConfigured()) {
      return NextResponse.json({
        reply:
          "El asistente todavía no está conectado. Falta configurar la clave **GROQ_API_KEY** en el servidor (es gratis en groq.com). En cuanto la agregues, podré responderte aquí mismo. 🙂",
      })
    }

    const body = await req.json().catch(() => ({}))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incoming: any[] = Array.isArray(body?.messages) ? body.messages : []
    // Conservamos los últimos ~12 mensajes para limitar tokens
    const trimmed: ChatMessage[] = incoming.slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 4000),
    }))

    const messages: ChatMessage[] = [{ role: "system", content: SYSTEM }, ...trimmed]
    const out = await groqChat({ messages, temperature: 0.4 })
    return NextResponse.json({ reply: out.content || "No pude generar una respuesta. Intenta de nuevo." })
  } catch {
    return NextResponse.json({
      reply: "Ups, tuve un problema para responder. Intenta nuevamente en un momento.",
    })
  }
}
