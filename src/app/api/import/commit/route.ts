import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type Mapping = Record<string, string | null>
type Row = Record<string, unknown>

// Convierte "$12.500" / "1.200" / "30,5" a número
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const s = String(v).replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
function toInt(v: unknown): number | null {
  const n = toNumber(v)
  return n === null ? null : Math.round(n)
}

export async function POST(req: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse
  const clinicId = context!.clinicId

  const body = await req.json().catch(() => null)
  const entity: string = body?.entity
  const mapping: Mapping = body?.mapping || {}
  const rows: Row[] = body?.rows || []
  if (!entity || !Array.isArray(rows)) {
    return NextResponse.json({ error: "Datos incompletos." }, { status: 400 })
  }

  const admin = createAdminClient()
  const val = (row: Row, field: string): string => {
    const col = mapping[field]
    if (!col) return ""
    return String(row[col] ?? "").trim()
  }

  // ---------- INVENTARIO ----------
  if (entity === "inventario") {
    const records = rows
      .map((r) => ({
        clinic_id: clinicId,
        name: val(r, "name"),
        category: val(r, "category") || null,
        sku: val(r, "sku") || null,
        unit: val(r, "unit") || "unidad",
        stock: toInt(val(r, "stock")) ?? 0,
        min_stock: toInt(val(r, "min_stock")) ?? 5,
        supplier: val(r, "supplier") || null,
        notes: val(r, "notes") || null,
      }))
      .filter((x) => x.name)
    if (records.length === 0) return NextResponse.json({ inserted: 0, skipped: rows.length, errors: [] })
    const { error, count } = await admin.from("inventory_products").insert(records, { count: "exact" })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ inserted: count ?? records.length, skipped: rows.length - records.length, errors: [] })
  }

  // ---------- SERVICIOS ----------
  if (entity === "servicios") {
    const records = rows
      .map((r) => ({
        clinic_id: clinicId,
        name: val(r, "name"),
        description: val(r, "description") || null,
        category: val(r, "category") || null,
        duration_minutes: toInt(val(r, "duration_minutes")) ?? 30,
        price: toInt(val(r, "price")) ?? 0,
        loyalty_points_earned: 0,
        is_active: true,
      }))
      .filter((x) => x.name)
    if (records.length === 0) return NextResponse.json({ inserted: 0, skipped: rows.length, errors: [] })
    const { error, count } = await admin.from("services").insert(records, { count: "exact" })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ inserted: count ?? records.length, skipped: rows.length - records.length, errors: [] })
  }

  // ---------- PACIENTES ----------
  if (entity === "pacientes") {
    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    // Dedup: traer emails/ruts existentes de esta clínica
    const { data: existing } = await admin
      .from("profiles")
      .select("email, rut")
      .eq("clinic_id", clinicId)
    const existingEmails = new Set((existing || []).map((p) => (p.email || "").toLowerCase()).filter(Boolean))
    const existingRuts = new Set((existing || []).map((p) => (p.rut || "").trim()).filter(Boolean))

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const full_name = val(r, "full_name")
      if (!full_name) { skipped++; continue }

      const rut = val(r, "rut") || null
      let email = val(r, "email").toLowerCase()
      const phone = val(r, "phone") || null
      const birth_date = val(r, "birth_date") || null
      const notes = val(r, "notes") || null

      if (rut && existingRuts.has(rut)) { skipped++; continue }
      if (email && existingEmails.has(email)) { skipped++; continue }

      // Email provisional si no trae (la BD lo requiere y crea cuenta de acceso)
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        email = `paciente_${Date.now()}_${i}@sincorreo.medique`
      }

      const password = Math.random().toString(36).slice(2) + "A1!"
      const { data: authData, error: authErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { role: "client" },
      })
      if (authErr || !authData.user) {
        if (authErr?.message?.includes("already")) { skipped++ } else { errors.push(`${full_name}: ${authErr?.message || "error"}`) }
        continue
      }

      const { error: profErr } = await admin.from("profiles").insert({
        id: authData.user.id,
        clinic_id: clinicId,
        role: "client",
        full_name,
        rut,
        birth_date: birth_date || null,
        phone,
        email: email.endsWith("@sincorreo.medique") ? null : email,
        notes,
      })
      if (profErr) {
        await admin.auth.admin.deleteUser(authData.user.id)
        errors.push(`${full_name}: ${profErr.message}`)
        continue
      }
      existingEmails.add(email)
      if (rut) existingRuts.add(rut)
      inserted++
    }

    return NextResponse.json({ inserted, skipped, errors })
  }

  // ---------- RESERVAS (próximamente) ----------
  if (entity === "reservas") {
    return NextResponse.json({
      inserted: 0, skipped: rows.length, errors: [],
      message: "La importación de reservas estará disponible muy pronto (requiere enlazar con pacientes y servicios ya cargados).",
    })
  }

  return NextResponse.json({ error: "Tipo de datos no soportado." }, { status: 400 })
}
