import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/auth"

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  const cookiesToClear = [SESSION_COOKIE_NAME, "user-role", "student-id"]
  cookiesToClear.forEach(name => {
    response.cookies.set(name, "", {
      expires: new Date(0),
      path: "/",
    })
  })

  return response
}
