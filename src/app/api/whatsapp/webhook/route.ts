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
import { parseMetaWebhook, sendMetaText, getMetaMediaUrl } from "@/lib/whatsapp/meta"
import { getConfigByPhoneNumberId, metaCredsFrom } from "@/lib/whatsapp/config"
import type { ChatMessage } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"

type Clinic = { id: string; name: string }
type SendFn = (to: string, body: string) => Promise<boolean>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConversation(admin: any, clinic: Clinic, phone: string, contactName: string | null, text: string, send: SendFn) {
  // Guardar entrante
  await admin.from("whatsapp_messages").insert({
    clinic_id: clinic.id, contact_phone: phone, contact_name: contactName, direction: "in", body: text,
  })

  // ¿bot pausado para este contacto?
  const { data: contactCfg } = await admin
    .from("whatsapp_contacts").select("bot_paused").eq("clinic_id", clinic.id).eq("phone", phone).maybeSingle()
  if (contactCfg?.bot_paused) return

  // Pedido de hablar con humano -> derivar y pausar bot
  if (/\b(humano|persona|asesor|ejecutiv|operador|agente humano|hablar con alguien)\b/i.test(text)) {
    await admin.from("whatsapp_contacts").upsert(
      { clinic_id: clinic.id, phone, bot_paused: true, updated_at: new Date().toISOString() },
      { onConflict: "clinic_id,phone" }
    )
    const handoffMsg = "¡Claro! 🙌 En seguida te contacta una persona de nuestro equipo. Gracias por tu paciencia."
    await send(phone, handoffMsg)
    await admin.from("whatsapp_messages").insert({
      clinic_id: clinic.id, contact_phone: phone, contact_name: contactName, direction: "out", body: handoffMsg, ai_model: "handoff",
    })
    return
  }

  // Historial reciente para contexto
  const { data: prev } = await admin
    .from("whatsapp_messages").select("direction, body")
    .eq("clinic_id", clinic.id).eq("contact_phone", phone)
    .order("created_at", { ascending: false }).limit(12)

  const history: ChatMessage[] = (prev || []).reverse().slice(0, -1)
    .map((m: { direction: string; body: string }) => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }))

  const reply = await runAgentReply({
    clinic: { id: clinic.id, name: clinic.name },
    phone, pushname: contactName || undefined, history, userText: text,
    model: process.env.GROQ_MODEL, temperature: 0.5,
  })

  await send(phone, reply)
  await admin.from("whatsapp_messages").insert({
    clinic_id: clinic.id, contact_phone: phone, contact_name: contactName, direction: "out", body: reply, ai_model: process.env.GROQ_MODEL || "groq",
  })
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const admin = createAdminClient()

  // ---------- 1) Camino META (WhatsApp Cloud API, por clínica) ----------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((payload as any)?.entry || (payload as any)?.object === "whatsapp_business_account") {
    const inbound = parseMetaWebhook(payload)
    if (!inbound || !inbound.from || !inbound.phoneNumberId) return NextResponse.json({ ok: true })

    const cfg = await getConfigByPhoneNumberId(admin, inbound.phoneNumberId)
    const creds = metaCredsFrom(cfg)
    if (!cfg || !creds || !isGroqConfigured()) return NextResponse.json({ ok: true, note: "no conectado" })

    // Resolver texto (transcribir audio si aplica)
    let text = (inbound.body || "").trim()
    if (!text && inbound.mediaId && (inbound.type === "audio" || inbound.type === "voice")) {
      const url = await getMetaMediaUrl(creds, inbound.mediaId)
      if (url) text = (await transcribeAudioFromUrl(url)) || ""
      if (text) text = `🎤 ${text}`
    }
    if (!text) return NextResponse.json({ ok: true })

    const { data: clinicRow } = await admin.from("clinics").select("id, name").eq("id", cfg.clinic_id).maybeSingle()
    const clinic: Clinic = { id: cfg.clinic_id, name: clinicRow?.name || "la clínica" }
    const send: SendFn = async (to, body) => (await sendMetaText(creds, to, body)).ok

    try {
      await handleConversation(admin, clinic, inbound.from, inbound.name || null, text, send)
    } catch (err) {
      console.error("[whatsapp/webhook meta]", err)
    }
    return NextResponse.json({ ok: true })
  }

  // ---------- 2) Camino ULTRAMSG (respaldo global) ----------
  const url = new URL(request.url)
  const expected = process.env.ULTRAMSG_WEBHOOK_TOKEN
  if (expected) {
    const provided = url.searchParams.get("token") || request.headers.get("x-webhook-token")
    if (provided !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const inbound = parseUltramsgWebhook(payload)
  if (!inbound || inbound.fromMe) return NextResponse.json({ ok: true })
  if (!isUltramsgConfigured() || !isGroqConfigured()) return NextResponse.json({ ok: true, note: "whatsapp/groq no configurado" })

  const isAudio = inbound.type === "ptt" || inbound.type === "audio"
  let text = (inbound.body || "").trim()
  if (!text && isAudio && inbound.media) text = (await transcribeAudioFromUrl(inbound.media)) || ""
  if (!text || (inbound.type && inbound.type !== "chat" && !isAudio)) return NextResponse.json({ ok: true })
  const resolved = isAudio ? `🎤 ${text}` : text
  const phone = normalizePhone(inbound.from)

  try {
    const clinic = await resolveClinic(admin)
    if (!clinic) return NextResponse.json({ ok: true, note: "sin clínica" })
    const send: SendFn = async (to, body) => await sendWhatsappMessage(to, body)
    await handleConversation(admin, { id: clinic.id, name: clinic.name }, phone, inbound.pushname || null, resolved, send)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[whatsapp/webhook ultramsg]", err)
    return NextResponse.json({ ok: false })
  }
}

// Verificación del webhook:
//  - Meta: GET con hub.mode/hub.verify_token/hub.challenge -> devolver el challenge si el token existe.
//  - UltraMsg: GET simple.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const mode = url.searchParams.get("hub.mode")
  const token = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")
  if (mode === "subscribe" && token) {
    const admin = createAdminClient()
    const { data } = await admin.from("whatsapp_config").select("clinic_id").eq("verify_token", token).maybeSingle()
    if (data) return new Response(challenge || "", { status: 200, headers: { "Content-Type": "text/plain" } })
    return new Response("forbidden", { status: 403 })
  }
  return NextResponse.json({ ok: true, service: "whatsapp-webhook" })
}
