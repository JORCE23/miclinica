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
  userId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  services: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  professionals: any[]
}

const STATUSES = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"]

function buildTools(): ToolDef[] {
  const o = (properties: Record<string, unknown>, required?: string[]) => ({ type: "object", properties, ...(required ? { required } : {}) })
  return [
    { type: "function", function: { name: "listar_servicios", description: "Lista los servicios de la clínica con duración y precio.", parameters: o({}) } },
    { type: "function", function: { name: "buscar_paciente", description: "Busca pacientes por nombre, RUT o teléfono.", parameters: o({ query: { type: "string" } }, ["query"]) } },
    { type: "function", function: { name: "info_paciente", description: "Ficha rápida de un paciente: alergias, próxima cita y puntos de fidelidad.", parameters: o({ patient_query: { type: "string" } }, ["patient_query"]) } },
    { type: "function", function: { name: "listar_citas", description: "Lista las citas de un día (por defecto hoy) con paciente y servicio.", parameters: o({ date: { type: "string", description: "YYYY-MM-DD (opcional)" } }) } },
    { type: "function", function: { name: "consultar_disponibilidad", description: "Horarios libres para una fecha (respeta el horario de atención).", parameters: o({ date: { type: "string", description: "YYYY-MM-DD" }, duration_minutes: { type: "number" } }, ["date"]) } },
    { type: "function", function: { name: "crear_paciente", description: "Crea un paciente nuevo.", parameters: o({ full_name: { type: "string" }, rut: { type: "string" }, phone: { type: "string" }, email: { type: "string" } }, ["full_name"]) } },
    { type: "function", function: { name: "crear_cita", description: "Agenda una cita. Necesitas paciente (existente), servicio, fecha y hora. Si falta el profesional, pregúntalo.", parameters: o({ patient_query: { type: "string" }, service_name: { type: "string" }, datetime_iso: { type: "string" }, duration_minutes: { type: "number" }, professional_name: { type: "string" } }, ["patient_query", "service_name", "datetime_iso"]) } },
    { type: "function", function: { name: "cancelar_cita", description: "Cancela una cita futura de un paciente. Si tiene varias, indica la fecha (date).", parameters: o({ patient_query: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD de la cita a cancelar (opcional)" } }, ["patient_query"]) } },
    { type: "function", function: { name: "reagendar_cita", description: "Cambia la fecha/hora de la próxima cita de un paciente.", parameters: o({ patient_query: { type: "string" }, new_datetime_iso: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD de la cita a mover (si tiene varias)" } }, ["patient_query", "new_datetime_iso"]) } },
    { type: "function", function: { name: "marcar_estado_cita", description: "Cambia el estado de una cita (confirmada, completada, no_asistio, cancelada).", parameters: o({ patient_query: { type: "string" }, estado: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD (opcional)" } }, ["patient_query", "estado"]) } },
    { type: "function", function: { name: "registrar_movimiento_caja", description: "Registra un ingreso o egreso en la caja.", parameters: o({ tipo: { type: "string", description: "ingreso | egreso" }, monto: { type: "number" }, metodo: { type: "string", description: "efectivo, debito, credito, transferencia" }, concepto: { type: "string" } }, ["tipo", "monto"]) } },
    { type: "function", function: { name: "crear_pendiente", description: "Crea una tarea/pendiente para el equipo.", parameters: o({ titulo: { type: "string" }, prioridad: { type: "string", description: "baja | normal | alta" }, fecha: { type: "string", description: "YYYY-MM-DD límite (opcional)" } }, ["titulo"]) } },
    { type: "function", function: { name: "resumen_dia", description: "Resumen del día: citas por estado e ingresos.", parameters: o({ date: { type: "string", description: "YYYY-MM-DD (opcional)" } }) } },
  ]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findPatient(ctx: Ctx, query: string): Promise<any[]> {
  const q = (query || "").replace(/[(),]/g, " ").trim()
  if (!q) return []
  const { data } = await ctx.admin
    .from("profiles").select("id, full_name, rut, phone")
    .eq("clinic_id", ctx.clinicId).eq("role", "client")
    .or(`full_name.ilike.%${q}%,rut.ilike.%${q}%,phone.ilike.%${q}%`).limit(5)
  return data || []
}

// Citas futuras de un paciente (opcionalmente filtradas por día)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upcomingAppointments(ctx: Ctx, patientId: string, dateStr?: string): Promise<any[]> {
  let q = ctx.admin
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, service:services(name)")
    .eq("clinic_id", ctx.clinicId).eq("patient_id", patientId)
    .neq("status", "cancelada").gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at")
  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00")
    if (!isNaN(d.getTime())) q = q.gte("scheduled_at", startOfDay(d).toISOString()).lte("scheduled_at", endOfDay(d).toISOString())
  }
  const { data } = await q
  return data || []
}

async function checkAvailability(ctx: Ctx, dateStr: string, duration = 60): Promise<string[]> {
  const targetDate = new Date(dateStr + "T00:00:00")
  if (isNaN(targetDate.getTime())) return []
  const { data: sched } = await ctx.admin.from("clinic_schedules").select("is_open, open_time, close_time").eq("clinic_id", ctx.clinicId).eq("day_of_week", targetDate.getDay()).maybeSingle()
  if (sched && sched.is_open === false) return []
  const [openH, openM] = (sched?.open_time || "09:00").split(":").map(Number)
  const [closeH, closeM] = (sched?.close_time || "18:00").split(":").map(Number)
  const { data: appts } = await ctx.admin.from("appointments").select("scheduled_at, duration_minutes").eq("clinic_id", ctx.clinicId).gte("scheduled_at", startOfDay(targetDate).toISOString()).lte("scheduled_at", endOfDay(targetDate).toISOString()).neq("status", "cancelada")
  const slots: string[] = []
  const cursor = new Date(targetDate); cursor.setHours(openH, openM || 0, 0, 0)
  const dayEnd = new Date(targetDate); dayEnd.setHours(closeH, closeM || 0, 0, 0)
  const now = new Date()
  while (!isAfter(addMinutes(cursor, duration), dayEnd)) {
    const s = new Date(cursor); const e = addMinutes(s, duration)
    if (isAfter(s, now)) {
      const overlap = appts?.some((a: { scheduled_at: string; duration_minutes: number }) => isBefore(s, addMinutes(new Date(a.scheduled_at), a.duration_minutes)) && isAfter(e, new Date(a.scheduled_at)))
      if (!overlap) slots.push(format(s, "HH:mm"))
    }
    cursor.setTime(addMinutes(cursor, 30).getTime())
  }
  return slots
}

// Resuelve "1 paciente o pide aclaración" para acciones sobre citas
async function resolveSingleAppt(ctx: Ctx, patientQuery: string, dateStr?: string) {
  const found = await findPatient(ctx, patientQuery)
  if (!found.length) return { error: "No encontré ese paciente." }
  if (found.length > 1) return { error: "Hay varios pacientes con ese nombre. Pide el RUT para identificarlo." }
  const patient = found[0]
  const appts = await upcomingAppointments(ctx, patient.id, dateStr)
  if (!appts.length) return { error: `${patient.full_name} no tiene citas futuras${dateStr ? " en esa fecha" : ""}.` }
  if (appts.length > 1) {
    return { error: `${patient.full_name} tiene varias citas. ¿Cuál? ` + appts.map((a: { scheduled_at: string; service?: { name?: string } }) => `${format(new Date(a.scheduled_at), "dd/MM HH:mm")} (${a.service?.name || "—"})`).join(", ") }
  }
  return { patient, appt: appts[0] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any, ctx: Ctx): Promise<string> {
  const J = (x: unknown) => JSON.stringify(x)

  if (name === "listar_servicios") return J(ctx.services.map((s) => ({ servicio: s.name, duracion_min: s.duration_minutes, precio: s.price })))

  if (name === "buscar_paciente") {
    const f = await findPatient(ctx, args?.query)
    return f.length ? J({ encontrados: f.length, pacientes: f }) : J({ encontrados: 0 })
  }

  if (name === "info_paciente") {
    const f = await findPatient(ctx, args?.patient_query)
    if (!f.length) return J({ error: "Paciente no encontrado" })
    if (f.length > 1) return J({ varios: f.map((p: { full_name: string; rut: string }) => ({ nombre: p.full_name, rut: p.rut })) })
    const p = f[0]
    const [{ data: allergies }, { data: loyalty }, next] = await Promise.all([
      ctx.admin.from("allergies").select("allergen, severity").eq("patient_id", p.id),
      ctx.admin.from("loyalty_accounts").select("total_points").eq("patient_id", p.id).maybeSingle(),
      upcomingAppointments(ctx, p.id),
    ])
    return J({
      paciente: p.full_name, rut: p.rut, telefono: p.phone,
      alergias: (allergies || []).map((a: { allergen: string; severity: string }) => `${a.allergen} (${a.severity})`),
      puntos_fidelidad: loyalty?.total_points ?? 0,
      proxima_cita: next[0] ? `${format(new Date(next[0].scheduled_at), "dd/MM/yyyy HH:mm")} - ${next[0].service?.name || "—"}` : "sin citas futuras",
    })
  }

  if (name === "listar_citas") {
    const dateStr = args?.date || format(new Date(), "yyyy-MM-dd")
    const target = new Date(dateStr + "T00:00:00")
    if (isNaN(target.getTime())) return J({ error: "Fecha inválida" })
    const { data } = await ctx.admin.from("appointments")
      .select("scheduled_at, status, patient:profiles!appointments_patient_id_fkey(full_name), service:services(name)")
      .eq("clinic_id", ctx.clinicId).gte("scheduled_at", startOfDay(target).toISOString()).lte("scheduled_at", endOfDay(target).toISOString())
      .neq("status", "cancelada").order("scheduled_at")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const citas = (data || []).map((a: any) => ({ hora: format(new Date(a.scheduled_at), "HH:mm"), paciente: a.patient?.full_name || "—", servicio: a.service?.name || "—", estado: a.status }))
    return J({ fecha: dateStr, total: citas.length, citas })
  }

  if (name === "consultar_disponibilidad") {
    const svc = ctx.services.find((s) => s.name.toLowerCase().includes(String(args?.service_name || "").toLowerCase()))
    const dur = args?.duration_minutes || svc?.duration_minutes || 60
    return J({ fecha: args?.date, horarios_libres: await checkAvailability(ctx, args?.date, dur) })
  }

  if (name === "crear_paciente") {
    const fullName = (args?.full_name || "").trim()
    if (!fullName) return J({ ok: false, error: "Falta el nombre." })
    const email = (args?.email || "").trim() || `pac${randomBytes(4).toString("hex")}@wa.medique.app`
    const password = randomBytes(9).toString("hex") + "A1!"
    const { data: au, error: ae } = await ctx.admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: "client", full_name: fullName } })
    if (ae || !au?.user) return J({ ok: false, error: "No se pudo crear (¿email repetido?)." })
    const { error } = await ctx.admin.from("profiles").insert({ id: au.user.id, clinic_id: ctx.clinicId, role: "client", full_name: fullName, rut: args?.rut || null, phone: args?.phone || null, email, source: "directo" })
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, paciente: { id: au.user.id, full_name: fullName } })
  }

  if (name === "crear_cita") {
    const f = await findPatient(ctx, args?.patient_query)
    if (!f.length) return J({ ok: false, error: "No encontré ese paciente. Usa crear_paciente o pide más datos." })
    if (f.length > 1) return J({ ok: false, varios: f.map((p: { full_name: string; rut: string }) => ({ nombre: p.full_name, rut: p.rut })) })
    const patient = f[0]
    const svc = ctx.services.find((s) => s.name.toLowerCase().includes(String(args?.service_name || "").toLowerCase()))
    if (!svc) return J({ ok: false, error: "Servicio no encontrado." })
    const when = new Date(args?.datetime_iso)
    if (isNaN(when.getTime()) || isBefore(when, new Date())) return J({ ok: false, error: "Fecha/hora inválida o en el pasado." })
    const duration = args?.duration_minutes || svc.duration_minutes || 60
    let professionalId: string | null = null
    if (args?.professional_name) professionalId = ctx.professionals.find((p) => p.full_name.toLowerCase().includes(String(args.professional_name).toLowerCase()))?.id || null
    const { data: nearby } = await ctx.admin.from("appointments").select("scheduled_at, duration_minutes").eq("clinic_id", ctx.clinicId).neq("status", "cancelada").gte("scheduled_at", addMinutes(when, -240).toISOString()).lte("scheduled_at", addMinutes(when, 240).toISOString())
    const slotEnd = addMinutes(when, duration)
    if (nearby?.some((a: { scheduled_at: string; duration_minutes: number }) => isBefore(when, addMinutes(new Date(a.scheduled_at), a.duration_minutes)) && isAfter(slotEnd, new Date(a.scheduled_at)))) return J({ ok: false, error: "Ese horario ya está ocupado." })
    const { error } = await ctx.admin.from("appointments").insert({ clinic_id: ctx.clinicId, patient_id: patient.id, service_id: svc.id, professional_id: professionalId, scheduled_at: when.toISOString(), duration_minutes: duration, price: svc.price, status: "confirmada", notes: "Agendada por el Copilot" })
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `Cita de ${svc.name} para ${patient.full_name} el ${format(when, "dd/MM/yyyy HH:mm")} agendada.` })
  }

  if (name === "cancelar_cita") {
    const r = await resolveSingleAppt(ctx, args?.patient_query, args?.date)
    if (r.error) return J({ ok: false, error: r.error })
    const { error } = await ctx.admin.from("appointments").update({ status: "cancelada" }).eq("id", r.appt.id)
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `Cita de ${r.patient.full_name} del ${format(new Date(r.appt.scheduled_at), "dd/MM HH:mm")} cancelada.` })
  }

  if (name === "reagendar_cita") {
    const when = new Date(args?.new_datetime_iso)
    if (isNaN(when.getTime()) || isBefore(when, new Date())) return J({ ok: false, error: "Nueva fecha/hora inválida o en el pasado." })
    const r = await resolveSingleAppt(ctx, args?.patient_query, args?.date)
    if (r.error) return J({ ok: false, error: r.error })
    const { error } = await ctx.admin.from("appointments").update({ scheduled_at: when.toISOString() }).eq("id", r.appt.id)
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `Cita de ${r.patient.full_name} movida a ${format(when, "dd/MM/yyyy HH:mm")}.` })
  }

  if (name === "marcar_estado_cita") {
    const estado = String(args?.estado || "").toLowerCase()
    if (!STATUSES.includes(estado)) return J({ ok: false, error: `Estado inválido. Usa: ${STATUSES.join(", ")}.` })
    const r = await resolveSingleAppt(ctx, args?.patient_query, args?.date)
    if (r.error) return J({ ok: false, error: r.error })
    const { error } = await ctx.admin.from("appointments").update({ status: estado }).eq("id", r.appt.id)
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `Cita de ${r.patient.full_name} marcada como ${estado}.` })
  }

  if (name === "registrar_movimiento_caja") {
    const tipo = String(args?.tipo || "").toLowerCase()
    if (!["ingreso", "egreso"].includes(tipo)) return J({ ok: false, error: "tipo debe ser ingreso o egreso." })
    const monto = Number(args?.monto)
    if (!monto || monto <= 0) return J({ ok: false, error: "Monto inválido." })
    const { error } = await ctx.admin.from("cash_movements").insert({ clinic_id: ctx.clinicId, type: tipo, amount: monto, method: args?.metodo || null, concept: args?.concepto || null, created_by: ctx.userId || null })
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `${tipo === "ingreso" ? "Ingreso" : "Egreso"} de $${monto.toLocaleString("es-CL")} registrado en caja.` })
  }

  if (name === "crear_pendiente") {
    const titulo = (args?.titulo || "").trim()
    if (!titulo) return J({ ok: false, error: "Falta el título." })
    const prioridad = ["baja", "normal", "alta"].includes(args?.prioridad) ? args.prioridad : "normal"
    const { error } = await ctx.admin.from("tasks").insert({ clinic_id: ctx.clinicId, title: titulo, priority: prioridad, due_date: args?.fecha || null, created_by: ctx.userId || null })
    if (error) return J({ ok: false, error: error.message })
    return J({ ok: true, mensaje: `Pendiente "${titulo}" creado.` })
  }

  if (name === "resumen_dia") {
    const dateStr = args?.date || format(new Date(), "yyyy-MM-dd")
    const target = new Date(dateStr + "T00:00:00")
    if (isNaN(target.getTime())) return J({ error: "Fecha inválida" })
    const ini = startOfDay(target).toISOString(); const fin = endOfDay(target).toISOString()
    const [{ data: appts }, { data: cash }] = await Promise.all([
      ctx.admin.from("appointments").select("status").eq("clinic_id", ctx.clinicId).gte("scheduled_at", ini).lte("scheduled_at", fin),
      ctx.admin.from("cash_movements").select("type, amount").eq("clinic_id", ctx.clinicId).gte("created_at", ini).lte("created_at", fin),
    ])
    const porEstado: Record<string, number> = {}
    for (const a of appts || []) porEstado[a.status] = (porEstado[a.status] || 0) + 1
    let ingresos = 0, egresos = 0
    for (const c of cash || []) { if (c.type === "ingreso") ingresos += Number(c.amount); else egresos += Number(c.amount) }
    return J({ fecha: dateStr, total_citas: (appts || []).length, por_estado: porEstado, ingresos, egresos, neto: ingresos - egresos })
  }

  return J({ error: "herramienta desconocida" })
}

function buildSystemPrompt(ctx: Ctx): string {
  const nowStr = format(new Date(), "yyyy-MM-dd HH:mm (EEEE)")
  const shown = ctx.services.slice(0, 30)
  const servicios = shown.map((s) => `- ${s.name} (${s.duration_minutes} min, $${s.price ?? "—"})`).join("\n")
    + (ctx.services.length > shown.length ? `\n(…y ${ctx.services.length - shown.length} más; usa listar_servicios)` : "")
  const profes = ctx.professionals.slice(0, 20).map((p) => `- ${p.full_name}${p.specialty ? ` (${p.specialty})` : ""}`).join("\n")
  return `Eres "Copilot", el asistente interno del equipo de la clínica estética "${ctx.clinicName}".
Fecha y hora actual: ${nowStr} (Chile). Responde SIEMPRE en español, breve y claro.

PUEDES EJECUTAR ACCIONES con tus herramientas:
- Pacientes: buscar_paciente, info_paciente, crear_paciente.
- Agenda: listar_citas, consultar_disponibilidad, crear_cita, cancelar_cita, reagendar_cita, marcar_estado_cita.
- Caja: registrar_movimiento_caja (ingresos/egresos).
- Equipo: crear_pendiente (tareas), resumen_dia (citas e ingresos del día).
- Catálogo: listar_servicios.

Servicios:
${servicios || "(usa listar_servicios)"}

Profesionales:
${profes || "(sin profesionales)"}

Reglas:
- Si falta un dato para una acción (paciente, servicio, fecha/hora, profesional, monto…), PREGÚNTALO; no inventes.
- Antes de agendar, si no mencionan el profesional, pregúntalo.
- Para cancelar/reagendar/marcar, si el paciente tiene varias citas, pregunta cuál (por fecha).
- Confirma siempre con un resumen de lo que hiciste.
- No inventes datos clínicos, precios ni disponibilidad: usa las herramientas.`
}

export async function runCopilotReply(opts: {
  clinicId: string
  clinicName: string
  userId?: string
  history: ChatMessage[]
  userText: string
  model?: string
}): Promise<string> {
  const admin = createAdminClient()
  const [{ data: services }, { data: professionals }] = await Promise.all([
    admin.from("services").select("id, name, duration_minutes, price").eq("clinic_id", opts.clinicId).eq("is_active", true).order("name"),
    admin.from("professionals").select("id, full_name, specialty").eq("clinic_id", opts.clinicId).eq("is_active", true).order("full_name"),
  ])

  const ctx: Ctx = { admin, clinicId: opts.clinicId, clinicName: opts.clinicName, userId: opts.userId, services: services || [], professionals: professionals || [] }
  const tools = buildTools()
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(ctx) },
    ...opts.history,
    { role: "user", content: opts.userText },
  ]

  for (let i = 0; i < 6; i++) {
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
  return "Hice varias acciones; ¿me confirmas el último dato para terminar?"
}
