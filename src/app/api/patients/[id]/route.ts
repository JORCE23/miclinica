import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/security/audit"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Validar acceso (client puede ver el suyo, admin puede ver los de su clínica)
    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    if (profile.role === "client" && user.id !== params.id) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { data: patient, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .eq("role", "client")
      .eq("clinic_id", profile.clinic_id)
      .single()

    if (error || !patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    // Solo actualizamos campos permitidos
    const { full_name, rut, birth_date, phone, email, notes, is_active } = body

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        rut: rut || null,
        birth_date: birth_date || null,
        phone: phone || null,
        email,
        notes: notes || null,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("clinic_id", profile.clinic_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, clinic_id")
      .eq("id", user.id)
      .single()
    if (!adminProfile || adminProfile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Soft delete: marca como inactivo. Nunca se eliminan físicamente fichas clínicas.
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("clinic_id", adminProfile.clinic_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await logAudit(supabase, {
      clinicId:  adminProfile.clinic_id,
      actorId:   user.id,
      action:    "DEACTIVATE_PATIENT",
      patientId: params.id,
    })

    return NextResponse.json({ success: true, message: "Paciente desactivado exitosamente" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
