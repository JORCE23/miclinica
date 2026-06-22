import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("id", user.id)
    .single()

  if (!profile?.clinic_id) return new NextResponse("No clinic found", { status: 400 })

  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("clinic_id", profile.clinic_id)
    .order("full_name", { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.clinic_id || profile.role !== "clinic_admin") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const body = await req.json()

  let { data, error } = await supabase
    .from("professionals")
    .insert([{ ...body, clinic_id: profile.clinic_id }])
    .select()
    .single()

  // Tolerancia: si la columna avatar_url aún no existe en la BD, reintentar sin ella.
  if (error && /avatar_url/.test(error.message)) {
    const rest = { ...body }
    delete rest.avatar_url
    ;({ data, error } = await supabase
      .from("professionals")
      .insert([{ ...rest, clinic_id: profile.clinic_id }])
      .select()
      .single())
  }

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}
