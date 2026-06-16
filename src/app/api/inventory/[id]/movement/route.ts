import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

// Registra un movimiento de stock (entrada / salida / ajuste) y actualiza el producto.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const body = sanitizeInput(await request.json())
    const type = body?.type as "entrada" | "salida" | "ajuste"
    const quantity = Number(body?.quantity)
    const reason = body?.reason || null

    if (!["entrada", "salida", "ajuste"].includes(type) || isNaN(quantity)) {
      return NextResponse.json({ error: "Datos de movimiento inválidos" }, { status: 400 })
    }

    const supabase = createClient()

    // Producto actual (scoped por clínica)
    const { data: product, error: pErr } = await supabase
      .from("inventory_products")
      .select("id, stock")
      .eq("id", params.id)
      .eq("clinic_id", context!.clinicId)
      .single()
    if (pErr || !product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    let newStock = product.stock
    if (type === "entrada") newStock = product.stock + Math.abs(quantity)
    else if (type === "salida") newStock = Math.max(0, product.stock - Math.abs(quantity))
    else if (type === "ajuste") newStock = Math.max(0, Math.round(quantity))

    const { error: uErr } = await supabase
      .from("inventory_products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("clinic_id", context!.clinicId)
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 400 })

    await supabase.from("inventory_movements").insert({
      clinic_id: context!.clinicId,
      product_id: params.id,
      type,
      quantity: type === "ajuste" ? newStock : Math.abs(quantity),
      reason,
      created_by: context!.userId,
    })

    return NextResponse.json({ ok: true, stock: newStock })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
