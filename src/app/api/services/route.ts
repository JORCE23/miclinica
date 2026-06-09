import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // El RLS se encarga de filtrar por clinic_id automáticamente (policy "client_view_services" o "admin_manage_services")
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: services, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(services)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // 1. Verificar sesión
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 2. Obtener clinic_id del admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    console.log("Debug POST service:", { user: user.id, adminProfile, profileError })

    if (!adminProfile || adminProfile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // 3. Obtener datos
    const body = await request.json()
    const { name, description, duration_minutes, price, loyalty_points_earned, is_active } = body

    if (!name || !duration_minutes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // 4. Insertar
    const { data, error } = await supabase
      .from("services")
      .insert({
        clinic_id: adminProfile.clinic_id,
        name,
        description: description || null,
        duration_minutes: Number(duration_minutes),
        price: price ? Number(price) : null,
        loyalty_points_earned: Number(loyalty_points_earned) || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
