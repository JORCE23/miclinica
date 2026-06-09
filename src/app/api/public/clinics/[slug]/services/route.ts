import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id")
      .eq("slug", params.slug)
      .single()

    if (clinicError || !clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    const { data: services, error } = await supabase
      .from("services")
      .select("id, name, description, duration_minutes, price")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(services)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
