// Cliente de UltraMsg para enviar mensajes de WhatsApp.
// Requiere ULTRAMSG_INSTANCE_ID y ULTRAMSG_TOKEN.
// Opcional: ULTRAMSG_WEBHOOK_TOKEN para validar los webhooks entrantes.

export function isUltramsgConfigured(): boolean {
  return !!(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN)
}

// Envía un mensaje de texto a un número (formato: solo dígitos con código país, ej "569XXXXXXXX")
export async function sendWhatsappMessage(to: string, body: string): Promise<boolean> {
  const instance = process.env.ULTRAMSG_INSTANCE_ID
  const token = process.env.ULTRAMSG_TOKEN
  if (!instance || !token) return false

  const url = `https://api.ultramsg.com/${instance}/messages/chat`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, to, body }),
  })
  return res.ok
}

// Normaliza el número entrante de UltraMsg ("569XXXXXXXX@c.us") a solo dígitos.
export function normalizePhone(raw: string): string {
  return (raw || "").replace(/@c\.us$/i, "").replace(/[^\d]/g, "")
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UltramsgInbound = {
  from: string // "569XXXXXXXX@c.us"
  body: string
  pushname?: string
  fromMe?: boolean
  type?: string
}

// Extrae el mensaje entrante del payload del webhook de UltraMsg.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseUltramsgWebhook(payload: any): UltramsgInbound | null {
  const d = payload?.data ?? payload
  if (!d) return null
  const from = d.from || d.author
  if (!from) return null
  return {
    from,
    body: d.body ?? "",
    pushname: d.pushname,
    fromMe: !!d.fromMe || !!d.self,
    type: d.type,
  }
}
