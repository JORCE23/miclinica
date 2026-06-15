import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Cliente Admin que puede crear usuarios sin iniciar su sesión (Service Role)
const adminAuthClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    
    // 1. Verificar sesión del administrador actual
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

    // 2. Recibir datos del frontend
    const body = await req.json()
    const { 
      full_name, 
      email, 
      phone, 
      specialty, 
      is_active, 
      password, 
      permissions 
    } = body

    if (!email || !password || !full_name) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // 3. Crear el usuario en Supabase Auth usando la cuenta Admin
    const { data: newAuthUser, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar el email
      user_metadata: { full_name }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const newUserId = newAuthUser.user.id

    // 4. Crear o Actualizar el perfil público (profile)
    // Usamos Upsert por si un Trigger automático ya lo creó vacío
    const { error: profileError } = await adminAuthClient
      .from("profiles")
      .upsert({
        id: newUserId,
        clinic_id: profile.clinic_id,
        role: "staff",
        full_name,
        email,
        phone,
        is_active: is_active ?? true
      })

    if (profileError) {
      // Intentar borrar la cuenta si falla el perfil (rollback manual)
      await adminAuthClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // 5. Crear los permisos del staff
    const { error: permError } = await adminAuthClient
      .from("staff_permissions")
      .insert({
        profile_id: newUserId,
        can_view_dashboard: permissions?.can_view_dashboard ?? false,
        can_manage_patients: permissions?.can_manage_patients ?? false,
        can_manage_appointments: permissions?.can_manage_appointments ?? false,
        can_manage_services: permissions?.can_manage_services ?? false,
        can_view_reports: permissions?.can_view_reports ?? false
      })

    if (permError) console.error("Error creando permisos:", permError.message)

    // 6. Crear el registro en 'professionals' (directorio de la clínica)
    const { data: professionalData, error: profError } = await adminAuthClient
      .from("professionals")
      .insert({
        clinic_id: profile.clinic_id,
        profile_id: newUserId,
        full_name,
        email,
        phone,
        specialty,
        is_active: is_active ?? true
      })
      .select()
      .single()

    if (profError) {
      console.error("Error creando registro en professionals:", profError.message)
    }

    return NextResponse.json(professionalData || { success: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
