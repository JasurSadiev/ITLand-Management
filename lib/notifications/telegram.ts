import type { TelegramMessage } from './types'

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

/**
 * Get bot token - works both client-side and server-side (API routes)
 */
function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
}

/**
 * Get default chat ID - works both client-side and server-side (API routes)
 */
function getDefaultChatId(): string | undefined {
  return process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  message: string, 
  chatId?: string, 
  options: Partial<TelegramMessage> = {}
): Promise<boolean> {
  const botToken = getBotToken()
  const defaultChatId = getDefaultChatId()
  const targetChatId = chatId || defaultChatId

  if (!botToken || !targetChatId) {
    console.warn('[Telegram] Credentials not configured. botToken:', !!botToken, 'chatId:', !!targetChatId)
    return false
  }

  try {
    const payload: TelegramMessage = {
      chat_id: targetChatId as string,
      text: message,
      parse_mode: 'Markdown',
      ...options
    }

    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Telegram] API error:', JSON.stringify(error))
      return false
    }

    console.log(`[Telegram] Message sent to chatId: ${targetChatId}`)
    return true
  } catch (error) {
    console.error('[Telegram] Failed to send notification:', error)
    return false
  }
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  const botToken = getBotToken()
  
  if (!botToken) {
    return { success: false, message: 'Bot token not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/getMe`)
    const data = await response.json()

    if (data.ok) {
      return { 
        success: true, 
        message: `Connected to bot: ${data.result.first_name} (@${data.result.username})` 
      }
    } else {
      return { success: false, message: `Invalid bot token: ${data.description}` }
    }
  } catch (error) {
    return { success: false, message: 'Connection failed' }
  }
}

/**
 * Register the webhook URL with Telegram
 * Call this once after deploying to set up the bot webhook
 */
export async function registerWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  const botToken = getBotToken()
  
  if (!botToken) {
    return { success: false, message: 'Bot token not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    })
    const data = await response.json()

    if (data.ok) {
      return { success: true, message: `Webhook registered: ${webhookUrl}` }
    } else {
      return { success: false, message: `Failed: ${data.description}` }
    }
  } catch (error) {
    return { success: false, message: 'Failed to register webhook' }
  }
}

/**
 * Get current webhook info from Telegram
 */
export async function getWebhookInfo(): Promise<any> {
  const botToken = getBotToken()
  if (!botToken) return null

  const response = await fetch(`${TELEGRAM_API_URL}${botToken}/getWebhookInfo`)
  return response.json()
}
