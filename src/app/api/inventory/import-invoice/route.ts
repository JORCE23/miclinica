import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { isGroqConfigured, groqVision } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const PROMPT = `Eres un asistente que lee FACTURAS o BOLETAS de compra de insumos de una clínica estética.
Extrae los productos comprados de la imagen. Devuelve SOLO un objeto JSON con esta forma exacta:
{
  "proveedor": "nombre del proveedor si aparece, o null",
  "items": [
    { "name": "nombre del producto", "quantity": número de unidades recibidas, "unit_cost": precio unitario en número (sin símbolos), "category": "categoría sugerida o null" }
  ]
}
Reglas:
- quantity = cantidad/unidades que llegaron (entero). Si no aparece, usa 1.
- unit_cost = precio por unidad. Si solo aparece el total de la línea, divídelo por la cantidad. Si no hay precio, usa 0.
- No inventes productos que no estén en la factura. No incluyas totales, IVA ni subtotales como si fueran productos.
- Responde SOLO el JSON, sin texto adicional.`

export async function POST(request: Request) {
  const { errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "Falta configurar GROQ_API_KEY para leer facturas con IA." }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const image = body?.image
  if (typeof image !== "string" || !image.startsWith("data:image")) {
    return NextResponse.json({ error: "Imagen de factura faltante o inválida" }, { status: 400 })
  }

  try {
    const raw = await groqVision({ imageDataUrl: image, prompt: PROMPT, jsonObject: true })
    let parsed: { proveedor?: string | null; items?: unknown }
    try {
      parsed = JSON.parse(raw)
    } catch {
      // por si el modelo envolvió el JSON en texto
      const m = raw.match(/\{[\s\S]*\}/)
      parsed = m ? JSON.parse(m[0]) : { items: [] }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = Array.isArray(parsed?.items) ? (parsed.items as any[]) : []
    const clean = items
      .map((it) => ({
        name: String(it?.name || "").trim(),
        quantity: Math.max(0, Math.round(Number(it?.quantity) || 0)),
        unit_cost: Math.max(0, Number(it?.unit_cost) || 0),
        category: it?.category ? String(it.category).trim() : "",
      }))
      .filter((it) => it.name)

    return NextResponse.json({ proveedor: parsed?.proveedor || null, items: clean })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error"
    console.error("import-invoice error:", msg)
    if (/model|decommission|not found|vision/i.test(msg)) {
      return NextResponse.json({ error: "El modelo de visión no está disponible. Revisa GROQ_VISION_MODEL." }, { status: 400 })
    }
    return NextResponse.json({ error: "No se pudo leer la factura. Intenta con una foto más nítida." }, { status: 500 })
  }
}
