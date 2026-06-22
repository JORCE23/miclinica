import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// POST público: alguien envía el formulario para colaborar con una clínica (por slug).
export async function POST(request: Request) {
  try {
    // Anti-spam: máximo 5 envíos por IP cada 10 minutos.
    const ip = getIp(request)
    const { success } = await checkRateLimit(ip, { limit: 5, windowMs: 10 * 60 * 1000 })
    if (!success) {
      return NextResponse.json({ error: "Demasiados envíos. Intenta más tarde." }, { status: 429 })
    }

    // Cliente service-role (bypass RLS para el formulario público) — dentro del handler.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = sanitizeInput(await request.json())
    const slug = String(body?.slug || "").trim()
    const name = String(body?.name || "").trim()
    if (!slug || !name) return NextResponse.json({ error: "Faltan datos" }, { status: 400 })

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    const { error } = await supabase.from("collaborations").insert({
      clinic_id: clinic.id,
      name,
      email: String(body?.email || "").trim() || null,
      phone: String(body?.phone || "").trim() || null,
      role: String(body?.role || "").trim() || null,
      message: String(body?.message || "").trim().slice(0, 2000) || null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}
