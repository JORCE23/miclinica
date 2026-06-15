/**
 * Utility functions for input sanitization to prevent XSS and injection attacks.
 */

/**
 * Escapes HTML characters in a string to their corresponding HTML entities.
 * Use this when you want to keep the text but render it safely (React does this by default, but it's good for DB storage).
 */
export function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Completely strips HTML tags from a string.
 * Use this when no HTML is expected or allowed (e.g. names, notes, standard text inputs).
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return html;
  return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Main sanitization wrapper: Strips HTML and trims whitespace.
 * Use this for all standard string inputs before saving to DB.
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return stripHtml(input).trim();
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  if (input !== null && typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (key === 'password' || key === 'email') {
        sanitizedObj[key] = value;
      } else {
        sanitizedObj[key] = sanitizeInput(value);
      }
    }
    return sanitizedObj;
  }
  return input;
}
