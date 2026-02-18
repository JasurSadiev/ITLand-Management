import { NextRequest, NextResponse } from "next/server"
import { handleTelegramUpdate } from "@/lib/notifications/bot-handlers"

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    console.log("📥 Telegram Update Received:", update.update_id)
    
    await handleTelegramUpdate(update)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram Webhook Error:", error)
    // Always return 200 to Telegram unless we want them to retry
    return NextResponse.json({ ok: true })
  }
}

// Optional: GET to check if webhook is reachable
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is active" })
}
