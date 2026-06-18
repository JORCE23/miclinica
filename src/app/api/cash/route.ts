import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"
import { startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"

// GET: movimientos manuales de hoy + ingresos por citas completadas hoy.
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const from = startOfDay(new Date()).toISOString()
  const to = endOfDay(new Date()).toISOString()

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("*")
    .eq("clinic_id", context!.clinicId)
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false })

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, service_id, price, payment_method, scheduled_at, patient:profiles!appointments_patient_id_fkey(full_name), service:services(name, category)")
    .eq("clinic_id", context!.clinicId)
    .eq("status", "completada")
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)

  // Costo de insumos por servicio (para calcular el neto): service_products × costo del producto
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceIds = Array.from(new Set((appts || []).map((a: any) => a.service_id).filter(Boolean)))
  const insumoByService: Record<string, number> = {}
  if (serviceIds.length) {
    const { data: sp } = await supabase
      .from("service_products")
      .select("service_id, quantity, product:inventory_products(cost)")
      .in("service_id", serviceIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (sp || []) as any[]) {
      const cost = (row.product?.cost || 0) * (row.quantity || 1)
      insumoByService[row.service_id] = (insumoByService[row.service_id] || 0) + cost
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appointments = (appts || []).map((a: any) => ({
    ...a,
    insumo_cost: a.service_id ? insumoByService[a.service_id] || 0 : 0,
    service_category: a.service?.category || null,
  }))

  return NextResponse.json({ movements: movements || [], appointments })
}

// POST: registrar un ingreso o egreso manual.
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const type = body?.type
  const amount = Number(body?.amount)
  if (!["ingreso", "egreso"].includes(type) || isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("cash_movements")
    .insert({
      clinic_id: context!.clinicId,
      type,
      amount,
      method: body?.method || null,
      concept: body?.concept || null,
      created_by: context!.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
