import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { patientId: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    // Validar acceso (client o admin)
    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })

    if (profile.role === "client" && user.id !== params.patientId) {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // Obtener cuenta
    const { data: account } = await supabase
      .from("loyalty_accounts")
      .select("*")
      .eq("patient_id", params.patientId)
      .eq("clinic_id", profile.clinic_id)
      .single()

    // Obtener transacciones
    const { data: transactions } = await supabase
      .from("loyalty_transactions")
      .select("*, appointment:appointments(service_id)")
      .eq("patient_id", params.patientId)
      .eq("clinic_id", profile.clinic_id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      account: account || { total_points: 0, lifetime_points: 0 },
      transactions: transactions || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
