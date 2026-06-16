import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { addDays, format } from "date-fns"

export const dynamic = "force-dynamic"

// Resumen de lotes por vencer / vencidos de la clínica (para alertas).
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const today = format(new Date(), "yyyy-MM-dd")
  const soon = format(addDays(new Date(), 30), "yyyy-MM-dd")

  const { data } = await supabase
    .from("inventory_batches")
    .select("id, batch_code, quantity, expiry_date, product:inventory_products(name)")
    .eq("clinic_id", context!.clinicId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", soon)
    .order("expiry_date", { ascending: true })

  const expired = (data || []).filter((b) => b.expiry_date && b.expiry_date < today)
  const expiringSoon = (data || []).filter((b) => b.expiry_date && b.expiry_date >= today)

  return NextResponse.json({
    expiredCount: expired.length,
    expiringCount: expiringSoon.length,
    items: data || [],
  })
}

// Eliminar un lote (?id=...)
export async function DELETE(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta el lote" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("inventory_batches")
    .delete()
    .eq("id", id)
    .eq("clinic_id", context!.clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
