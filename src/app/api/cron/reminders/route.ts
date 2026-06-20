import { NextResponse } from "next/server"
import { addDays, startOfDay, endOfDay, format } from "date-fns"
import { createAdminClient } from "@/lib/supabase/admin"
import { isUltramsgConfigured, sendWhatsappMessage } from "@/lib/whatsapp/ultramsg"

export const dynamic = "force-dynamic"

// Cron diario (08:30 Chile / 12:30 UTC): envía dos recordatorios por WhatsApp
//  1) 24h antes — citas de mañana (reminder_sent_at)
//  2) la mañana del día — citas de hoy (reminder_morning_sent_at)
// Configurado en vercel.json.
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

  // Un "pase": recorre citas y envía el mensaje, marcando su bandera para no repetir.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function runPass(appts: any[], flag: "reminder_sent_at" | "reminder_morning_sent_at", makeBody: (name: string, service: string, when: Date) => string) {
    let sent = 0
    for (const apt of appts || []) {
      const a = apt as any
      const phone = a.patient?.phone ? String(a.patient.phone).replace(/[^\d]/g, "") : ""
      if (!phone) continue
      const name = (a.patient?.full_name || "").split(" ")[0] || ""
      const body = makeBody(name, a.service?.name || "tu cita", new Date(a.scheduled_at))
      const ok = await sendWhatsappMessage(phone, body)
      if (!ok) continue
      await admin.from("appointments").update({ [flag]: new Date().toISOString() }).eq("id", a.id)
      await admin.from("whatsapp_messages").insert({
        clinic_id: a.clinic_id, contact_phone: phone, contact_name: a.patient?.full_name || null,
        direction: "out", body, ai_model: "reminder",
      })
      sent++
    }
    return sent
  }

  const sel = "id, clinic_id, scheduled_at, status, patient:profiles!appointments_patient_id_fkey(full_name, phone), service:services(name)"

  // 1) 24h antes: citas de MAÑANA aún no recordadas.
  const tomorrow = addDays(new Date(), 1)
  const { data: tomorrowAppts, error: e1 } = await admin
    .from("appointments").select(sel)
    .gte("scheduled_at", startOfDay(tomorrow).toISOString())
    .lte("scheduled_at", endOfDay(tomorrow).toISOString())
    .in("status", ["pendiente", "confirmada"])
    .is("reminder_sent_at", null)

  // 2) La mañana del día (08:30): citas de HOY sin recordatorio matinal.
  const today = new Date()
  const { data: todayAppts, error: e2 } = await admin
    .from("appointments").select(sel)
    .gte("scheduled_at", startOfDay(today).toISOString())
    .lte("scheduled_at", endOfDay(today).toISOString())
    .in("status", ["pendiente", "confirmada"])
    .is("reminder_morning_sent_at", null)

  if (e1 || e2) {
    console.error("[cron/reminders]", e1 || e2)
    return NextResponse.json({ ok: false, error: "query" }, { status: 500 })
  }

  const sent24 = await runPass(tomorrowAppts || [], "reminder_sent_at",
    (name, service, when) => `Hola ${name} 👋, te recordamos tu cita de ${service} para mañana ${format(when, "dd/MM 'a las' HH:mm")} hrs. ¿Confirmas tu asistencia? Responde *SÍ* para confirmar o *NO* para reagendar. 💙`)

  const sentMorning = await runPass(todayAppts || [], "reminder_morning_sent_at",
    (name, service, when) => `Buenos días ${name} ☀️, te esperamos hoy a las ${format(when, "HH:mm")} hrs para tu ${service}. Si necesitas reprogramar, escríbenos con tiempo. ¡Te esperamos! 💙`)

  return NextResponse.json({ ok: true, sent: sent24 + sentMorning, detail: { recordatorio_24h: sent24, recordatorio_matinal: sentMorning } })
}
