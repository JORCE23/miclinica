import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isGroqConfigured } from "@/lib/ai/groq"
import { runAgentReply, resolveClinic } from "@/lib/ai/agent"
import {
  isUltramsgConfigured,
  parseUltramsgWebhook,
  normalizePhone,
  sendWhatsappMessage,
} from "@/lib/whatsapp/ultramsg"
import type { ChatMessage } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"

// Webhook de UltraMsg: recibe mensajes entrantes de WhatsApp, genera la
// respuesta con la IA (con contexto del negocio) y la responde.
export async function POST(request: Request) {
  // Validación opcional del token del webhook (?token=... o header)
  const url = new URL(request.url)
  const expected = process.env.ULTRAMSG_WEBHOOK_TOKEN
  if (expected) {
    const provided = url.searchParams.get("token") || request.headers.get("x-webhook-token")
    if (provided !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // ignorar payloads no-JSON (pings)
  }

  const inbound = parseUltramsgWebhook(payload)
  // Ignorar mensajes propios, vacíos o no-texto
  if (!inbound || inbound.fromMe || !inbound.body || (inbound.type && inbound.type !== "chat")) {
    return NextResponse.json({ ok: true })
  }

  // Si falta configuración, registramos y salimos sin error (modo no-conectado)
  if (!isUltramsgConfigured() || !isGroqConfigured()) {
    return NextResponse.json({ ok: true, note: "whatsapp/groq no configurado" })
  }

  const phone = normalizePhone(inbound.from)
  const admin = createAdminClient()

  try {
    const clinic = await resolveClinic(admin)
    if (!clinic) return NextResponse.json({ ok: true, note: "sin clínica" })

    // Guardar mensaje entrante
    await admin.from("whatsapp_messages").insert({
      clinic_id: clinic.id,
      contact_phone: phone,
      contact_name: inbound.pushname || null,
      direction: "in",
      body: inbound.body,
    })

    // Reconstruir historial reciente (últimos 12 mensajes) para contexto
    const { data: prev } = await admin
      .from("whatsapp_messages")
      .select("direction, body")
      .eq("clinic_id", clinic.id)
      .eq("contact_phone", phone)
      .order("created_at", { ascending: false })
      .limit(12)

    const history: ChatMessage[] = (prev || [])
      .reverse()
      .slice(0, -1) // el último es el mensaje actual
      .map((m: { direction: string; body: string }) => ({
        role: m.direction === "in" ? "user" : "assistant",
        content: m.body,
      }))

    const reply = await runAgentReply({
      clinic: { id: clinic.id, name: clinic.name },
      phone,
      pushname: inbound.pushname,
      history,
      userText: inbound.body,
      model: process.env.GROQ_MODEL,
      temperature: 0.5,
    })

    await sendWhatsappMessage(phone, reply)

    // Guardar respuesta saliente
    await admin.from("whatsapp_messages").insert({
      clinic_id: clinic.id,
      contact_phone: phone,
      contact_name: inbound.pushname || null,
      direction: "out",
      body: reply,
      ai_model: process.env.GROQ_MODEL || "groq",
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[whatsapp/webhook]", err)
    // Respondemos 200 para que UltraMsg no reintente en bucle
    return NextResponse.json({ ok: false })
  }
}

// UltraMsg verifica el endpoint con un GET
export async function GET() {
  return NextResponse.json({ ok: true, service: "whatsapp-webhook" })
}
