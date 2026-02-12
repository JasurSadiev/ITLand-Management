import type { TelegramMessage } from './types'

const TELEGRAM_API_URL = 'https://api.telegram.org/bot'

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured. Skipping notification.')
    return false
  }

  try {
    const payload: TelegramMessage = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
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
      console.error('Telegram API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
    return false
  }
}

/**
 * Test Telegram connection
 */
export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  
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
      return { success: false, message: 'Invalid bot token' }
    }
  } catch (error) {
    return { success: false, message: 'Connection failed' }
  }
}
