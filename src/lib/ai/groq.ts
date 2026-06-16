// Cliente de Groq (API compatible con OpenAI). Gratis y muy rápido.
// Requiere GROQ_API_KEY. Si no está configurada, isGroqConfigured() devuelve false.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

// Modelo por defecto (puede sobrescribirse por mensaje). Llama 3.3 70B en Groq es gratis.
export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_call_id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool_calls?: any[]
  name?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolDef = { type: "function"; function: Record<string, any> }

export async function groqChat(opts: {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  tools?: ToolDef[]
}): Promise<ChatMessage> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY no configurada")

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model || DEFAULT_GROQ_MODEL,
      temperature: opts.temperature ?? 0.5,
      messages: opts.messages,
      ...(opts.tools && opts.tools.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Groq error ${res.status}: ${txt.slice(0, 300)}`)
  }

  const data = await res.json()
  const msg = data?.choices?.[0]?.message
  return {
    role: "assistant",
    content: msg?.content ?? null,
    tool_calls: msg?.tool_calls,
  }
}
