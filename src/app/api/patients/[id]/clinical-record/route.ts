import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

const FIELDS = [
  "antecedentes_morbidos", "alergias", "antecedentes_quirurgicos", "procedimientos_previos",
  "hospitalizaciones", "medicamentos_diarios", "cicatriz_queloide", "patologia_dermica",
  "problemas_coagulacion", "enfermedades_autoinmunes", "herpes_labial", "exposicion_solar",
  "tabaco", "alcohol", "drogas", "alimentacion", "consumo_agua", "actividad_fisica",
  "embarazo_lactancia", "skincare_casa", "evaluacion_facial", "tratamientos_recomendados",
]

// Obtener la ficha clínica del paciente
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || {})
}

// Crear o actualizar la ficha clínica (upsert por paciente)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const body = sanitizeInput(await request.json())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = { clinic_id: context.clinicId, patient_id: params.id, updated_at: new Date().toISOString() }
  for (const f of FIELDS) payload[f] = body?.[f] ?? null

  const supabase = createClient()
  const { data, error } = await supabase
    .from("clinical_records")
    .upsert(payload, { onConflict: "patient_id" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
