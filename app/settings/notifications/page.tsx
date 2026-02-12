"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, XCircle, Send } from "lucide-react"
import { useCustomization } from "@/components/customization-provider"
import { cn } from "@/lib/utils"
import { testTelegramConnection, sendTelegramMessage } from "@/lib/notifications/telegram"

export default function NotificationSettingsPage() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const { sidebarCollapsed } = useCustomization()

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    const result = await testTelegramConnection()
    setTestResult(result)
    setTesting(false)
  }

  const handleSendTestMessage = async () => {
    setTesting(true)
    const success = await sendTelegramMessage("🎉 *Test Notification*\\n\\nYour Telegram notifications are working perfectly!")
    setTestResult({
      success,
      message: success ? "Test message sent successfully!" : "Failed to send test message. Check your credentials."
    })
    setTesting(false)
  }

  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
  const isConfigured = Boolean(botToken && chatId)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header 
          title="Notification Settings" 
          subtitle="Configure Telegram notifications for student events"
        />
        
        <main className="p-4 lg:p-6 space-y-6">
          {/* Configuration Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Telegram Bot Status
                  </CardTitle>
                  <CardDescription>Real-time notifications via Telegram</CardDescription>
                </div>
                {isConfigured ? (
                  <Badge variant="default" className="bg-emerald-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConfigured ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      ✅ Bot Token: Configured
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ✅ Chat ID: Configured
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleTestConnection} disabled={testing}>
                      {testing ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button onClick={handleSendTestMessage} disabled={testing} variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Message
                    </Button>
                  </div>

                  {testResult && (
                    <div className={cn(
                      "p-4 rounded-lg border",
                      testResult.success ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                    )}>
                      <p className={cn(
                        "text-sm font-medium",
                        testResult.success ? "text-emerald-900" : "text-rose-900"
                      )}>
                        {testResult.message}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Telegram notifications are not configured yet. Follow the setup instructions below to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>Follow these steps to enable Telegram notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    1
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Create a Telegram Bot</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Open Telegram and search for <code className="bg-muted px-1 rounded">@BotFather</code></li>
                      <li>Send <code className="bg-muted px-1 rounded">/newbot</code> command</li>
                      <li>Choose a name (e.g., "ITLand Teacher Assistant")</li>
                      <li>Choose a username (must end in 'bot', e.g., "itland_teacher_bot")</li>
                      <li>Copy the bot token (looks like: <code className="bg-muted px-1 rounded text-xs">123456789:ABCdef...</code>)</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    2
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Get Your Chat ID</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Send any message to your new bot (just say "hi")</li>
                      <li>Open this URL in your browser (replace <code className="bg-muted px-1 rounded text-xs">&lt;YOUR_BOT_TOKEN&gt;</code>):</li>
                    </ol>
                    <code className="block bg-muted p-2 rounded text-xs break-all">
                      https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/getUpdates
                    </code>
                    <p className="text-sm text-muted-foreground">
                      Look for <code className="bg-muted px-1 rounded text-xs">"chat":{"{"}"id":123456789</code> and save that number
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    3
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Add Credentials to Project</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Create/edit <code className="bg-muted px-1 rounded">.env.local</code> in your project root</li>
                      <li>Add these lines:</li>
                    </ol>
                    <code className="block bg-slate-950 text-emerald-400 p-3 rounded text-sm">
                      NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token_here<br/>
                      NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id_here
                    </code>
                    <p className="text-sm text-muted-foreground">
                      Save the file and restart your dev server (<code className="bg-muted px-1 rounded">npm run dev</code>)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Events */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Events</CardTitle>
              <CardDescription>You'll receive Telegram notifications for these events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { icon: "❌", title: "Lesson Cancelled", desc: "When a student cancels a lesson" },
                  { icon: "📅", title: "Lesson Rescheduled", desc: "When a student requests to reschedule" },
                  { icon: "📝", title: "Homework Submitted", desc: "When a student submits homework" },
                  { icon: "⚠️", title: "Balance Alert", desc: "When a student's balance reaches 0" },
                  { icon: "⏰", title: "No Upcoming Lessons", desc: "When a student has no lessons scheduled" },
                  { icon: "💰", title: "Payment Received", desc: "When a new payment is recorded" },
                  { icon: "🎉", title: "New Student", desc: "When a new student registers" },
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <span className="text-2xl">{event.icon}</span>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
