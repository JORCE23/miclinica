import { addMinutes, isAfter, isBefore, startOfDay, endOfDay, format } from "date-fns"
import { randomBytes } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { groqChat, type ChatMessage, type ToolDef } from "@/lib/ai/groq"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

type Ctx = {
  admin: Admin
  clinicId: string
  clinicName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  professionals: any[]
}

function buildTools(): ToolDef[] {
  return [
    {
      type: "function",
      function: { name: "listar_servicios", description: "Lista los servicios de la clínica con duración y precio.", parameters: { type: "object", properties: {} } },
    },
    {
      type: "function",
      function: {
        name: "buscar_paciente",
        description: "Busca pacientes por nombre, RUT o teléfono.",
        parameters: { type: "object", properties: { query: { type: "string", description: "Texto a buscar" } }, required: ["query"] },
      },
    },
    {
      type: "function",
      function: {
        name: "listar_citas",
        description: "Lista las citas de un día (por defecto hoy) con paciente y servicio.",
        parameters: { type: "object", properties: { date: { type: "string", description: "Fecha YYYY-MM-DD (opcional, por defecto hoy)" } } },
      },
    },
    {
      type: "function",
      function: {
        name: "crear_paciente",
        description: "Crea un paciente nuevo en la clínica.",
        parameters: {
          type: "object",
          properties: {
            full_name: { type: "string" }, rut: { type: "string" }, phone: { type: "string" }, email: { type: "string" },
          },
          required: ["full_name"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "crear_cita",
        description: "Agenda una cita. Antes de llamar, asegúrate de tener: paciente, servicio, fecha y hora. Si falta el profesional, pregúntalo.",
        parameters: {
          type: "object",
          properties: {
            patient_query: { type: "string", description: "Nombre o RUT del paciente (debe existir; si no, usa crear_paciente primero)" },
            service_name: { type: "string", description: "Nombre del servicio" },
            datetime_iso: { type: "string", description: "Fecha y hora ISO, ej 2026-06-20T15:00:00" },
            duration_minutes: { type: "number", description: "Duración (opcional; por defecto la del servicio)" },
            professional_name: { type: "string", description: "Profesional a cargo (opcional)" },
          },
          required: ["patient_query", "service_name", "datetime_iso"],
        },
      },
    },
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findPatient(ctx: Ctx, query: string): Promise<any | null> {
  const q = (query || "").trim()
  if (!q) return null
  const { data } = await ctx.admin
    .from("profiles")
    .select("id, full_name, rut, phone")
    .eq("clinic_id", ctx.clinicId)
    .eq("role", "client")
    .or(`full_name.ilike.%${q}%,rut.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(5)
  return data || []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any, ctx: Ctx): Promise<string> {
  if (name === "listar_servicios") {
    return JSON.stringify(ctx.services.map((s) => ({ servicio: s.name, duracion_min: s.duration_minutes, precio: s.price })))
  }

  if (name === "buscar_paciente") {
    const found = await findPatient(ctx, args?.query)
    if (!found || !found.length) return JSON.stringify({ encontrados: 0, mensaje: "No hay pacientes con ese criterio." })
    return JSON.stringify({ encontrados: found.length, pacientes: found })
  }

  if (name === "listar_citas") {
    const dateStr = args?.date || format(new Date(), "yyyy-MM-dd")
    const target = new Date(dateStr + "T00:00:00")
    if (isNaN(target.getTime())) return JSON.stringify({ error: "Fecha inválida" })
    const { data } = await ctx.admin
      .from("appointments")
      .select("scheduled_at, status, duration_minutes, patient:profiles!appointments_patient_id_fkey(full_name), service:services(name)")
      .eq("clinic_id", ctx.clinicId)
      .gte("scheduled_at", startOfDay(target).toISOString())
      .lte("scheduled_at", endOfDay(target).toISOString())
      .neq("status", "cancelada")
      .order("scheduled_at")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const citas = (data || []).map((a: any) => ({
      hora: format(new Date(a.scheduled_at), "HH:mm"),
      paciente: a.patient?.full_name || "—",
      servicio: a.service?.name || "—",
      estado: a.status,
    }))
    return JSON.stringify({ fecha: dateStr, total: citas.length, citas })
  }

  if (name === "crear_paciente") {
    const fullName = (args?.full_name || "").trim()
    if (!fullName) return JSON.stringify({ ok: false, error: "Falta el nombre." })
    const email = (args?.email || "").trim() || `pac${randomBytes(4).toString("hex")}@wa.medique.app`
    const password = randomBytes(9).toString("hex") + "A1!"
    const { data: authData, error: authErr } = await ctx.admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role: "client", full_name: fullName },
    })
    if (authErr || !authData?.user) return JSON.stringify({ ok: false, error: "No se pudo crear el paciente (¿email repetido?)." })
    const { error } = await ctx.admin.from("profiles").insert({
      id: authData.user.id, clinic_id: ctx.clinicId, role: "client", full_name: fullName,
      rut: args?.rut || null, phone: args?.phone || null, email, source: "directo",
    })
    if (error) return JSON.stringify({ ok: false, error: error.message })
    return JSON.stringify({ ok: true, paciente: { id: authData.user.id, full_name: fullName } })
  }

  if (name === "crear_cita") {
    const found = await findPatient(ctx, args?.patient_query)
    if (!found || !found.length) return JSON.stringify({ ok: false, error: "No encontré ese paciente. Usa crear_paciente o pide más datos." })
    if (found.length > 1) return JSON.stringify({ ok: false, varios: found.map((p: { full_name: string; rut: string }) => ({ nombre: p.full_name, rut: p.rut })), mensaje: "Hay varios pacientes. Pide cuál es (por RUT)." })
    const patient = found[0]

    const svc = ctx.services.find((s) => s.name.toLowerCase().includes(String(args?.service_name || "").toLowerCase()))
    if (!svc) return JSON.stringify({ ok: false, error: "Servicio no encontrado. Ofrece la lista con listar_servicios." })

    const when = new Date(args?.datetime_iso)
    if (isNaN(when.getTime()) || isBefore(when, new Date())) return JSON.stringify({ ok: false, error: "Fecha/hora inválida o en el pasado." })
    const duration = args?.duration_minutes || svc.duration_minutes || 60

    let professionalId: string | null = null
    if (args?.professional_name) {
      const prof = ctx.professionals.find((p) => p.full_name.toLowerCase().includes(String(args.professional_name).toLowerCase()))
      professionalId = prof?.id || null
    }

    // Solapamiento
    const { data: nearby } = await ctx.admin
      .from("appointments")
      .select("scheduled_at, duration_minutes")
      .eq("clinic_id", ctx.clinicId)
      .neq("status", "cancelada")
      .gte("scheduled_at", addMinutes(when, -240).toISOString())
      .lte("scheduled_at", addMinutes(when, 240).toISOString())
    const slotEnd = addMinutes(when, duration)
    const taken = nearby?.some((a: { scheduled_at: string; duration_minutes: number }) => {
      const aStart = new Date(a.scheduled_at)
      return isBefore(when, addMinutes(aStart, a.duration_minutes)) && isAfter(slotEnd, aStart)
    })
    if (taken) return JSON.stringify({ ok: false, error: "Ese horario ya está ocupado. Ofrece otro." })

    const { error } = await ctx.admin.from("appointments").insert({
      clinic_id: ctx.clinicId, patient_id: patient.id, service_id: svc.id,
      professional_id: professionalId, scheduled_at: when.toISOString(),
      duration_minutes: duration, price: svc.price, status: "confirmada",
      notes: "Agendada por el Copilot",
    })
    if (error) return JSON.stringify({ ok: false, error: error.message })
    return JSON.stringify({ ok: true, mensaje: `Cita de ${svc.name} para ${patient.full_name} el ${format(when, "dd/MM/yyyy HH:mm")} agendada.` })
  }

  return JSON.stringify({ error: "herramienta desconocida" })
}

function buildSystemPrompt(ctx: Ctx): string {
  const nowStr = format(new Date(), "yyyy-MM-dd HH:mm (EEEE)")
  // Limitar el listado en el prompt para no saturar tokens; el resto se consulta con la herramienta.
  const shownServices = ctx.services.slice(0, 30)
  const servicios = shownServices.map((s) => `- ${s.name} (${s.duration_minutes} min, $${s.price ?? "—"})`).join("\n")
    + (ctx.services.length > shownServices.length ? `\n(…y ${ctx.services.length - shownServices.length} más; usa listar_servicios para el catálogo completo)` : "")
  const profes = ctx.professionals.slice(0, 20).map((p) => `- ${p.full_name}${p.specialty ? ` (${p.specialty})` : ""}`).join("\n")
  return `Eres "Copilot", el asistente interno del equipo de la clínica estética "${ctx.clinicName}".
Fecha y hora actual: ${nowStr} (Chile).
Ayudas al personal a operar la clínica y PUEDES EJECUTAR ACCIONES con las herramientas: buscar pacientes, listar citas del día, crear pacientes y agendar citas.

Servicios:
${servicios || "(usa listar_servicios)"}

Profesionales:
${profes || "(sin profesionales cargados)"}

Reglas:
- Responde SIEMPRE en español, breve y claro.
- Antes de agendar una cita necesitas: paciente (que exista), servicio, fecha y hora. Si falta algún dato, PREGÚNTALO; no inventes.
- Si te piden agendar y no mencionan el profesional, pregunta cuál profesional atenderá.
- Si el paciente no existe, ofrece crearlo (pide nombre y, si puede, RUT/teléfono).
- Usa las herramientas para datos reales; no inventes citas, precios ni disponibilidad.
- Confirma con un resumen lo que hiciste (ej. "Listo, agendé…").`
}

export async function runCopilotReply(opts: {
  clinicId: string
  clinicName: string
  history: ChatMessage[]
  userText: string
  model?: string
}): Promise<string> {
  const admin = createAdminClient()
  const [{ data: services }, { data: professionals }] = await Promise.all([
    admin.from("services").select("id, name, duration_minutes, price").eq("clinic_id", opts.clinicId).eq("is_active", true).order("name"),
    admin.from("professionals").select("id, full_name, specialty").eq("clinic_id", opts.clinicId).eq("is_active", true).order("full_name"),
  ])

  const ctx: Ctx = { admin, clinicId: opts.clinicId, clinicName: opts.clinicName, services: services || [], professionals: professionals || [] }
  const tools = buildTools()
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(ctx) },
    ...opts.history,
    { role: "user", content: opts.userText },
  ]

  for (let i = 0; i < 5; i++) {
    const resp = await groqChat({ messages, model: opts.model, temperature: 0.3, tools })
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
    return resp.content || "¿Me lo repites, por favor?"
  }
  return "Estoy procesando varias cosas a la vez, ¿me confirmas el último dato?"
}
