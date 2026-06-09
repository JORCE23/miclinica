import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role used to bypass RLS for public data
)

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { data: clinic, error } = await supabase
      .from("clinics")
      .select("id, name, logo_url, address, phone")
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single()

    if (error || !clinic) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 })

    return NextResponse.json(clinic)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
