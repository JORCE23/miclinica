import { addMinutes, isAfter, isBefore, startOfDay, endOfDay, format } from "date-fns"
import { randomBytes } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { groqChat, type ChatMessage, type ToolDef } from "@/lib/ai/groq"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

// Resuelve la clínica que opera el bot (por slug en env, o la primera activa).
async function resolveClinic(admin: Admin) {
  const slug = process.env.WHATSAPP_CLINIC_SLUG
  let query = admin.from("clinics").select("id, name, slug, address, phone").eq("is_active", true)
  query = slug ? query.eq("slug", slug) : query.limit(1)
  const { data } = await query.maybeSingle()
  return data || null
}

async function getActiveServices(admin: Admin, clinicId: string) {
  const { data } = await admin
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .order("name")
  return data || []
}

// Busca el paciente por teléfono; si no existe, lo crea (lead de WhatsApp).
async function findOrCreatePatient(admin: Admin, clinicId: string, phone: string, name?: string) {
  const { data: existing } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("clinic_id", clinicId)
    .eq("phone", phone)
    .eq("role", "client")
    .maybeSingle()
  if (existing) return existing

  const email = `wa${phone}@wa.medique.app`
  const password = randomBytes(9).toString("hex") + "A1!"
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "client" },
  })

  const patientId = authData?.user?.id
  if (authErr || !patientId) {
    // Probablemente ya existe ese email: lo recuperamos
    const { data: again } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("clinic_id", clinicId)
      .eq("phone", phone)
      .maybeSingle()
    if (again) return again
    throw new Error("No se pudo crear el paciente")
  }

  await admin.from("profiles").insert({
    id: patientId,
    clinic_id: clinicId,
    role: "client",
    full_name: name || `Contacto WhatsApp ${phone.slice(-4)}`,
    phone,
    email,
    source: "whatsapp",
  })
  return { id: patientId, full_name: name }
}

// Genera horarios disponibles (09:00–18:00, bloques de 30 min) para una fecha.
async function checkAvailability(admin: Admin, clinicId: string, dateStr: string, duration = 60) {
  const targetDate = new Date(dateStr + "T00:00:00")
  if (isNaN(targetDate.getTime())) return []

  // Horario configurado para ese día (si está cerrado, no hay slots)
  const { data: sched } = await admin
    .from("clinic_schedules")
    .select("is_open, open_time, close_time")
    .eq("clinic_id", clinicId)
    .eq("day_of_week", targetDate.getDay())
    .maybeSingle()
  if (sched && sched.is_open === false) return []
  const [openH, openM] = (sched?.open_time || "09:00").split(":").map(Number)
  const [closeH, closeM] = (sched?.close_time || "18:00").split(":").map(Number)

  const { data: appts } = await admin
    .from("appointments")
    .select("scheduled_at, duration_minutes, status")
    .eq("clinic_id", clinicId)
    .gte("scheduled_at", startOfDay(targetDate).toISOString())
    .lte("scheduled_at", endOfDay(targetDate).toISOString())
    .neq("status", "cancelada")

  const slots: string[] = []
  const cursor = new Date(targetDate); cursor.setHours(openH, openM || 0, 0, 0)
  const dayEnd = new Date(targetDate); dayEnd.setHours(closeH, closeM || 0, 0, 0)
  const now = new Date()

  while (!isAfter(addMinutes(cursor, duration), dayEnd)) {
    const slotStart = new Date(cursor)
    const slotEnd = addMinutes(slotStart, duration)
    if (isAfter(slotStart, now)) {
      const overlap = appts?.some((a: { scheduled_at: string; duration_minutes: number }) => {
        const aStart = new Date(a.scheduled_at)
        const aEnd = addMinutes(aStart, a.duration_minutes)
        return isBefore(slotStart, aEnd) && isAfter(slotEnd, aStart)
      })
      if (!overlap) slots.push(format(slotStart, "HH:mm"))
    }
    cursor.setTime(addMinutes(cursor, 30).getTime())
  }
  return slots
}

type AgentContext = {
  admin: Admin
  clinicId: string
  clinicName: string
  clinicAddress?: string | null
  clinicPhone?: string | null
  phone: string
  pushname?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
}

function buildTools(): ToolDef[] {
  return [
    {
      type: "function",
      function: {
        name: "list_services",
        description: "Lista los servicios de la clínica con duración y precio.",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Devuelve los horarios disponibles para una fecha. Úsalo antes de agendar.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
            duration_minutes: { type: "number", description: "Duración del servicio en minutos" },
          },
          required: ["date"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Agenda una cita en estado 'pendiente' para el contacto actual. Confirma fecha y servicio con el cliente antes de llamar.",
        parameters: {
          type: "object",
          properties: {
            service_name: { type: "string", description: "Nombre del servicio a agendar" },
            datetime_iso: { type: "string", description: "Fecha y hora ISO 8601, ej 2026-06-20T15:00:00" },
          },
          required: ["service_name", "datetime_iso"],
        },
      },
    },
    {
      type: "function",
      function: { name: "my_appointments", description: "Muestra las próximas citas del contacto actual (este mismo paciente de WhatsApp).", parameters: { type: "object", properties: {} } },
    },
    {
      type: "function",
      function: {
        name: "cancel_my_appointment",
        description: "Cancela una cita futura del contacto actual. Si tiene varias, indica la fecha.",
        parameters: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD de la cita a cancelar (opcional)" } } },
      },
    },
    {
      type: "function",
      function: {
        name: "reschedule_my_appointment",
        description: "Cambia la fecha/hora de la próxima cita del contacto actual. Verifica disponibilidad antes.",
        parameters: { type: "object", properties: { datetime_iso: { type: "string", description: "Nueva fecha y hora ISO 8601" }, date: { type: "string", description: "YYYY-MM-DD de la cita a mover (opcional)" } }, required: ["datetime_iso"] },
      },
    },
  ]
}

// Busca el paciente por teléfono (solo lectura) y sus citas futuras.
async function findPatientByPhone(admin: Admin, clinicId: string, phone: string) {
  const { data } = await admin.from("profiles").select("id, full_name").eq("clinic_id", clinicId).eq("phone", phone).eq("role", "client").maybeSingle()
  return data || null
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upcomingByPhone(admin: Admin, clinicId: string, patientId: string, dateStr?: string): Promise<any[]> {
  let q = admin.from("appointments").select("id, scheduled_at, status, service:services(name)").eq("clinic_id", clinicId).eq("patient_id", patientId).neq("status", "cancelada").gte("scheduled_at", new Date().toISOString()).order("scheduled_at")
  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00")
    if (!isNaN(d.getTime())) q = q.gte("scheduled_at", startOfDay(d).toISOString()).lte("scheduled_at", endOfDay(d).toISOString())
  }
  const { data } = await q
  return data || []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any, ctx: AgentContext): Promise<string> {
  if (name === "list_services") {
    return JSON.stringify(
      ctx.services.map((s) => ({ servicio: s.name, duracion_min: s.duration_minutes, precio: s.price }))
    )
  }

  if (name === "check_availability") {
    const svc = ctx.services.find((s) => s.name.toLowerCase().includes(String(args?.service_name || "").toLowerCase()))
    const duration = args?.duration_minutes || svc?.duration_minutes || 60
    const slots = await checkAvailability(ctx.admin, ctx.clinicId, args?.date, duration)
    return JSON.stringify({ fecha: args?.date, horarios_disponibles: slots })
  }

  if (name === "book_appointment") {
    const svc = ctx.services.find((s) =>
      s.name.toLowerCase().includes(String(args?.service_name || "").toLowerCase())
    )
    if (!svc) return JSON.stringify({ ok: false, error: "Servicio no encontrado. Ofrece la lista de servicios." })
    const when = new Date(args?.datetime_iso)
    if (isNaN(when.getTime()) || isBefore(when, new Date()))
      return JSON.stringify({ ok: false, error: "Fecha/hora inválida o en el pasado." })

    // Verificar solapamiento
    const { data: nearby } = await ctx.admin
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("clinic_id", ctx.clinicId)
      .neq("status", "cancelada")
      .gte("scheduled_at", addMinutes(when, -240).toISOString())
      .lte("scheduled_at", addMinutes(when, 240).toISOString())
    const slotEnd = addMinutes(when, svc.duration_minutes)
    const taken = nearby?.some((a: { scheduled_at: string; duration_minutes: number }) => {
      const aStart = new Date(a.scheduled_at)
      const aEnd = addMinutes(aStart, a.duration_minutes)
      return isBefore(when, aEnd) && isAfter(slotEnd, aStart)
    })
    if (taken) return JSON.stringify({ ok: false, error: "Ese horario ya está ocupado. Ofrece otro." })

    const patient = await findOrCreatePatient(ctx.admin, ctx.clinicId, ctx.phone, ctx.pushname)
    const { error } = await ctx.admin.from("appointments").insert({
      clinic_id: ctx.clinicId,
      patient_id: patient.id,
      service_id: svc.id,
      scheduled_at: when.toISOString(),
      duration_minutes: svc.duration_minutes,
      price: svc.price,
      status: "pendiente",
      notes: "Agendada por el Agente IA (WhatsApp)",
    })
    if (error) return JSON.stringify({ ok: false, error: "No se pudo agendar, intenta otro horario." })
    return JSON.stringify({
      ok: true,
      mensaje: `Cita de ${svc.name} agendada para ${format(when, "dd/MM/yyyy HH:mm")} (queda pendiente de confirmación).`,
    })
  }

  if (name === "my_appointments") {
    const patient = await findPatientByPhone(ctx.admin, ctx.clinicId, ctx.phone)
    if (!patient) return JSON.stringify({ citas: [] })
    const appts = await upcomingByPhone(ctx.admin, ctx.clinicId, patient.id)
    return JSON.stringify({ citas: appts.map((a: { scheduled_at: string; status: string; service?: { name?: string } }) => ({ fecha: format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm"), servicio: a.service?.name || "—", estado: a.status })) })
  }

  if (name === "cancel_my_appointment") {
    const patient = await findPatientByPhone(ctx.admin, ctx.clinicId, ctx.phone)
    if (!patient) return JSON.stringify({ ok: false, error: "No encuentro citas asociadas a este número." })
    const appts = await upcomingByPhone(ctx.admin, ctx.clinicId, patient.id, args?.date)
    if (!appts.length) return JSON.stringify({ ok: false, error: "No tienes citas futuras." })
    if (appts.length > 1) return JSON.stringify({ ok: false, varias: appts.map((a: { scheduled_at: string }) => format(new Date(a.scheduled_at), "dd/MM HH:mm")), mensaje: "Tienes varias citas; indícame la fecha de la que quieres cancelar." })
    const { error } = await ctx.admin.from("appointments").update({ status: "cancelada" }).eq("id", appts[0].id)
    if (error) return JSON.stringify({ ok: false, error: "No se pudo cancelar." })
    return JSON.stringify({ ok: true, mensaje: `Tu cita del ${format(new Date(appts[0].scheduled_at), "dd/MM HH:mm")} fue cancelada.` })
  }

  if (name === "reschedule_my_appointment") {
    const when = new Date(args?.datetime_iso)
    if (isNaN(when.getTime()) || isBefore(when, new Date())) return JSON.stringify({ ok: false, error: "Fecha/hora inválida o en el pasado." })
    const patient = await findPatientByPhone(ctx.admin, ctx.clinicId, ctx.phone)
    if (!patient) return JSON.stringify({ ok: false, error: "No encuentro citas asociadas a este número." })
    const appts = await upcomingByPhone(ctx.admin, ctx.clinicId, patient.id, args?.date)
    if (!appts.length) return JSON.stringify({ ok: false, error: "No tienes citas futuras." })
    if (appts.length > 1) return JSON.stringify({ ok: false, varias: appts.map((a: { scheduled_at: string }) => format(new Date(a.scheduled_at), "dd/MM HH:mm")), mensaje: "Tienes varias citas; indícame cuál (fecha)." })
    const { error } = await ctx.admin.from("appointments").update({ scheduled_at: when.toISOString() }).eq("id", appts[0].id)
    if (error) return JSON.stringify({ ok: false, error: "No se pudo reagendar." })
    return JSON.stringify({ ok: true, mensaje: `Tu cita quedó reagendada para el ${format(when, "dd/MM/yyyy HH:mm")}.` })
  }

  return JSON.stringify({ error: "herramienta desconocida" })
}

function buildSystemPrompt(ctx: AgentContext): string {
  const nowStr = format(new Date(), "yyyy-MM-dd HH:mm (EEEE)")
  const serviceList = ctx.services
    .map((s) => `- ${s.name} (${s.duration_minutes} min, $${s.price ?? "—"})`)
    .join("\n")
  return `Eres el asistente virtual de la clínica estética "${ctx.clinicName}" y atiendes por WhatsApp.
Fecha y hora actual: ${nowStr} (zona horaria de Chile).
Responde SIEMPRE en español, de forma cálida, breve y profesional. Puedes usar emojis con moderación.

Servicios disponibles:
${serviceList || "(consulta con list_services)"}
${ctx.clinicAddress ? `Dirección: ${ctx.clinicAddress}` : ""}
${ctx.clinicPhone ? `Teléfono: ${ctx.clinicPhone}` : ""}

Tus capacidades (usa las herramientas):
- Informar precios, duración, ubicación y horarios.
- Consultar disponibilidad real (check_availability) antes de proponer horas.
- Agendar citas (book_appointment) tras confirmar servicio y fecha/hora.
- Mostrar las citas del paciente (my_appointments), cancelarlas (cancel_my_appointment) o reagendarlas (reschedule_my_appointment).
Reglas:
- No inventes horarios ni precios: usa las herramientas.
- Para agendar, confirma servicio y horario, verifica disponibilidad y luego agenda.
- Para cancelar/reagendar, si la persona tiene varias citas, pregunta cuál (por fecha).
- Sé honesto si algo no está disponible.`
}

// Ejecuta el agente: recibe el historial y el mensaje nuevo, devuelve la respuesta de texto.
export async function runAgentReply(opts: {
  clinic: { id: string; name: string }
  phone: string
  pushname?: string
  history: ChatMessage[]
  userText: string
  model?: string
  temperature?: number
}): Promise<string> {
  const admin = createAdminClient()
  const [services, { data: clinicInfo }] = await Promise.all([
    getActiveServices(admin, opts.clinic.id),
    admin.from("clinics").select("address, phone").eq("id", opts.clinic.id).maybeSingle(),
  ])
  const ctx: AgentContext = {
    admin,
    clinicId: opts.clinic.id,
    clinicName: opts.clinic.name,
    clinicAddress: clinicInfo?.address,
    clinicPhone: clinicInfo?.phone,
    phone: opts.phone,
    pushname: opts.pushname,
    services,
  }

  const tools = buildTools()
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(ctx) },
    ...opts.history,
    { role: "user", content: opts.userText },
  ]

  for (let i = 0; i < 4; i++) {
    const resp = await groqChat({ messages, model: opts.model, temperature: opts.temperature, tools })
    if (resp.tool_calls && resp.tool_calls.length) {
      messages.push({ role: "assistant", content: resp.content ?? "", tool_calls: resp.tool_calls })
      for (const tc of resp.tool_calls) {
        let args = {}
        try { args = JSON.parse(tc.function?.arguments || "{}") } catch { /* noop */ }
        const out = await executeTool(tc.function?.name, args, ctx)
        messages.push({ role: "tool", tool_call_id: tc.id, name: tc.function?.name, content: out })
      }
      continue
    }
    return resp.content || "¿Podrías repetirme eso, por favor? 🙏"
  }
  return "Estoy procesando tu solicitud, en un momento te confirmo. 🙌"
}

export { resolveClinic }
