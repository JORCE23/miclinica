import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const status = body?.status
  if (!["nuevo", "revisado", "contactado", "descartado"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from("collaborations")
    .update({ status })
    .eq("id", params.id)
    .eq("clinic_id", context!.clinicId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { error } = await supabase
    .from("collaborations")
    .delete()
    .eq("id", params.id)
    .eq("clinic_id", context!.clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
