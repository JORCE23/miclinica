import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseISO, addMinutes, isBefore, isAfter, format, startOfDay, endOfDay } from "date-fns"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json()
    const { date, duration_minutes } = body

    if (!date || !duration_minutes) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const { data: clinic } = await supabase
      .from("clinics")
      .select("id")
      .eq("slug", params.slug)
      .single()

    if (!clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    const targetDate = new Date(date)
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

    // Build slots between 09:00 and 18:00
    const slots: string[] = []
    let currentSlot = new Date(targetDate)
    currentSlot.setHours(9, 0, 0, 0)
    
    const endOfDayTime = new Date(targetDate)
    endOfDayTime.setHours(18, 0, 0, 0)

    const now = new Date()

    while (isBefore(addMinutes(currentSlot, duration_minutes), endOfDayTime) || currentSlot.getTime() === endOfDayTime.getTime() - duration_minutes * 60000) {
      // Slot bounds
      const slotStart = currentSlot
      const slotEnd = addMinutes(currentSlot, duration_minutes)

      // Skip past slots if it's today
      if (isAfter(slotStart, now)) {
        // Check overlap with existing appointments
        const isOverlapping = appointments?.some(apt => {
          const aptStart = new Date(apt.scheduled_at)
          const aptEnd = addMinutes(aptStart, apt.duration_minutes)
          return (isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart))
        })

        if (!isOverlapping) {
          slots.push(slotStart.toISOString())
        }
      }
      
      // Advance by 30 minutes
      currentSlot = addMinutes(currentSlot, 30)
    }

    return NextResponse.json({ slots })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
