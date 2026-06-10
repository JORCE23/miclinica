import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import fs from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    
    // 1. Authenticate user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 2. Get user profile and clinic_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", session.user.id)
      .single()

    if (!profile || profile.role !== "clinic_admin" || !profile.clinic_id) {
      return NextResponse.json({ error: "Permisos insuficientes o sin clínica" }, { status: 403 })
    }

    // 3. Read procedimientos.json
    const filePath = path.join(process.cwd(), "procedimientos.json")
    const fileContents = await fs.readFile(filePath, "utf8")
    const data = JSON.parse(fileContents)

    if (!data.procedimientos || !Array.isArray(data.procedimientos)) {
      return NextResponse.json({ error: "Formato de JSON inválido" }, { status: 400 })
    }

    const clinicId = profile.clinic_id

    // 4. Map JSON data to DB schema
    const servicesToInsert = data.procedimientos.map((proc: any) => ({
      clinic_id: clinicId,
      name: proc.nombre,
      description: proc.descripcion,
      duration_minutes: proc.duracion_agenda_min || proc.duracion_sesion_min || 60,
      price: proc.precio_clp || 0,
      loyalty_points_earned: 0,
      is_active: proc.activo !== false,
      
      // Nuevos campos
      category: proc.categoria,
      service_code: proc.id,
      zones: proc.zonas || null,
      reference_products: proc.producto_referencia || null,
      dose_units: proc.dosis_unidades || null,
      application_route: proc.via || null,
      clinical_duration_min: proc.duracion_sesion_min || null,
      effect_onset: proc.inicio_efecto || null,
      effect_duration: proc.duracion_efecto || null,
      recommended_sessions: proc.sesiones_recomendadas || null,
      sessions_interval: proc.intervalo_sesiones || null,
      recovery_time: proc.recuperacion || null,
      indications: proc.indicaciones || null,
      use_general_contraindications: !!proc.usa_contraindicaciones_generales,
      use_toxin_contraindications: !!proc.usa_contraindicaciones_toxina,
      post_care_type: proc.usa_cuidados_post || null,
      requires_consent: !!proc.requiere_consentimiento,
      requires_clinical_photo: !!proc.requiere_foto_clinica,
      custom_field: proc.campo_personalizado || null,
    }))

    // 5. Insert into Supabase
    // We use service_code to try to avoid duplicates if possible. 
    // Since service_code is not a primary key, upsert might be complex without a unique constraint.
    // For simplicity, we just insert. The user can clear the table if they want to re-seed.
    const { data: inserted, error } = await supabase
      .from("services")
      .insert(servicesToInsert)
      .select("id")

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: "Error al insertar en DB", details: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se insertaron ${inserted?.length || 0} procedimientos correctamente.` 
    })

  } catch (error: any) {
    console.error("Error in seed endpoint:", error)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
