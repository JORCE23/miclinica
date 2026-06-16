import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

// Historial de movimientos de inventario (entradas/salidas/ajustes).
export async function GET(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const productId = new URL(request.url).searchParams.get("product_id")
  const supabase = createClient()

  let query = supabase
    .from("inventory_movements")
    .select("id, type, quantity, reason, created_at, product:inventory_products(name, unit)")
    .eq("clinic_id", context.clinicId)
    .order("created_at", { ascending: false })
    .limit(150)

  if (productId) query = query.eq("product_id", productId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
