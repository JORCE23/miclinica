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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let redirectUrl = null

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
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
