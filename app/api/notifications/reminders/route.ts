import { NextResponse } from 'next/server'
import { checkAndSendReminders } from '@/lib/notifications/reminders'

/**
 * API route to trigger 30-minute lesson reminders
 * This should be called by a cron job every 5-10 minutes
 */
export async function GET() {
  try {
    const sentCount = await checkAndSendReminders()
    return NextResponse.json({ 
      success: true, 
      sentCount,
      message: `Checked lessons and sent ${sentCount} reminders.`
    })
  } catch (error: any) {
    console.error('Reminder trigger error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
