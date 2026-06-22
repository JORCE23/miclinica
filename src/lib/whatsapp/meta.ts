// Cliente oficial de WhatsApp Cloud API (Meta / Graph API), por clínica.
// Cada clínica conecta su propio número con su Phone Number ID + Access Token.

const GRAPH = "https://graph.facebook.com/v21.0"

export type MetaConfig = {
  phone_number_id: string
  access_token: string
}

/** Normaliza un número a solo dígitos con código país (ej. 56912345678). */
export function normalizePhone(raw: string): string {
  return (raw || "").replace(/@c\.us$/i, "").replace(/[^\d]/g, "")
}

/** Envía un mensaje de texto libre (válido dentro de la ventana de 24h). */
export async function sendMetaText(cfg: MetaConfig, to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${GRAPH}/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizePhone(to),
        type: "text",
        text: { preview_url: false, body },
      }),
    })
    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error de red" }
  }
}

/** Envía una plantilla aprobada (para iniciar conversación fuera de la ventana de 24h). */
export async function sendMetaTemplate(
  cfg: MetaConfig,
  to: string,
  templateName: string,
  langCode = "es",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: any[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${GRAPH}/${cfg.phone_number_id}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(to),
        type: "template",
        template: { name: templateName, language: { code: langCode }, ...(components ? { components } : {}) },
      }),
    })
    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error de red" }
  }
}

/** Verifica que el Phone Number ID + Token sean válidos; devuelve el número visible. */
export async function verifyMetaConfig(cfg: MetaConfig): Promise<{ ok: boolean; display_phone?: string; name?: string; error?: string }> {
  try {
    const res = await fetch(`${GRAPH}/${cfg.phone_number_id}?fields=display_phone_number,verified_name`, {
      headers: { Authorization: `Bearer ${cfg.access_token}` },
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, display_phone: data?.display_phone_number, name: data?.verified_name }
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error de red" }
  }
}

export type MetaInbound = {
  from: string          // número del cliente (solo dígitos)
  phoneNumberId: string // a qué número de la clínica llegó
  body: string
  type?: string
  mediaId?: string
  name?: string
}

/** Extrae el primer mensaje entrante del webhook de Meta (entry/changes/value/messages). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMetaWebhook(payload: any): MetaInbound | null {
  try {
    const change = payload?.entry?.[0]?.changes?.[0]?.value
    const msg = change?.messages?.[0]
    if (!msg) return null
    const phoneNumberId = change?.metadata?.phone_number_id || ""
    const name = change?.contacts?.[0]?.profile?.name
    const type = msg.type
    let body = ""
    let mediaId: string | undefined
    if (type === "text") body = msg.text?.body || ""
    else if (type === "audio") mediaId = msg.audio?.id
    else if (type === "voice") mediaId = msg.voice?.id
    else if (type === "image") { body = msg.image?.caption || ""; mediaId = msg.image?.id }
    return { from: normalizePhone(msg.from || ""), phoneNumberId, body, type, mediaId, name }
  } catch {
    return null
  }
}

/** Descarga la URL temporal de un media de Meta (para audios/imágenes). */
export async function getMetaMediaUrl(cfg: MetaConfig, mediaId: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${cfg.access_token}` } })
    const data = await res.json().catch(() => ({}))
    return data?.url || null
  } catch {
    return null
  }
}
