import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// Aplica los items de una factura: crea productos nuevos o suma stock a los existentes,
// y registra un movimiento de entrada por cada uno.
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = sanitizeInput(await request.json())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = Array.isArray(body?.items) ? body.items : []
  const proveedor = (body?.proveedor || "").toString().trim() || null
  if (!items.length) return NextResponse.json({ error: "No hay productos para agregar" }, { status: 400 })

  const supabase = createClient()
  const clinicId = context.clinicId
  const reason = `Factura de compra${proveedor ? ` · ${proveedor}` : ""}`
  let created = 0, updated = 0
  const errors: string[] = []

  for (const it of items) {
    const name = (it?.name || "").toString().trim()
    const quantity = Math.max(0, Math.round(Number(it?.quantity) || 0))
    const cost = Math.max(0, Number(it?.unit_cost) || 0)
    const category = (it?.category || "").toString().trim() || null
    if (!name || quantity <= 0) continue

    // ¿Existe un producto con ese nombre en la clínica?
    const { data: existing } = await supabase
      .from("inventory_products")
      .select("id, stock, cost")
      .eq("clinic_id", clinicId)
      .ilike("name", name)
      .limit(1)
      .maybeSingle()

    let productId: string
    if (existing) {
      productId = existing.id
      const patch: Record<string, unknown> = { stock: (existing.stock || 0) + quantity, updated_at: new Date().toISOString() }
      if (cost > 0) patch.cost = cost
      const { error } = await supabase.from("inventory_products").update(patch).eq("id", productId).eq("clinic_id", clinicId)
      if (error) { errors.push(name); continue }
      updated++
    } else {
      const { data: inserted, error } = await supabase
        .from("inventory_products")
        .insert({ clinic_id: clinicId, name, category, stock: quantity, min_stock: 0, cost: cost || null, is_active: true })
        .select("id")
        .single()
      if (error || !inserted) { errors.push(name); continue }
      productId = inserted.id
      created++
    }

    await supabase.from("inventory_movements").insert({
      clinic_id: clinicId,
      product_id: productId,
      type: "entrada",
      quantity,
      reason,
      created_by: context.userId,
    })
  }

  return NextResponse.json({ ok: true, created, updated, errors })
}
