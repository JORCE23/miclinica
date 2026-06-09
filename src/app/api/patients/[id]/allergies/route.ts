import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data, error } = await supabase
      .from("allergies")
      .select("*")
      .eq("patient_id", params.id)
      .order("created_at", { ascending: false })

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

    const { data: profile } = await supabase.from("profiles").select("clinic_id").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 })

    const body = await request.json()
    const { allergen, severity, reaction } = body

    if (!allergen) {
      return NextResponse.json({ error: "El alérgeno es requerido" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("allergies")
      .insert({
        clinic_id: profile.clinic_id,
        patient_id: params.id,
        allergen,
        severity: severity || "leve",
        reaction: reaction || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
