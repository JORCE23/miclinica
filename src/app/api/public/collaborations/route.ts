import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // bypass RLS para el formulario público
)

// POST público: alguien envía el formulario para colaborar con una clínica (por slug).
export async function POST(request: Request) {
  try {
    const body = await request.json()
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
      message: String(body?.message || "").trim() || null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
