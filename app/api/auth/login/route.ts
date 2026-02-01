import { NextResponse } from "next/server"
import { encrypt, SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { user } = await request.json()
    
    if (!user || !user.id || !user.role) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ user, expires })

    const response = NextResponse.json({ success: true })
    
    response.cookies.set(SESSION_COOKIE_NAME, session, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    })

    return response
  } catch (error) {
    console.error("Login API Error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
