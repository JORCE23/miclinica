import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { addMinutes, isBefore, isAfter, startOfDay, endOfDay } from "date-fns"
import { z } from "zod"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const availabilitySchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Fecha inválida"),
  duration_minutes: z.coerce.number().int().min(5).max(480),
})

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const ip = getIp(request)
  const { success } = await checkRateLimit(ip, { limit: 60, windowMs: 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 })
  }

  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: "Formato de solicitud inválido" }, { status: 400 })
    }

    const parsed = availabilitySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const { date, duration_minutes } = parsed.data

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single()
    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    const targetDate = new Date(date)

    // No retornar slots para fechas pasadas
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (targetDate < today) {
      return NextResponse.json({ slots: [] })
    }

    const start = startOfDay(targetDate).toISOString()
    const end = endOfDay(targetDate).toISOString()

    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("scheduled_at, duration_minutes, status")
      .eq("clinic_id", clinic.id)
      .gte("scheduled_at", start)
      .lte("scheduled_at", end)
      .neq("status", "cancelada")

    if (error) throw error

    const slots: string[] = []
    let currentSlot = new Date(targetDate)
    currentSlot.setHours(9, 0, 0, 0)

    const endOfDayTime = new Date(targetDate)
    endOfDayTime.setHours(18, 0, 0, 0)

    const now = new Date()

    while (
      isBefore(addMinutes(currentSlot, duration_minutes), endOfDayTime) ||
      currentSlot.getTime() === endOfDayTime.getTime() - duration_minutes * 60000
    ) {
      const slotStart = currentSlot
      const slotEnd = addMinutes(currentSlot, duration_minutes)

      if (isAfter(slotStart, now)) {
        const isOverlapping = appointments?.some((apt) => {
          const aptStart = new Date(apt.scheduled_at)
          const aptEnd = addMinutes(aptStart, apt.duration_minutes)
          return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart)
        })

        if (!isOverlapping) {
          slots.push(slotStart.toISOString())
        }
      }

      currentSlot = addMinutes(currentSlot, 30)
    }

    return NextResponse.json({ slots })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
