import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { groqChat, isGroqConfigured } from "@/lib/ai/groq"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Devuelve el resumen IA guardado
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  const supabase = createClient()
  const { data } = await supabase
    .from("clinical_records")
    .select("ai_summary, ai_summary_at")
    .eq("clinic_id", context.clinicId)
    .eq("patient_id", params.id)
    .maybeSingle()

  return NextResponse.json({ summary: data?.ai_summary || null, generated_at: data?.ai_summary_at || null })
}

// Genera (o regenera) el resumen clínico con IA
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse || !context) return errorResponse

  if (!isGroqConfigured()) {
    return NextResponse.json({ error: "Falta configurar GROQ_API_KEY (gratis en groq.com) para usar la IA." }, { status: 400 })
  }

  const supabase = createClient()
  const clinicId = context.clinicId
  const pid = params.id

  const [profileR, recordR, allergiesR, historyR, proceduresR, apptsR] = await Promise.all([
    supabase.from("profiles").select("full_name, birth_date").eq("id", pid).eq("clinic_id", clinicId).maybeSingle(),
    supabase.from("clinical_records").select("*").eq("patient_id", pid).eq("clinic_id", clinicId).maybeSingle(),
    supabase.from("allergies").select("allergen, severity, reaction").eq("patient_id", pid).eq("clinic_id", clinicId),
    supabase.from("medical_history").select("condition, notes").eq("patient_id", pid).eq("clinic_id", clinicId),
    supabase.from("aesthetic_procedures_history").select("procedure_name, performed_at, performed_by, notes").eq("patient_id", pid).eq("clinic_id", clinicId).order("performed_at", { ascending: false }).limit(15),
    supabase.from("appointments").select("scheduled_at, status, service:services(name)").eq("patient_id", pid).eq("clinic_id", clinicId).order("scheduled_at", { ascending: false }).limit(15),
  ])

  if (!profileR.data) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const rec = recordR.data || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datos = {
    paciente: profileR.data.full_name,
    fecha_nacimiento: profileR.data.birth_date,
    ficha: {
      antecedentes_morbidos: rec.antecedentes_morbidos, alergias: rec.alergias,
      antecedentes_quirurgicos: rec.antecedentes_quirurgicos, procedimientos_previos: rec.procedimientos_previos,
      medicamentos_diarios: rec.medicamentos_diarios, patologia_dermica: rec.patologia_dermica,
      habitos: { tabaco: rec.tabaco, alcohol: rec.alcohol, alimentacion: rec.alimentacion, actividad_fisica: rec.actividad_fisica },
      evaluacion_facial: rec.evaluacion_facial, tratamientos_recomendados: rec.tratamientos_recomendados,
    },
    alergias: allergiesR.data || [],
    antecedentes: historyR.data || [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    procedimientos: (proceduresR.data || []).map((p: any) => ({ procedimiento: p.procedure_name, fecha: p.performed_at, profesional: p.performed_by, notas: p.notes })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    citas: (apptsR.data || []).map((a: any) => ({ fecha: a.scheduled_at, estado: a.status, servicio: a.service?.name })),
  }

  let summary = ""
  try {
    const out = await groqChat({
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Eres un asistente clínico para profesionales de medicina estética. Redactas un RESUMEN CLÍNICO breve y profesional en español, basándote ÚNICAMENTE en los datos entregados (no inventes nada).
Estructura con subtítulos cortos:
1) Resumen del paciente (datos relevantes y factores de riesgo/alergias).
2) Antecedentes y hábitos a considerar.
3) Historial de procedimientos y evolución.
4) Plan / recomendaciones (según lo registrado).
Sé conciso (máx ~250 palabras). Si falta información, indícalo. No diagnostiques fuera de lo registrado.`,
        },
        { role: "user", content: `Datos del paciente (JSON):\n${JSON.stringify(datos)}` },
      ],
    })
    summary = out.content || ""
  } catch (e) {
    console.error("ai-summary groq error:", e)
    return NextResponse.json({ error: "No se pudo generar el resumen. Intenta de nuevo." }, { status: 500 })
  }

  const now = new Date().toISOString()
  if (recordR.data) {
    await supabase.from("clinical_records").update({ ai_summary: summary, ai_summary_at: now }).eq("patient_id", pid).eq("clinic_id", clinicId)
  } else {
    await supabase.from("clinical_records").insert({ clinic_id: clinicId, patient_id: pid, ai_summary: summary, ai_summary_at: now })
  }

  return NextResponse.json({ summary, generated_at: now })
}
