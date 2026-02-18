import { api } from "@/lib/api"
import { sendTelegramMessage } from "./telegram"

/**
 * Handle incoming Telegram updates
 */
export async function handleTelegramUpdate(update: any) {
  const message = update.message
  if (!message) return

  const chatId = message.chat.id.toString()
  const text = message.text

  // 1. Handle Contact Sharing (Login Flow)
  if (message.contact) {
    return handleContactSharing(chatId, message.contact)
  }

  // 2. Handle Commands
  if (text?.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase()
    
    switch (command) {
      case '/start':
        return handleStartCommand(chatId)
      case '/help':
        return handleHelpCommand(chatId)
      case '/status':
        return handleStatusCommand(chatId)
      default:
        await sendTelegramMessage("Unknown command. Type /help for assistance.", chatId)
    }
  }
  
  // 3. Default Response
  await sendTelegramMessage("Please use the menu or type /help to see what I can do!", chatId)
}

/**
 * /start command - Show login button
 */
async function handleStartCommand(chatId: string) {
  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  
  const payload = {
    chat_id: chatId,
    text: "👋 *Welcome to ITLand Teacher Assistant!*\n\nTo receive notifications about your lessons and homework, I need to link your account. Please click the button below to share your contact info.",
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: "📱 Login with Phone Number", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}

/**
 * Handle contact sharing
 */
async function handleContactSharing(chatId: string, contact: { phone_number: string }) {
  const phoneNumber = contact.phone_number
  
  try {
    const student = await api.getStudentByPhone(phoneNumber)
    
    if (student) {
      // Link student with chat ID
      await api.updateStudent(student.id, { telegramChatId: chatId })
      
      await sendTelegramMessage(
        `✅ *Success!*\n\nHello ${student.fullName}, your account has been linked. You will now receive notifications here!`,
        chatId
      )
    } else {
      await sendTelegramMessage(
        "❌ *Authentication Failed*\n\nSorry, I couldn't find a student with this phone number in our system. Please contact your teacher.",
        chatId
      )
    }
  } catch (error) {
    console.error("Bot auth error:", error)
    await sendTelegramMessage("⚠️ An error occurred during authentication. Please try again later.", chatId)
  }
}

async function handleHelpCommand(chatId: string) {
  const helpText = `
*Available Commands:*
/start - Start the bot and login
/status - Check your current status
/help - Show this help message
  `
  await sendTelegramMessage(helpText, chatId)
}

async function handleStatusCommand(chatId: string) {
  // Find student by chatId
  const students = await api.getStudents()
  const student = students.find(s => s.telegramChatId === chatId)
  
  if (student) {
    await sendTelegramMessage(
      `👤 *Profile:* ${student.fullName}\n📚 *Status:* ${student.status}\n💰 *Balance:* ${student.lessonBalance} lessons`,
      chatId
    )
  } else {
    await sendTelegramMessage("You are not logged in. Use /start to link your account.", chatId)
  }
}
