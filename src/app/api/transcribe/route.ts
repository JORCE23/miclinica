import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { isGroqConfigured, transcribeAudio } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Recibe un audio grabado en el navegador y devuelve su transcripción (Whisper/Groq).
export async function POST(request: Request) {
  const { errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "Falta configurar GROQ_API_KEY." }, { status: 400 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Audio faltante o vacío" }, { status: 400 })
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "El audio es muy largo (máx 25 MB)" }, { status: 400 })
  }

  const text = await transcribeAudio(file, "audio.webm")
  if (!text) return NextResponse.json({ error: "No se pudo transcribir el audio." }, { status: 400 })
  return NextResponse.json({ text })
}
