import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/security/auth-guard"
import { checkRateLimit, getIp } from "@/lib/security/rate-limit"
import { sanitizeInput } from "@/lib/security/sanitize"

export async function GET(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getIp(request)
    const { success, limit, remaining } = await checkRateLimit(ip)
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429, headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() } })
    }

    // 2. Auth Guard
    const { context, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse

    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = supabase
      .from("services")
      .select("*")
      .eq('clinic_id', context!.clinicId) // Explicitly filter by clinic_id as a defense in depth
      .order("name", { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: services, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(services)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = getIp(request)
    const { success, limit, remaining } = await checkRateLimit(ip)
    if (!success) {
      return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429, headers: { 'X-RateLimit-Limit': limit.toString(), 'X-RateLimit-Remaining': remaining.toString() } })
    }

    // 2. Auth Guard y variables
    const { context, errorResponse } = await requireAuth("clinic_admin")
    if (errorResponse) return errorResponse

    // 3. Obtener y Sanitizar datos
    const rawBody = await request.json()
    const body = sanitizeInput(rawBody)

    const { name, description, category, section, duration_minutes, price, loyalty_points_earned, is_active } = body

    if (!name || !duration_minutes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // 4. Insertar usando el clinicId extraído del perfil seguro
    const supabase = createClient()
    const { data, error } = await supabase
      .from("services")
      .insert({
        clinic_id: context!.clinicId,
        name,
        description: description || null,
        category: category || null,
        section: section || null,
        duration_minutes: Number(duration_minutes),
        price: price ? Number(price) : null,
        loyalty_points_earned: Number(loyalty_points_earned) || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
