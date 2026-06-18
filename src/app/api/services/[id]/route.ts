import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: service, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Validar admin rol
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, section, duration_minutes, price, loyalty_points_earned, is_active } = body

    if (!name || !duration_minutes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      name,
      description: description || null,
      duration_minutes: Number(duration_minutes),
      price: price ? Number(price) : null,
      loyalty_points_earned: Number(loyalty_points_earned) || 0,
      is_active: is_active,
    }
    if (category !== undefined) updateData.category = category || null
    if (section !== undefined) updateData.section = section || null

    const { data, error } = await supabase
      .from("services")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

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

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Hard delete
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", params.id)

    if (error) {
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({ error: "No se puede eliminar porque tiene reservas o registros asociados. Desactívalo en su lugar." }, { status: 400 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Servicio eliminado" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
