import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener el usuario de forma tolerante: un fallo TRANSITORIO (red/Supabase)
  // no debe cerrar la sesión. Solo tratamos como "no logueado" cuando Supabase
  // responde sin usuario y sin error de conexión.
  let user = null
  let authNetworkError = false
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data.user
    // Errores de red/transitorios (sin status o 5xx) → no forzar logout.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (error as any)?.status
    if (error && (!status || status >= 500)) authNetworkError = true
  } catch {
    authNetworkError = true
  }

  // Ante un error transitorio, dejamos pasar el request tal cual (preserva la sesión/cookies)
  // en vez de redirigir a /login.
  if (authNetworkError) {
    return supabaseResponse
  }

  let redirectUrl = null

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/crear-cuenta') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/agenda') &&
    !request.nextUrl.pathname.startsWith('/colaborar') &&
    !request.nextUrl.pathname.startsWith('/consent-sign') &&
    !request.nextUrl.pathname.startsWith('/api/public') &&
    !request.nextUrl.pathname.startsWith('/api/auth') &&
    !request.nextUrl.pathname.startsWith('/api/admin/create-demo-clinic') &&
    request.nextUrl.pathname !== '/'
  ) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autorizado o sesión expirada' }, { status: 401 })
    }
    redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
  } else if (
    user && 
    (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/')
  ) {
    redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/dashboard'
  }

  if (redirectUrl) {
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Copy any set-cookie headers from supabaseResponse to the redirectResponse
    supabaseResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        redirectResponse.headers.append(key, value)
      }
    })
    
    return redirectResponse
  }

  return supabaseResponse
}
