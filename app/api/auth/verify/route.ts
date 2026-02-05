import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { contact, password } = await request.json()
    
    if (!contact || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    // Query for student where contactPhone OR contactEmail matches and password matches
    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .or(`contact_phone.eq.${contact},contact_email.eq.${contact}`)
      .eq("password_text", password)
      .maybeSingle()

    if (error) {
      console.error("Supabase Auth Error:", error)
      return NextResponse.json({ error: "Authentication query failed" }, { status: 500 })
    }

    if (!student) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Map DB fields to frontend expected ones
    const mappedStudent = {
      id: student.id,
      fullName: student.full_name,
      contactEmail: student.contact_email,
      contactPhone: student.contact_phone,
      role: "student",
      // Include other necessary fields for the session
    }

    return NextResponse.json({ success: true, student: mappedStudent })
  } catch (error) {
    console.error("Verify API Error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
