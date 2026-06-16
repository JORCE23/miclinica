import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

// Lotes de un producto
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .eq("clinic_id", context!.clinicId)
    .eq("product_id", params.id)
    .order("expiry_date", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// Agregar un lote
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const supabase = createClient()
  const { data, error } = await supabase
    .from("inventory_batches")
    .insert({
      clinic_id: context!.clinicId,
      product_id: params.id,
      batch_code: body?.batch_code || null,
      quantity: Number(body?.quantity) || 0,
      expiry_date: body?.expiry_date || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
