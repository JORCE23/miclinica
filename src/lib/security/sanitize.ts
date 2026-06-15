/**
 * Utilidades de sanitización de inputs para prevenir XSS / inyección.
 */

export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== "string") return unsafe
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function stripHtml(html: string): string {
  if (typeof html !== "string") return html
  return html.replace(/<[^>]*>?/gm, "")
}

// Campos que NO deben alterarse (ej. contraseñas: un strip silencioso rompería el login).
const RAW_KEYS = new Set(["password"])

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return stripHtml(input).trim()
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item))
  }
  if (input !== null && typeof input === "object") {
    const sanitizedObj: Record<string, any> = {}
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = RAW_KEYS.has(key) ? value : sanitizeInput(value)
    }
    return sanitizedObj
  }
  return input
}
