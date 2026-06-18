import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isGroqConfigured, transcribeAudioFromUrl } from "@/lib/ai/groq"
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
  if (!inbound || inbound.fromMe) {
    return NextResponse.json({ ok: true })
  }

  // Si falta configuración, salimos sin error (modo no-conectado)
  if (!isUltramsgConfigured() || !isGroqConfigured()) {
    return NextResponse.json({ ok: true, note: "whatsapp/groq no configurado" })
  }

  // Determinar el texto del mensaje. Si es nota de voz/audio, transcribir con Whisper.
  const isAudio = inbound.type === "ptt" || inbound.type === "audio"
  let text = (inbound.body || "").trim()
  if (!text && isAudio && inbound.media) {
    text = (await transcribeAudioFromUrl(inbound.media)) || ""
  }
  // Ignorar si no hay texto utilizable, o si es otro tipo no soportado (imagen, sticker, etc.)
  if (!text || (inbound.type && inbound.type !== "chat" && !isAudio)) {
    return NextResponse.json({ ok: true })
  }
  // A partir de aquí trabajamos con el texto resuelto (transcrito si vino por audio)
  inbound.body = isAudio ? `🎤 ${text}` : text

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

    // Traspaso a humano: ¿este contacto tiene el bot pausado?
    const { data: contactCfg } = await admin
      .from("whatsapp_contacts")
      .select("bot_paused")
      .eq("clinic_id", clinic.id)
      .eq("phone", phone)
      .maybeSingle()
    if (contactCfg?.bot_paused) {
      // El equipo atiende manualmente: no respondemos con la IA.
      return NextResponse.json({ ok: true, paused: true })
    }

    // Si el cliente pide hablar con una persona, derivamos y pausamos el bot.
    if (/\b(humano|persona|asesor|ejecutiv|operador|agente humano|hablar con alguien)\b/i.test(inbound.body)) {
      await admin.from("whatsapp_contacts").upsert(
        { clinic_id: clinic.id, phone, bot_paused: true, updated_at: new Date().toISOString() },
        { onConflict: "clinic_id,phone" }
      )
      const handoffMsg = "¡Claro! 🙌 En seguida te contacta una persona de nuestro equipo. Gracias por tu paciencia."
      await sendWhatsappMessage(phone, handoffMsg)
      await admin.from("whatsapp_messages").insert({
        clinic_id: clinic.id,
        contact_phone: phone,
        contact_name: inbound.pushname || null,
        direction: "out",
        body: handoffMsg,
        ai_model: "handoff",
      })
      return NextResponse.json({ ok: true, handoff: true })
    }

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
