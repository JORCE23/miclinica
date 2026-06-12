import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    .eq("id", params.id)
    .eq("clinic_id", profile.clinic_id)
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const { data, error } = await supabase
    .from("professionals")
    .update(body)
    .eq("id", params.id)
    .eq("clinic_id", profile.clinic_id)
    .select()
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", params.id)
    .eq("clinic_id", profile.clinic_id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
