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
  ]
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

Tus capacidades:
- Informar precios, duración, horarios y ubicación.
- Consultar disponibilidad real con la herramienta check_availability antes de proponer horas.
- Agendar citas con book_appointment SOLO después de confirmar el servicio y la fecha/hora con la persona.
Reglas:
- No inventes horarios ni precios: usa las herramientas.
- Si la persona quiere agendar, primero confirma servicio y horario, verifica disponibilidad y luego agenda.
- El horario de atención es de 09:00 a 18:00. Sé honesto si algo no está disponible.`
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
  const services = await getActiveServices(admin, opts.clinic.id)
  const ctx: AgentContext = {
    admin,
    clinicId: opts.clinic.id,
    clinicName: opts.clinic.name,
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
