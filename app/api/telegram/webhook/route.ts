import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/lib/notifications/bot-handlers'

/**
 * POST /api/telegram/webhook
 * Receives all incoming Telegram updates and delegates to bot-handlers.ts
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    console.log('[Webhook] Received update:', JSON.stringify(update).slice(0, 200))
    
    await handleTelegramUpdate(update)
    
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Webhook] Error processing update:', error.message || error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
