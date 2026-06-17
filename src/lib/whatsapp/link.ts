// Construye un enlace "click-to-chat" de WhatsApp (wa.me) a partir de un teléfono.
// No usa API ni el bot: solo abre WhatsApp Web/App con el mensaje prellenado.

/**
 * Normaliza un teléfono a solo dígitos con código de país (best-effort).
 * - Quita todo lo que no sea dígito.
 * - Si el número parece chileno sin código (9 dígitos comenzando en 9), antepone "56".
 */
export function normalizeWhatsappPhone(raw?: string | null): string {
  let digits = (raw || "").replace(/[^\d]/g, "")
  if (!digits) return ""
  // Quita ceros iniciales de marcación local
  digits = digits.replace(/^0+/, "")
  // Caso Chile: móvil de 9 dígitos que empieza en 9 → anteponer código país 56
  if (digits.length === 9 && digits.startsWith("9")) {
    digits = "56" + digits
  }
  return digits
}

/**
 * Devuelve la URL wa.me lista para abrir, o null si no hay teléfono válido.
 */
export function buildWhatsappLink(phone?: string | null, message?: string): string | null {
  const digits = normalizeWhatsappPhone(phone)
  if (!digits) return null
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
