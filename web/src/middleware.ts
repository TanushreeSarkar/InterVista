import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard','/interview','/evaluation',
  '/analytics','/question-banks','/profile','/settings']
const authRoutes = ['/sign-in','/sign-up','/reset-password']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get('intervista_session')
  const isAuthenticated = !!(sessionCookie?.value && sessionCookie.value.length > 10)

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  // Not authenticated trying to access protected route
  if (isProtected && !isAuthenticated) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated trying to access auth pages
  if (isAuthRoute && isAuthenticated) {
    // Only redirect if cookie has meaningful value — prevents loop
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)'
  ]
}
