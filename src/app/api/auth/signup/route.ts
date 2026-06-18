import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "clinica"

export async function POST(request: Request) {
  // Anti-spam: máximo 5 registros por IP cada 10 min
  const ip = getIp(request)
  const { success } = await checkRateLimit(ip, { limit: 5, windowMs: 10 * 60 * 1000 })
  if (!success) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 })
  }

  const body = sanitizeInput(await request.json())
  const clinicName = (body?.clinic_name || "").trim()
  const fullName = (body?.full_name || "").trim()
  const email = (body?.email || "").trim().toLowerCase()
  const password = body?.password || ""
  const phone = (body?.phone || "").trim() || null

  if (!clinicName || !fullName || !email || !password) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
  }

  // Slug único
  let slug = slugify(clinicName)
  const { data: clash } = await admin.from("clinics").select("id").eq("slug", slug).maybeSingle()
  if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`

  // 1. Crear clínica
  const { data: clinic, error: clinicErr } = await admin
    .from("clinics")
    .insert({ name: clinicName, slug, email, phone, is_active: true })
    .select("id, slug")
    .single()
  if (clinicErr || !clinic) {
    return NextResponse.json({ error: "No se pudo crear la clínica" }, { status: 400 })
  }

  // 2. Crear usuario admin
  const { data: user, error: userErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName },
  })
  if (userErr || !user.user) {
    await admin.from("clinics").delete().eq("id", clinic.id) // rollback
    const msg = userErr?.message?.includes("already") ? "Ese correo ya está registrado" : "No se pudo crear el usuario"
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // 3. Perfil admin
  const { error: profErr } = await admin.from("profiles").upsert({
    id: user.user.id, clinic_id: clinic.id, role: "clinic_admin",
    full_name: fullName, email, phone, is_active: true,
  })
  if (profErr) {
    await admin.auth.admin.deleteUser(user.user.id).catch(() => {}) // rollback
    await admin.from("clinics").delete().eq("id", clinic.id)
    return NextResponse.json({ error: "No se pudo crear el perfil" }, { status: 400 })
  }

  return NextResponse.json({ success: true, slug: clinic.slug })
}
