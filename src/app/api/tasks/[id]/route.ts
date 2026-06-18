import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const patch: Record<string, unknown> = {}
  if (typeof body?.done === "boolean") patch.done = body.done
  if (typeof body?.title === "string" && body.title.trim()) patch.title = body.title.trim()
  if (body?.notes !== undefined) patch.notes = body.notes || null
  if (["baja", "normal", "alta"].includes(body?.priority)) patch.priority = body.priority
  if (body?.due_date !== undefined) patch.due_date = body.due_date || null

  const supabase = createClient()
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
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
    .from("tasks")
    .delete()
    .eq("id", params.id)
    .eq("clinic_id", context!.clinicId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
