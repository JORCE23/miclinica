import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Un DELETE real podría ser destructivo (fk constraints), usualmente hacemos soft delete cambiando is_active
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Borrado en cascada manual de las dependencias del paciente para evitar errores de llave foránea
    await supabase.from("loyalty_transactions").delete().eq("patient_id", params.id)
    await supabase.from("loyalty_accounts").delete().eq("patient_id", params.id)
    await supabase.from("medical_history").delete().eq("patient_id", params.id)
    await supabase.from("allergies").delete().eq("patient_id", params.id)
    await supabase.from("aesthetic_procedures_history").delete().eq("patient_id", params.id)
    await supabase.from("appointments").delete().eq("patient_id", params.id)

    // Finalmente borramos el perfil
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, message: "Paciente borrado completamente" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
