import { NextRequest, NextResponse } from 'next/server'
import { registerWebhook, getWebhookInfo, testTelegramConnection, sendTelegramMessage } from '@/lib/notifications/telegram'

/**
 * GET /api/telegram/setup
 * Returns current webhook info and bot status
 */
export async function GET() {
  const [botInfo, webhookInfo] = await Promise.all([
    testTelegramConnection(),
    getWebhookInfo()
  ])

  return NextResponse.json({
    bot: botInfo,
    webhook: webhookInfo
  })
}

/**
 * POST /api/telegram/setup
 * Body: { action: 'register' | 'test' }
 * 
 * register: Registers the webhook URL with Telegram using the current app URL
 * test: Sends a test message to the teacher's chat ID
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'register') {
    // Build the webhook URL from the request
    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const webhookUrl = `${protocol}://${host}/api/telegram/webhook`

    const result = await registerWebhook(webhookUrl)
    return NextResponse.json(result)
  }

  if (action === 'test') {
    const chatId = body.chatId // optional: send to specific chatId
    const sent = await sendTelegramMessage(
      '✅ *Test Notification*\n\nYour Telegram notifications are working correctly!',
      chatId
    )
    return NextResponse.json({ success: sent, message: sent ? 'Test message sent!' : 'Failed to send. Check server logs.' })
  }

  return NextResponse.json({ error: 'Unknown action. Use: register | test' }, { status: 400 })
}
