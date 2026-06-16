import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

// Listar productos del inventario de la clínica
export async function GET(request: Request) {
  try {
    const ip = getIp(request)
    const { success } = await checkRateLimit(ip)
    if (!success) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })

    const { context, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse

    const supabase = createClient()
    const { data, error } = await supabase
      .from("inventory_products")
      .select("*")
      .eq("clinic_id", context!.clinicId)
      .order("name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Crear un producto
export async function POST(request: Request) {
  try {
    const ip = getIp(request)
    const { success } = await checkRateLimit(ip)
    if (!success) return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 })

    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    const body = sanitizeInput(await request.json())
    const { name, category, sku, unit, stock, min_stock, cost, supplier, notes } = body
    if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })

    const supabase = createClient()
    const { data, error } = await supabase
      .from("inventory_products")
      .insert({
        clinic_id: context!.clinicId,
        name,
        category: category || null,
        sku: sku || null,
        unit: unit || "unidad",
        stock: Number(stock) || 0,
        min_stock: Number(min_stock) || 0,
        cost: cost ? Number(cost) : null,
        supplier: supplier || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
