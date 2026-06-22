import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { groqChat, isGroqConfigured } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"

/** Campos destino por entidad (lo que la IA debe mapear desde las columnas del Excel). */
const SCHEMAS = {
  pacientes: ["full_name", "rut", "email", "phone", "birth_date", "notes"],
  inventario: ["name", "category", "sku", "unit", "stock", "min_stock", "supplier", "notes"],
  servicios: ["name", "description", "category", "duration_minutes", "price"],
  reservas: ["patient_name", "service_name", "professional_name", "scheduled_at", "price", "notes"],
}

export async function POST(req: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse
  void context

  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "La IA no está configurada (falta GROQ_API_KEY)." }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const sheets: { name: string; headers: string[]; sample: Record<string, unknown>[] }[] = body?.sheets || []
  if (!Array.isArray(sheets) || sheets.length === 0) {
    return NextResponse.json({ error: "No se recibieron datos del archivo." }, { status: 400 })
  }

  const system = `Eres un asistente que clasifica datos tabulares de una clínica y mapea columnas.
Entidades posibles y sus campos destino:
- pacientes: ${SCHEMAS.pacientes.join(", ")}
- inventario: ${SCHEMAS.inventario.join(", ")}
- servicios: ${SCHEMAS.servicios.join(", ")}
- reservas: ${SCHEMAS.reservas.join(", ")}
Para cada hoja, decide a qué entidad corresponde (o "desconocido") y mapea cada campo destino al NOMBRE EXACTO de la columna de origen que mejor lo represente (o null si no hay).
Pistas: "nombre/paciente/cliente"→full_name; "rut/dni"→rut; "fono/teléfono/celular"→phone; "correo/email"→email; "nacimiento/fecha nac"→birth_date; "stock/cantidad/existencia"→stock; "mínimo"→min_stock; "categoría/rubro"→category; "precio/valor"→price; "duración/minutos"→duration_minutes; "proveedor"→supplier; "sku/código"→sku; "servicio/tratamiento"→service_name o name según contexto.
Responde SOLO con JSON válido, sin texto extra, con esta forma:
{"results":[{"sheet":"<nombre hoja>","entity":"pacientes|inventario|servicios|reservas|desconocido","confidence":0.0-1.0,"mapping":{"<campo_destino>":"<columna_origen o null>"}}]}`

  const user = `Hojas del archivo (encabezados y filas de muestra):\n${JSON.stringify(
    sheets.map((s) => ({ sheet: s.name, headers: s.headers, sample: s.sample.slice(0, 5) })),
    null,
    2
  )}`

  let text: string | null = null
  try {
    const resp = await groqChat({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.1,
    })
    text = resp.content
  } catch {
    return NextResponse.json({ error: "La IA no pudo analizar el archivo. Intenta de nuevo." }, { status: 502 })
  }

  // Extraer el bloque JSON aunque venga con texto o ```json
  const match = text?.match(/\{[\s\S]*\}/)
  if (!match) {
    return NextResponse.json({ error: "No se pudo interpretar la respuesta de la IA." }, { status: 502 })
  }
  let parsed: { results?: unknown }
  try {
    parsed = JSON.parse(match[0])
  } catch {
    return NextResponse.json({ error: "Respuesta de la IA inválida." }, { status: 502 })
  }

  return NextResponse.json({ results: parsed.results || [], schemas: SCHEMAS })
}
