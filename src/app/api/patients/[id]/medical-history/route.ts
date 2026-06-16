import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/security/audit"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 })

    // clinic_admin ve historial de pacientes de su clínica; el paciente solo el suyo
    if (profile.role !== "clinic_admin" && user.id !== params.id) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("medical_history")
      .select("*")
      .eq("patient_id", params.id)
      .order("diagnosed_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("clinic_id, role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { condition, diagnosed_at, notes } = body

    if (!condition) {
      return NextResponse.json({ error: "La condición médica es requerida" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("medical_history")
      .insert({
        clinic_id: profile.clinic_id,
        patient_id: params.id,
        condition,
        diagnosed_at: diagnosed_at || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAudit(supabase, {
      clinicId:  profile.clinic_id,
      actorId:   user.id,
      action:    "CREATE_MEDICAL_HISTORY",
      patientId: params.id,
      recordId:  data.id,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
