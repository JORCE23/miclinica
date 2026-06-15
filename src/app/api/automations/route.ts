import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_AUTOMATIONS = [
  {
    type: "reminder-24h",
    is_active: false,
    message_template: "Hola {{patient_name}}, te recordamos tu cita mañana a las {{appointment_time}} para {{service_name}}."
  },
  {
    type: "birthday",
    is_active: false,
    message_template: "¡Feliz cumpleaños {{patient_name}}! Queremos celebrarlo contigo con un 15% de descuento en tu próximo servicio."
  },
  {
    type: "post-appointment-review",
    is_active: false,
    message_template: "Hola {{patient_name}}, esperamos que te haya gustado tu sesión de {{service_name}}. ¡Déjanos tu reseña aquí: [LINK]!"
  },
  {
    type: "follow-up-botox",
    is_active: false,
    message_template: "Hola {{patient_name}}, han pasado 14 días desde tu tratamiento. ¿Cómo te has sentido? Contáctanos para agendar tu control."
  }
]

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const { data: automations, error } = await supabase
      .from("clinic_automations")
      .select("*")
      .eq("clinic_id", profile.clinic_id)

    if (error && error.code !== '42P01') { // 42P01 es error de tabla no existe, lo ignoramos temporalmente
      throw error
    }

    // Combinar con defaults
    const mergedAutomations = DEFAULT_AUTOMATIONS.map(def => {
      const existing = automations?.find(a => a.type === def.type)
      if (existing) return existing
      return { ...def, clinic_id: profile.clinic_id }
    })

    return NextResponse.json(mergedAutomations)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { data: profile } = await supabase.from("profiles").select("role, clinic_id").eq("id", user.id).single()
    if (!profile || profile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    const body = await request.json()
    const { type, is_active, message_template } = body

    if (!type) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Usamos select y update/insert condicional dado que upsert onConflict require un PK explicito que a veces falla si no está bien configurado
    const { data: existing } = await supabase
      .from("clinic_automations")
      .select("id")
      .eq("clinic_id", profile.clinic_id)
      .eq("type", type)
      .single()

    let result;
    if (existing) {
      result = await supabase
        .from("clinic_automations")
        .update({ is_active, message_template, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from("clinic_automations")
        .insert({
          clinic_id: profile.clinic_id,
          type,
          is_active,
          message_template
        })
        .select()
        .single()
    }

    if (result.error) throw result.error

    return NextResponse.json(result.data)

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
