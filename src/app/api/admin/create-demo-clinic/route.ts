import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Cliente service-role: crea usuarios y escribe saltando RLS (igual que professionals/create-account)
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_SLUG = "clinica-demo"
const DEMO_EMAIL = "demo@miclinica.cl"
const DEMO_PASSWORD = "DemoMedique2026"

// ── helpers ────────────────────────────────────────────────────────────────
const day = (offset: number, h = 10, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d
}
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]

// ── borra por completo una clínica demo previa (reset) ──────────────────────
async function resetDemo(clinicId: string) {
  // Orden por dependencias de FK (service-role salta RLS)
  const childTables = [
    "loyalty_transactions", "loyalty_accounts", "appointments",
    "medical_history", "allergies", "aesthetic_procedures_history",
    "inventory_movements", "inventory_products", "cash_movements",
    "whatsapp_messages", "tasks", "collaborations", "clinic_schedules",
    "campaigns", "services", "professionals",
  ]
  for (const t of childTables) {
    await admin.from(t).delete().eq("clinic_id", clinicId)
  }
  // Borrar usuarios auth (la fila profiles cae en cascada por FK a auth.users)
  const { data: profs } = await admin.from("profiles").select("id").eq("clinic_id", clinicId)
  for (const p of profs || []) {
    await admin.auth.admin.deleteUser(p.id).catch(() => {})
  }
  await admin.from("clinic_schedules").delete().eq("clinic_id", clinicId)
  await admin.from("clinics").delete().eq("id", clinicId)
}

export async function POST(request: Request) {
  // Protección por secreto
  const secret = process.env.DEMO_SECRET || process.env.CRON_SECRET
  const provided = request.headers.get("x-demo-secret") || new URL(request.url).searchParams.get("secret")
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "No autorizado (DEMO_SECRET)" }, { status: 401 })
  }

  try {
    // 0. Reset si ya existe
    const { data: existing } = await admin.from("clinics").select("id").eq("slug", DEMO_SLUG).maybeSingle()
    if (existing) await resetDemo(existing.id)

    // 1. Clínica
    const { data: clinic, error: clinicErr } = await admin
      .from("clinics")
      .insert({
        name: "Clínica Demo Estética",
        slug: DEMO_SLUG,
        address: "Av. Providencia 1234, Santiago",
        phone: "+56 9 1111 2222",
        email: "contacto@clinica-demo.cl",
        is_active: true,
      })
      .select("id")
      .single()
    if (clinicErr) throw new Error("clinics: " + clinicErr.message)
    const clinicId = clinic.id

    // 2. Admin demo
    const { data: adminUser, error: adminErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
      user_metadata: { full_name: "Dra. Demo Admin" },
    })
    if (adminErr) throw new Error("admin user: " + adminErr.message)
    const adminId = adminUser.user.id
    await admin.from("profiles").upsert({
      id: adminId, clinic_id: clinicId, role: "clinic_admin",
      full_name: "Dra. Demo Admin", email: DEMO_EMAIL, phone: "+56 9 1111 2222", is_active: true,
    })

    // 3. Horarios (Lun-Vie 09-19, Sáb 10-14, Dom cerrado)
    await admin.from("clinic_schedules").insert(
      [0, 1, 2, 3, 4, 5, 6].map((d) => ({
        clinic_id: clinicId, day_of_week: d,
        is_open: d !== 0,
        open_time: d === 6 ? "10:00" : "09:00",
        close_time: d === 6 ? "14:00" : "19:00",
      }))
    )

    // 4. Profesionales
    const professionals = [
      { full_name: "Dra. Camila Rojas", specialty: "Médico Estético" },
      { full_name: "Dr. Andrés Soto", specialty: "Cirujano Dermatólogo" },
      { full_name: "Enf. Paula Méndez", specialty: "Enfermera Universitaria" },
      { full_name: "TENS Javier Lillo", specialty: "Técnico Paramédico" },
    ]
    await admin.from("professionals").insert(
      professionals.map((p) => ({ clinic_id: clinicId, ...p, is_active: true }))
    )

    // 5. Servicios
    const services = [
      { name: "Toxina botulínica (Botox)", section: "facial", category: "Toxina", duration_minutes: 30, price: 180000 },
      { name: "Ácido hialurónico labios", section: "facial", category: "Ácido hialurónico", duration_minutes: 45, price: 250000 },
      { name: "Relleno de ojeras", section: "facial", category: "Ácido hialurónico", duration_minutes: 45, price: 230000 },
      { name: "Bioestimulador facial", section: "facial", category: "Bioestimulación", duration_minutes: 60, price: 320000 },
      { name: "Plasma rico en plaquetas (PRP)", section: "facial", category: "Bioestimulación", duration_minutes: 60, price: 150000 },
      { name: "Limpieza facial profunda", section: "facial", category: "Otros", duration_minutes: 60, price: 45000 },
      { name: "Peeling químico", section: "facial", category: "Otros", duration_minutes: 45, price: 60000 },
      { name: "Mesoterapia facial", section: "facial", category: "Otros", duration_minutes: 45, price: 70000 },
      { name: "Lipopapada (reducción)", section: "corporal", category: "Otros", duration_minutes: 45, price: 120000 },
      { name: "Mesoterapia corporal", section: "corporal", category: "Otros", duration_minutes: 60, price: 80000 },
      { name: "Modelado corporal", section: "corporal", category: "Otros", duration_minutes: 60, price: 55000 },
      { name: "Depilación láser", section: "corporal", category: "Otros", duration_minutes: 30, price: 40000 },
    ]
    const { data: insertedServices, error: svcErr } = await admin.from("services").insert(
      services.map((s) => ({
        clinic_id: clinicId, ...s, is_active: true,
        loyalty_points_earned: Math.round(s.price / 10000),
        description: `${s.name} — tratamiento ${s.section}.`,
      }))
    ).select("id, name, price, duration_minutes")
    if (svcErr) throw new Error("services: " + svcErr.message)

    // 6. Pacientes (crea auth user + profile)
    const patientNames = [
      "Valentina Fuentes", "Martín González", "Josefa Araya", "Benjamín Castro",
      "Florencia Muñoz", "Matías Vera", "Antonia Reyes", "Tomás Parra",
      "Catalina Díaz", "Sebastián Rivas", "Isidora Pinto", "Vicente Bravo",
    ]
    const patientIds: string[] = []
    for (let i = 0; i < patientNames.length; i++) {
      const name = patientNames[i]
      const email = `paciente${i + 1}.demo@miclinica.cl`
      const { data: u, error: uErr } = await admin.auth.admin.createUser({
        email, password: "Paciente2026!", email_confirm: true,
        user_metadata: { role: "client", full_name: name },
      })
      if (uErr || !u.user) continue
      patientIds.push(u.user.id)
      await admin.from("profiles").upsert({
        id: u.user.id, clinic_id: clinicId, role: "client", full_name: name,
        rut: `${12 + i}.${100 + i}.${200 + i}-${i % 9}`,
        phone: `+56 9 ${7000 + i} ${1000 + i}`,
        email, is_active: true,
        birth_date: `19${85 + (i % 12)}-0${(i % 9) + 1}-1${i % 9}`,
      })
    }

    // Antecedentes/alergias para los primeros pacientes
    if (patientIds[0]) {
      await admin.from("allergies").insert([
        { clinic_id: clinicId, patient_id: patientIds[0], allergen: "Penicilina", severity: "moderada", reaction: "Urticaria" },
        { clinic_id: clinicId, patient_id: patientIds[2], allergen: "Lidocaína", severity: "leve", reaction: "Enrojecimiento" },
      ])
      await admin.from("medical_history").insert([
        { clinic_id: clinicId, patient_id: patientIds[1], condition: "Hipertensión arterial", notes: "Controlada con medicación" },
        { clinic_id: clinicId, patient_id: patientIds[3], condition: "Hipotiroidismo" },
      ])
    }

    // 7. Citas (~25): pasadas completadas, esta semana confirmadas/pendientes, alguna cancelada
    const svc = insertedServices || []
    const apptRows: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    const offsets = [-14, -12, -10, -9, -7, -6, -5, -4, -3, -2, -1, 0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10]
    for (let i = 0; i < offsets.length; i++) {
      const off = offsets[i]
      const s = pick(svc, i)
      const pid = pick(patientIds, i * 3 + 1)
      if (!pid || !s) continue
      let status: string
      if (off < 0) status = i % 7 === 0 ? "no_asistio" : i % 5 === 0 ? "cancelada" : "completada"
      else if (off === 0) status = "confirmada"
      else status = i % 3 === 0 ? "pendiente" : "confirmada"
      apptRows.push({
        clinic_id: clinicId, patient_id: pid, service_id: s.id,
        scheduled_at: day(off, 9 + (i % 8), (i % 2) * 30).toISOString(),
        duration_minutes: s.duration_minutes, status, price: s.price,
        created_by: adminId,
      })
    }
    await admin.from("appointments").insert(apptRows)

    // 8a. Inventario
    const inventory = [
      { name: "Botox 100U", category: "Toxinas", cost: 120000, stock: 8, min_stock: 3, unit: "vial" },
      { name: "Dysport 300U", category: "Toxinas", cost: 110000, stock: 4, min_stock: 3, unit: "vial" },
      { name: "Ácido hialurónico Juvederm", category: "Ácidos", cost: 90000, stock: 10, min_stock: 4, unit: "jeringa" },
      { name: "Bioestimulador Sculptra", category: "Bioestimuladores", cost: 140000, stock: 3, min_stock: 2, unit: "vial" },
      { name: "Cóctel vitamínico mesoterapia", category: "Mesoterapia", cost: 25000, stock: 12, min_stock: 5, unit: "ampolla" },
      { name: "Suero fisiológico 500ml", category: "Sueros", cost: 1500, stock: 40, min_stock: 10, unit: "bolsa" },
      { name: "Guantes nitrilo (caja)", category: "Guantes", cost: 8000, stock: 6, min_stock: 4, unit: "caja" },
      { name: "Jeringa 1ml", category: "Jeringas", cost: 200, stock: 200, min_stock: 50, unit: "unidad" },
      { name: "Aguja 30G", category: "Agujas", cost: 150, stock: 300, min_stock: 50, unit: "unidad" },
      { name: "Lidocaína tópica", category: "Anestesias", cost: 12000, stock: 9, min_stock: 3, unit: "tubo" },
      { name: "Barbijos (caja)", category: "Barbijos", cost: 5000, stock: 7, min_stock: 3, unit: "caja" },
      { name: "Alcohol gel 1L", category: "Alcoholes", cost: 3000, stock: 15, min_stock: 5, unit: "botella" },
      { name: "Cubre camilla (rollo)", category: "Cubre camilla", cost: 6000, stock: 5, min_stock: 3, unit: "rollo" },
      { name: "Agua estéril", category: "Aguas estériles", cost: 1200, stock: 25, min_stock: 8, unit: "ampolla" },
      { name: "Gasas estériles", category: "Insumos blancos", cost: 2000, stock: 2, min_stock: 10, unit: "paquete" },
    ]
    await admin.from("inventory_products").insert(
      inventory.map((p) => ({ clinic_id: clinicId, ...p, is_active: true }))
    )

    // 8b. Caja (movimientos de la semana)
    const methods = ["efectivo", "debito", "credito", "transferencia"]
    const cashRows: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
    for (let i = 0; i < 12; i++) {
      const s = pick(svc, i)
      cashRows.push({
        clinic_id: clinicId, type: "ingreso", amount: s?.price || 50000,
        method: pick(methods, i), concept: `Pago ${s?.name || "servicio"}`,
        created_by: adminId, created_at: day(-(i % 6), 11 + (i % 6)).toISOString(),
      })
    }
    cashRows.push(
      { clinic_id: clinicId, type: "egreso", amount: 320000, method: "transferencia", concept: "Compra de insumos (toxina)", created_by: adminId, created_at: day(-3, 10).toISOString() },
      { clinic_id: clinicId, type: "egreso", amount: 450000, method: "transferencia", concept: "Arriendo box", created_by: adminId, created_at: day(-5, 9).toISOString() },
    )
    await admin.from("cash_movements").insert(cashRows)

    // 8c. Fidelidad (primeros 10 pacientes)
    const loyaltyAcc = patientIds.slice(0, 10).map((pid, i) => ({
      clinic_id: clinicId, patient_id: pid,
      total_points: 50 + i * 30, lifetime_points: 100 + i * 50,
    }))
    await admin.from("loyalty_accounts").insert(loyaltyAcc)
    await admin.from("loyalty_transactions").insert(
      patientIds.slice(0, 10).map((pid, i) => ({
        clinic_id: clinicId, patient_id: pid, type: "ganados",
        points: 30 + i * 10, description: "Puntos por tratamiento",
      }))
    )

    // 8d. Campañas
    await admin.from("campaigns").insert([
      { clinic_id: clinicId, name: "Promo Botox Junio", channel: "meta", status: "activa", budget: 300000, spent: 210000, leads_generated: 45, appointments_gen: 18, sales_generated: 1200000 },
      { clinic_id: clinicId, name: "Búsqueda estética Google", channel: "google", status: "activa", budget: 250000, spent: 180000, leads_generated: 30, appointments_gen: 12, sales_generated: 900000 },
      { clinic_id: clinicId, name: "Reactivación pacientes", channel: "whatsapp", status: "activa", budget: 0, spent: 0, leads_generated: 20, appointments_gen: 9, sales_generated: 600000 },
      { clinic_id: clinicId, name: "Relleno de labios", channel: "meta", status: "pausada", budget: 150000, spent: 140000, leads_generated: 25, appointments_gen: 10, sales_generated: 700000 },
      { clinic_id: clinicId, name: "Newsletter mensual", channel: "email", status: "activa", budget: 0, spent: 0, leads_generated: 10, appointments_gen: 3, sales_generated: 150000 },
    ])

    // 8e. Pendientes
    await admin.from("tasks").insert([
      { clinic_id: clinicId, title: "Responder comentarios de Instagram", priority: "alta", created_by: adminId, due_date: day(0).toISOString().slice(0, 10) },
      { clinic_id: clinicId, title: "Revisar presupuesto campaña Meta", priority: "normal", created_by: adminId, due_date: day(2).toISOString().slice(0, 10) },
      { clinic_id: clinicId, title: "Pedir reposición de Botox", priority: "alta", created_by: adminId, due_date: day(1).toISOString().slice(0, 10) },
      { clinic_id: clinicId, title: "Confirmar citas de mañana", priority: "normal", created_by: adminId },
      { clinic_id: clinicId, title: "Enviar consentimientos pendientes", priority: "normal", created_by: adminId },
      { clinic_id: clinicId, title: "Pagar arriendo del box", priority: "baja", done: true, created_by: adminId },
      { clinic_id: clinicId, title: "Actualizar precios de servicios", priority: "baja", created_by: adminId },
      { clinic_id: clinicId, title: "Coordinar sesión de fotos antes/después", priority: "normal", created_by: adminId, due_date: day(4).toISOString().slice(0, 10) },
    ])

    // 8f. Colaboraciones
    await admin.from("collaborations").insert([
      { clinic_id: clinicId, name: "Fernanda Ruiz", email: "fer.ruiz@gmail.com", phone: "+56 9 8765 4321", role: "Fotografía", message: "Me encantaría colaborar con fotografía de antes/después.", status: "nuevo" },
      { clinic_id: clinicId, name: "Diego Salinas", email: "diego.mkt@gmail.com", phone: "+56 9 5555 1234", role: "Marketing digital", message: "Tengo experiencia en clínicas estéticas, manejo Meta Ads.", status: "revisado" },
      { clinic_id: clinicId, name: "Dra. Laura Pinto", email: "laurapinto.med@gmail.com", phone: "+56 9 4444 9876", role: "Médico estético", message: "Busco part-time los días sábado.", status: "contactado" },
      { clinic_id: clinicId, name: "Inversiones Belleza SpA", email: "contacto@belleza.cl", role: "Proveedor", message: "Distribuimos toxina y ácido hialurónico a buen precio.", status: "nuevo" },
      { clinic_id: clinicId, name: "Camilo Vidal", email: "camilo.vidal@gmail.com", phone: "+56 9 3333 2211", role: "Community manager", message: "Llevo redes de otras 2 clínicas.", status: "descartado" },
    ])

    // 8g. WhatsApp (un par de conversaciones)
    await admin.from("whatsapp_messages").insert([
      { clinic_id: clinicId, contact_phone: "+56987654321", contact_name: "Valentina Fuentes", direction: "in", body: "Hola, ¿tienen hora para botox esta semana?" },
      { clinic_id: clinicId, contact_phone: "+56987654321", contact_name: "Valentina Fuentes", direction: "out", body: "¡Hola Valentina! Sí, tenemos disponibilidad el jueves a las 16:00. ¿Te sirve?", ai_model: "llama-3.3-70b" },
      { clinic_id: clinicId, contact_phone: "+56987654321", contact_name: "Valentina Fuentes", direction: "in", body: "Perfecto, agéndame por favor 🙌" },
      { clinic_id: clinicId, contact_phone: "+56955551234", contact_name: "Matías Vera", direction: "in", body: "¿Cuánto sale el relleno de labios?" },
      { clinic_id: clinicId, contact_phone: "+56955551234", contact_name: "Matías Vera", direction: "out", body: "El relleno de labios con ácido hialurónico tiene un valor de $250.000. Incluye control posterior. ¿Quieres reservar una evaluación?", ai_model: "llama-3.3-70b" },
    ])

    return NextResponse.json({
      success: true,
      message: "Clínica demo creada con datos.",
      login: { url: "/login", email: DEMO_EMAIL, password: DEMO_PASSWORD },
      booking_link: `/agenda/${DEMO_SLUG}`,
      collaboration_link: `/colaborar/${DEMO_SLUG}`,
      counts: {
        servicios: services.length, pacientes: patientIds.length,
        citas: apptRows.length, inventario: inventory.length, caja: cashRows.length,
      },
    })
  } catch (error: any) {
    console.error("create-demo-clinic error:", error)
    return NextResponse.json({ error: error.message || "Error interno" }, { status: 500 })
  }
}
