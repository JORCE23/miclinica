import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { data: clinic, error } = await supabase
      .from("clinics")
      .select("id, name, slug, address, phone, email, legal_name, tax_id, billing_plan")
      .eq("id", profile.clinic_id)
      .single()

    if (error) throw error

    return NextResponse.json(clinic)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, phone, email, legal_name, tax_id, billing_plan } = body

    if (!name) {
      return NextResponse.json({ error: "El nombre de la clínica es obligatorio" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { name, address, phone, email }
    if (legal_name !== undefined) updateData.legal_name = legal_name || null
    if (tax_id !== undefined) updateData.tax_id = tax_id || null
    if (billing_plan !== undefined) updateData.billing_plan = billing_plan || null

    const { data: clinic, error } = await supabase
      .from("clinics")
      .update(updateData)
      .eq("id", profile.clinic_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(clinic)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
