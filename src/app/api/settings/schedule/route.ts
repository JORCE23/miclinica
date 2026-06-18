import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

const DEFAULTS = Array.from({ length: 7 }, (_, d) => ({
  day_of_week: d,
  is_open: d !== 0, // domingo cerrado por defecto
  open_time: "09:00",
  close_time: "18:00",
}))

export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data } = await supabase
    .from("clinic_schedules")
    .select("day_of_week, is_open, open_time, close_time")
    .eq("clinic_id", context!.clinicId)

  // Combina con defaults para devolver siempre los 7 días en orden
  const byDay: Record<number, any> = {} // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const r of data || []) byDay[r.day_of_week] = r
  const schedule = DEFAULTS.map((d) => byDay[d.day_of_week] || d)

  return NextResponse.json(schedule)
}

export async function PUT(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = await request.json()
  const schedule = Array.isArray(body?.schedule) ? body.schedule : []

  const rows = schedule
    .filter((d: any) => typeof d?.day_of_week === "number") // eslint-disable-line @typescript-eslint/no-explicit-any
    .map((d: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      clinic_id: context!.clinicId,
      day_of_week: d.day_of_week,
      is_open: !!d.is_open,
      open_time: d.open_time || "09:00",
      close_time: d.close_time || "18:00",
    }))

  const supabase = createClient()
  const { error } = await supabase
    .from("clinic_schedules")
    .upsert(rows, { onConflict: "clinic_id,day_of_week" })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
