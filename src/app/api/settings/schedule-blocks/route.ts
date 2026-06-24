import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const YMD = /^\d{4}-\d{2}-\d{2}$/

// GET: lista los bloqueos de la clínica (recurrentes y puntuales).
export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("id, day_of_week, block_date, start_time, end_time, reason")
    .eq("clinic_id", context!.clinicId)
    .order("block_date", { ascending: true })
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

// POST: crea un bloqueo. Body: { kind:'weekly'|'date', day_of_week?, block_date?, start_time, end_time, reason? }
export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
  }

  const start_time = String(body?.start_time || "")
  const end_time = String(body?.end_time || "")
  if (!HHMM.test(start_time) || !HHMM.test(end_time)) {
    return NextResponse.json({ error: "Horas inválidas (formato HH:MM)" }, { status: 400 })
  }
  if (end_time <= start_time) {
    return NextResponse.json({ error: "La hora de término debe ser posterior a la de inicio" }, { status: 400 })
  }

  const kind = body?.kind === "date" ? "date" : "weekly"
  const row: Record<string, unknown> = {
    clinic_id: context!.clinicId,
    start_time,
    end_time,
    reason: body?.reason ? String(body.reason).slice(0, 200) : null,
    day_of_week: null,
    block_date: null,
  }

  if (kind === "weekly") {
    const dow = Number(body?.day_of_week)
    if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
      return NextResponse.json({ error: "Día de la semana inválido" }, { status: 400 })
    }
    row.day_of_week = dow
  } else {
    const block_date = String(body?.block_date || "")
    if (!YMD.test(block_date)) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 })
    }
    row.block_date = block_date
  }

  const supabase = createClient()
  const { data, error } = await supabase.from("schedule_blocks").insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: elimina un bloqueo por id (?id=...).
export async function DELETE(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 })

  const supabase = createClient()
  const { error } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", id)
    .eq("clinic_id", context!.clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
