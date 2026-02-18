import { NextRequest, NextResponse } from 'next/server'
import { api } from '@/lib/api'
import { sendTelegramMessage } from '@/lib/notifications/telegram'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Check if this is a contact sharing message
    if (body.message?.contact) {
      const contact = body.message.contact
      const chatId = body.message.chat.id.toString()
      const phoneNumber = contact.phone_number
      
      // Look up student by phone number
      const student = await api.getStudentByPhone(phoneNumber)
      
      if (student) {
        // Link the student
        await api.updateStudent(student.id, { telegramChatId: chatId })
        
        await sendTelegramMessage(
          `✅ Account Linked!\n\nHello ${student.fullName}, your account is now linked to this Telegram bot. You will receive lesson reminders and updates here.`,
          chatId
        )
      } else {
        await sendTelegramMessage(
          `❌ Student not found.\n\nWe couldn't find a student account registered with the phone number ${phoneNumber}. Please ensure your phone number matches the one in the ITLand Teacher Panel.`,
          chatId
        )
      }
    } else if (body.message?.text === '/start') {
      const chatId = body.message.chat.id.toString()
      
      await sendTelegramMessage(
        `👋 Welcome to ITLand Notification Bot!\n\nPlease click the button below to share your contact and link your account.`,
        chatId
      )
      
      // Sending a reply keyboard to share contact
      const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: '👇 Click below to link your account:',
          reply_markup: {
            keyboard: [[{ text: '📱 Share Contact', request_contact: true }]],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        })
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
