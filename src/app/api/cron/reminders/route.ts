import { NextResponse } from "next/server"
import { addHours, format } from "date-fns"
import { createAdminClient } from "@/lib/supabase/admin"
import { isUltramsgConfigured, sendWhatsappMessage } from "@/lib/whatsapp/ultramsg"

export const dynamic = "force-dynamic"

// Cron diario/horario: envía recordatorios de WhatsApp para las citas que
// ocurren en ~24h y que aún no fueron recordadas. Configurado en vercel.json.
export async function GET(request: Request) {
  // Seguridad: si CRON_SECRET está definido, exigir el header de Vercel Cron.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  if (!isUltramsgConfigured()) {
    return NextResponse.json({ ok: true, sent: 0, note: "WhatsApp no configurado" })
  }

  const admin = createAdminClient()
  const from = addHours(new Date(), 23).toISOString()
  const to = addHours(new Date(), 25).toISOString()

  const { data: appts, error } = await admin
    .from("appointments")
    .select("id, clinic_id, scheduled_at, status, reminder_sent_at, patient:profiles!appointments_patient_id_fkey(full_name, phone), service:services(name)")
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .in("status", ["pendiente", "confirmada"])
    .is("reminder_sent_at", null)

  if (error) {
    console.error("[cron/reminders]", error)
    return NextResponse.json({ ok: false, error: "query" }, { status: 500 })
  }

  let sent = 0
  for (const apt of appts || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = apt as any
    const phone = a.patient?.phone ? String(a.patient.phone).replace(/[^\d]/g, "") : ""
    if (!phone) continue

    const when = new Date(a.scheduled_at)
    const name = (a.patient?.full_name || "").split(" ")[0] || ""
    const serviceName = a.service?.name || "tu cita"
    const body = `Hola ${name} 👋, te recordamos tu cita de ${serviceName} para mañana ${format(when, "dd/MM 'a las' HH:mm")} hrs. ¿Confirmas tu asistencia? Responde *SÍ* para confirmar o *NO* para reagendar. 💙`

    const ok = await sendWhatsappMessage(phone, body)
    if (!ok) continue

    await admin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", a.id)
    await admin.from("whatsapp_messages").insert({
      clinic_id: a.clinic_id,
      contact_phone: phone,
      contact_name: a.patient?.full_name || null,
      direction: "out",
      body,
      ai_model: "reminder",
    })
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
