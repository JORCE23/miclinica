import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"

export const dynamic = "force-dynamic"

export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("collaborations")
    .select("*")
    .eq("clinic_id", context!.clinicId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}
