import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

// Actualizar un producto
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const body = sanitizeInput(await request.json())
    const { name, category, sku, unit, min_stock, cost, supplier, notes, is_active } = body

    const supabase = createClient()
    const { data, error } = await supabase
      .from("inventory_products")
      .update({
        ...(name !== undefined ? { name } : {}),
        category: category ?? null,
        sku: sku ?? null,
        unit: unit || "unidad",
        ...(min_stock !== undefined ? { min_stock: Number(min_stock) || 0 } : {}),
        cost: cost ? Number(cost) : null,
        supplier: supplier ?? null,
        notes: notes ?? null,
        ...(is_active !== undefined ? { is_active } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("clinic_id", context!.clinicId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Eliminar un producto
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const supabase = createClient()
    const { error } = await supabase
      .from("inventory_products")
      .delete()
      .eq("id", params.id)
      .eq("clinic_id", context!.clinicId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
