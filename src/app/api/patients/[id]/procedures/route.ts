import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 })

    if (profile.role !== "clinic_admin" && user.id !== params.id) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("aesthetic_procedures_history")
      .select("*")
      .eq("patient_id", params.id)
      .order("performed_at", { ascending: false })

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
    const { procedure_name, performed_at, performed_by, notes, before_image_url, after_image_url, facial_diagram_data } = body

    if (!procedure_name || !performed_at) {
      return NextResponse.json({ error: "El nombre y fecha son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("aesthetic_procedures_history")
      .insert({
        clinic_id: profile.clinic_id,
        patient_id: params.id,
        procedure_name,
        performed_at,
        performed_by: performed_by || null,
        notes: notes || null,
        before_image_url: before_image_url || null,
        after_image_url: after_image_url || null,
        facial_diagram_data: facial_diagram_data || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
