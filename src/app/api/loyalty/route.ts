import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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
    const { patient_id, points, description, type } = body // type: 'ajuste'

    if (!patient_id || points === undefined) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    // Primero obtener la cuenta actual para saber el balance, o crearla si no existe
    let { data: account } = await supabase
      .from("loyalty_accounts")
      .select("*")
      .eq("patient_id", patient_id)
      .single()

    const pointsNumber = Number(points)

    if (!account) {
      const { data: newAcc } = await supabase.from("loyalty_accounts").insert({
        clinic_id: profile.clinic_id,
        patient_id,
        total_points: pointsNumber > 0 ? pointsNumber : 0,
        lifetime_points: pointsNumber > 0 ? pointsNumber : 0,
      }).select().single()
      account = newAcc
    } else {
      const newTotal = Math.max(0, account.total_points + pointsNumber)
      const newLifetime = pointsNumber > 0 ? account.lifetime_points + pointsNumber : account.lifetime_points

      await supabase.from("loyalty_accounts").update({
        total_points: newTotal,
        lifetime_points: newLifetime
      }).eq("id", account.id)
    }

    // Registrar la transacción
    await supabase.from("loyalty_transactions").insert({
      clinic_id: profile.clinic_id,
      patient_id,
      type: type || "ajuste",
      points: pointsNumber,
      description: description || "Ajuste manual",
    })

    return NextResponse.json({ message: "Puntos ajustados" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
