import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

// Insumos (productos de inventario) que consume un servicio.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("service_products")
    .select("id, quantity, product:inventory_products(id, name, unit, stock)")
    .eq("clinic_id", context!.clinicId)
    .eq("service_id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// Agregar o actualizar un insumo del servicio
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const product_id = body?.product_id
  const quantity = Math.max(1, Number(body?.quantity) || 1)
  if (!product_id) return NextResponse.json({ error: "Falta el producto" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("service_products")
    .upsert(
      { clinic_id: context!.clinicId, service_id: params.id, product_id, quantity },
      { onConflict: "service_id,product_id" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

// Quitar un insumo del servicio (?product_id=...)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const product_id = new URL(request.url).searchParams.get("product_id")
  if (!product_id) return NextResponse.json({ error: "Falta el producto" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("service_products")
    .delete()
    .eq("clinic_id", context!.clinicId)
    .eq("service_id", params.id)
    .eq("product_id", product_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
