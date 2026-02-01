import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secretKey = "itland-secret-key-change-this-in-production"
const key = new TextEncoder().encode(secretKey)

const SESSION_COOKIE_NAME = "itland-session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Define public paths
  const isPublicPath = pathname === "/login" || pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")

  if (isPublicPath) {
    return NextResponse.next()
  }

  // 2. Get the session cookie
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    // 3. Verify the JWT
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    })
    
    const userRole = (payload.user as any)?.role

    // 4. Role-based protection
    if (pathname.startsWith("/student") && userRole !== "student") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (!pathname.startsWith("/student") && userRole !== "teacher") {
      return NextResponse.redirect(new URL("/student", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware Auth Error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
