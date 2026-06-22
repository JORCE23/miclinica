import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/** Actualiza la foto de perfil del usuario autenticado. */
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const avatarUrl = typeof body?.avatar_url === "string" ? body.avatar_url : null

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl || null })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar la foto" }, { status: 400 })
  }

  return NextResponse.json({ ok: true, avatar_url: avatarUrl })
}
