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
  const message = "👋 *Welcome to ITLand Teacher Assistant!*\n\nTo receive notifications about your lessons and homework, I need to link your account. Please click the button below to share your contact info."
  
  await sendTelegramMessage(message, chatId, {
    reply_markup: {
      keyboard: [
        [{ text: "📱 Login with Phone Number", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  })
}

/**
 * Handle contact sharing
 */
async function handleContactSharing(chatId: string, contact: { phone_number: string }) {
  const phoneNumber = contact.phone_number
  console.log(`📱 Received contact sharing from Chat ID: ${chatId}, Phone: ${phoneNumber}`)
  
  try {
    const student = await api.getStudentByPhone(phoneNumber)
    console.log(`🔍 Student search result: ${student ? `Found (${student.fullName})` : 'Not Found'}`)
    
    if (student) {
      // Link student with chat ID
      await api.updateStudent(student.id, { telegramChatId: chatId })
      console.log(`✅ Successfully linked Student ${student.id} with Chat ID ${chatId}`)
      
      await sendTelegramMessage(
        `✅ *Success!*\n\nHello ${student.fullName}, your account has been linked. You will now receive notifications here!`,
        chatId
      )
    } else {
      console.warn(`❌ No student found matching phone number: ${phoneNumber}`)
      await sendTelegramMessage(
        "❌ *Authentication Failed*\n\nSorry, I couldn't find a student with this phone number in our system. Please make sure your phone number in the portal matches the one you just shared.",
        chatId
      )
    }
  } catch (error: any) {
    console.error("🚨 Bot auth error details:", error.message || error)
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
  try {
    const students = await api.getStudents()
    const student = students.find(s => s.telegramChatId === chatId)
    
    if (student) {
      // Get upcoming lessons count for this student
      let upcomingCount = 0
      try {
        const lessons = await api.getLessons({ studentId: student.id })
        upcomingCount = lessons.filter(l => l.status === 'upcoming').length
      } catch {}

      const statusEmoji = student.status === 'active' ? '🟢' : student.status === 'paused' ? '🟡' : '🔴'
      
      await sendTelegramMessage(
        `👤 *Your Profile*\n\n` +
        `*Name:* ${student.fullName}\n` +
        `*Status:* ${statusEmoji} ${student.status}\n` +
        `💰 *Lesson Balance:* ${student.lessonBalance} lesson${student.lessonBalance !== 1 ? 's' : ''}\n` +
        `📅 *Upcoming Lessons:* ${upcomingCount}\n\n` +
        `_Use /help to see available commands._`,
        chatId
      )
    } else {
      await sendTelegramMessage(
        `❌ *Not Linked*\n\nYour Telegram account is not linked to any student profile.\n\nUse /start to link your account by sharing your phone number.`,
        chatId
      )
    }
  } catch (error: any) {
    console.error('[Bot] /status error:', error.message || error)
    await sendTelegramMessage('⚠️ Could not fetch your status. Please try again later.', chatId)
  }
}
