import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Role to route mapping
const roleRouteMap: Record<string, string> = {
  customer: '/customer',
  technician: '/technician',
  company_owner: '/company/dashboard',
  admin: '/admin/dashboard',
  super_admin: '/admin/dashboard',
}

// Role-specific route prefixes
const roleAllowedRoutes: Record<string, string[]> = {
  customer: ['/customer'],
  technician: ['/technician'],
  company_owner: ['/company'],
  admin: ['/admin'],
  super_admin: ['/admin'],
}

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Auth routes (login, register, etc.)
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') ||
                      pathname.startsWith('/verify') ||
                      pathname.startsWith('/reset-password')
  
  // Protected routes (require authentication)
  const isProtectedRoute = pathname.startsWith('/customer') ||
                           pathname.startsWith('/technician') ||
                           pathname.startsWith('/company') ||
                           pathname.startsWith('/admin')

  // Public routes (landing, api, etc.)
  const isPublicRoute = pathname === '/' || 
                        pathname.startsWith('/api') ||
                        pathname.startsWith('/_next') ||
                        pathname.includes('.')

  // 1. Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Redirect authenticated users away from auth routes to their dashboard
  if (user && isAuthRoute) {
    try {
      // Get user role from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role && roleRouteMap[profile.role]) {
        const url = request.nextUrl.clone()
        url.pathname = roleRouteMap[profile.role]
        return NextResponse.redirect(url)
      }
    } catch {
      // If profile fetch fails, just let them through
    }
    
    // Fallback to landing page if no role
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 3. Role-based access control for protected routes
  if (user && isProtectedRoute) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profile?.role) {
        const allowedRoutes = roleAllowedRoutes[profile.role] || []
        const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

        if (!hasAccess) {
          // Redirect to correct dashboard
          const url = request.nextUrl.clone()
          url.pathname = roleRouteMap[profile.role] || '/'
          return NextResponse.redirect(url)
        }
      }
    } catch {
      // If role check fails, redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
