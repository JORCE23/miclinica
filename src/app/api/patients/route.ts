import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const adminAuthClient = createAdminClient()

    // 1. Verificar sesión del admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 2. Obtener el perfil del admin para obtener el clinic_id
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.role !== "clinic_admin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
    }

    // 3. Obtener los datos del nuevo paciente
    const body = await request.json()
    const { email, password, full_name, rut, birth_date, phone, notes } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // 4. Crear el usuario en Auth usando la API de Admin (para no desloguear al admin actual)
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "client",
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Error al crear usuario" }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 5. Insertar el perfil del paciente en la tabla profiles
    const { error: profileError } = await adminAuthClient
      .from("profiles")
      .insert({
        id: newUserId,
        clinic_id: adminProfile.clinic_id,
        role: "client",
        full_name,
        rut: rut || null,
        birth_date: birth_date || null,
        phone: phone || null,
        email,
        notes: notes || null,
      })

    if (profileError) {
      // Si falla el perfil, podríamos borrar el usuario de auth como rollback, pero lo dejamos simple por ahora
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Paciente creado exitosamente", id: newUserId }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
