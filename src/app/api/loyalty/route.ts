import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("clinic_id, role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Obtener todas las cuentas de fidelidad de la clínica, unidas con los datos del paciente
    const { data: accounts, error } = await supabase
      .from("loyalty_accounts")
      .select("*, patient:profiles(id, full_name, rut, email)")
      .eq("clinic_id", profile.clinic_id)
      .order("total_points", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json(accounts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Para ajustes manuales (POST)
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("clinic_id, role").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { patient_id, points, description, type } = body

    if (!patient_id || points === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    const ALLOWED_TYPES = new Set(["ganados", "canjeados", "ajuste", "expirados"])
    const resolvedType = type && ALLOWED_TYPES.has(type) ? type : "ajuste"
    const pointsNumber = Number(points)

    if (!Number.isInteger(pointsNumber)) {
      return NextResponse.json({ error: "Los puntos deben ser un número entero" }, { status: 400 })
    }

    const { error: rpcError } = await supabase.rpc("adjust_loyalty_points", {
      p_clinic_id:   profile.clinic_id,
      p_patient_id:  patient_id,
      p_points:      pointsNumber,
      p_description: description || "Ajuste manual",
      p_type:        resolvedType,
    })

    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 })

    return NextResponse.json({ message: "Puntos ajustados" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
