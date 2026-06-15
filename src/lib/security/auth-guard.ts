import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface AuthContext {
  userId: string
  clinicId: string
  role: string
}

export async function requireAuth(
  requiredRole?: string
): Promise<{ context?: AuthContext; errorResponse?: NextResponse }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("CRITICAL: Faltan variables de entorno de Supabase")
    return {
      errorResponse: NextResponse.json({ error: "Configuración de servidor inválida" }, { status: 500 }),
    }
  }

  try {
    const supabase = createClient()

    // Valida el JWT contra el servidor de Auth (getUser, NO getSession)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        errorResponse: NextResponse.json({ error: "No autorizado. Token inválido o ausente." }, { status: 401 }),
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return { errorResponse: NextResponse.json({ error: "Perfil no encontrado o incompleto" }, { status: 403 }) }
    }

    if (!profile.clinic_id) {
      return {
        errorResponse: NextResponse.json({ error: "Usuario no pertenece a ninguna clínica" }, { status: 403 }),
      }
    }

    if (requiredRole && profile.role !== requiredRole) {
      return { errorResponse: NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 }) }
    }

    return {
      context: {
        userId: user.id,
        clinicId: profile.clinic_id,
        role: profile.role,
      },
    }
  } catch (error) {
    console.error("Auth Guard Error:", error)
    return {
      errorResponse: NextResponse.json({ error: "Error interno de validación de seguridad" }, { status: 500 }),
    }
  }
}
