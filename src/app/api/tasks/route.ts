import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { sanitizeInput } from "@/lib/security/sanitize"

export const dynamic = "force-dynamic"

export async function GET() {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const supabase = createClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("clinic_id", context!.clinicId)
    .order("done", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const { context, errorResponse } = await requireAuth("clinic_admin")
  if (errorResponse) return errorResponse

  const body = sanitizeInput(await request.json())
  const title = (body?.title || "").trim()
  if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      clinic_id: context!.clinicId,
      title,
      notes: body?.notes || null,
      priority: ["baja", "normal", "alta"].includes(body?.priority) ? body.priority : "normal",
      due_date: body?.due_date || null,
      created_by: context!.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
