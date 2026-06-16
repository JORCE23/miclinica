import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { startOfDay, endOfDay, addDays, format } from "date-fns"

export const dynamic = "force-dynamic"

type Notif = { id: string; type: string; severity: "info" | "warning" | "danger"; title: string; description: string; href: string }

// Agrega notificaciones reales: stock bajo/agotado, vencimientos, citas de hoy y cumpleaños.
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const clinicId = context.clinicId
  const items: Notif[] = []

  // Inventario: stock bajo y agotados
  const { data: products } = await supabase
    .from("inventory_products")
    .select("id, name, stock, min_stock")
    .eq("clinic_id", clinicId)
  const low = (products || []).filter((p) => p.stock > 0 && p.stock <= p.min_stock)
  const out = (products || []).filter((p) => p.stock <= 0)
  if (out.length) items.push({ id: "inv-out", type: "inventario", severity: "danger", title: `${out.length} producto(s) agotado(s)`, description: out.slice(0, 3).map((p) => p.name).join(", "), href: "/admin/inventory" })
  if (low.length) items.push({ id: "inv-low", type: "inventario", severity: "warning", title: `${low.length} producto(s) con stock bajo`, description: low.slice(0, 3).map((p) => p.name).join(", "), href: "/admin/inventory" })

  // Vencimientos de lotes
  const today = format(new Date(), "yyyy-MM-dd")
  const soon = format(addDays(new Date(), 30), "yyyy-MM-dd")
  const { data: batches } = await supabase
    .from("inventory_batches")
    .select("id, expiry_date, product:inventory_products(name)")
    .eq("clinic_id", clinicId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", soon)
  const expired = (batches || []).filter((b) => b.expiry_date && b.expiry_date < today)
  const expiring = (batches || []).filter((b) => b.expiry_date && b.expiry_date >= today)
  if (expired.length) items.push({ id: "batch-exp", type: "vencimiento", severity: "danger", title: `${expired.length} lote(s) vencido(s)`, description: "Revisa los lotes de tu inventario.", href: "/admin/inventory" })
  if (expiring.length) items.push({ id: "batch-soon", type: "vencimiento", severity: "warning", title: `${expiring.length} lote(s) por vencer`, description: "Próximos 30 días.", href: "/admin/inventory" })

  // Citas de hoy
  const { count: todayCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .gte("scheduled_at", startOfDay(new Date()).toISOString())
    .lte("scheduled_at", endOfDay(new Date()).toISOString())
    .not("status", "in", '("cancelada","no_asistio")')
  if ((todayCount || 0) > 0) items.push({ id: "appts-today", type: "agenda", severity: "info", title: `${todayCount} cita(s) hoy`, description: "Revisa la agenda del día.", href: "/admin/waiting-room" })

  // Cumpleaños de hoy
  const { data: patients } = await supabase
    .from("profiles")
    .select("id, full_name, birth_date")
    .eq("clinic_id", clinicId)
    .eq("role", "client")
    .not("birth_date", "is", null)
    .limit(3000)
  const md = format(new Date(), "MM-dd")
  const birthdays = (patients || []).filter((p) => p.birth_date && format(new Date(p.birth_date + "T00:00:00"), "MM-dd") === md)
  if (birthdays.length) items.push({ id: "bdays", type: "cumpleaños", severity: "info", title: `${birthdays.length} cumpleaños hoy 🎂`, description: birthdays.slice(0, 3).map((p) => p.full_name).join(", "), href: "/admin/patients" })

  return NextResponse.json({ count: items.length, items })
}
