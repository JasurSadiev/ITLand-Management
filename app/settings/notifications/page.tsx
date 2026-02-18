"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle2, XCircle, Send, Link, RefreshCw } from "lucide-react"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"

export default function NotificationSettingsPage() {
  const [testing, setTesting] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<any>(null)
  const { sidebarCollapsed } = useCustomization()

  const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
  const isConfigured = Boolean(botToken && chatId)

  useEffect(() => {
    if (isConfigured) {
      fetchWebhookInfo()
    }
  }, [isConfigured])

  const fetchWebhookInfo = async () => {
    try {
      const res = await fetch('/api/telegram/setup')
      const data = await res.json()
      setWebhookInfo(data)
    } catch {}
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' })
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, message: 'Request failed. Is the server running?' })
    }
    setTesting(false)
  }

  const handleRegisterWebhook = async () => {
    setRegistering(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register' })
      })
      const data = await res.json()
      setTestResult(data)
      if (data.success) fetchWebhookInfo()
    } catch {
      setTestResult({ success: false, message: 'Request failed. Is the server running?' })
    }
    setRegistering(false)
  }

  const webhookUrl = webhookInfo?.webhook?.result?.url
  const webhookActive = Boolean(webhookUrl)

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
          {/* Bot Status */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Bot Token</p>
                      <p className="text-sm font-medium">✅ Configured</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Teacher Chat ID</p>
                      <p className="text-sm font-medium">✅ {chatId}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Webhook Status</p>
                      {webhookActive ? (
                        <p className="text-sm font-medium text-emerald-600">✅ Active</p>
                      ) : (
                        <p className="text-sm font-medium text-amber-600">⚠️ Not registered</p>
                      )}
                    </div>
                    {webhookUrl && (
                      <div className="p-3 rounded-lg border bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">Webhook URL</p>
                        <p className="text-xs font-mono truncate">{webhookUrl}</p>
                      </div>
                    )}
                  </div>

                  {!webhookActive && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium mb-1">⚠️ Webhook Not Registered</p>
                      <p className="text-xs text-amber-700">
                        The bot cannot receive messages until the webhook is registered. Click "Register Webhook" below.
                        <br />
                        <strong>Note:</strong> This requires your app to be deployed to a public HTTPS URL (not localhost).
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleTestConnection} disabled={testing || registering}>
                      <Send className="h-4 w-4 mr-2" />
                      {testing ? "Sending..." : "Send Test Message"}
                    </Button>
                    <Button 
                      onClick={handleRegisterWebhook} 
                      disabled={testing || registering}
                      variant="outline"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      {registering ? "Registering..." : "Register Webhook"}
                    </Button>
                    <Button onClick={fetchWebhookInfo} variant="ghost" size="icon">
                      <RefreshCw className="h-4 w-4" />
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
                    Telegram notifications are not configured yet. Follow the setup instructions below.
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Create a Telegram Bot</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Open Telegram and search for <code className="bg-muted px-1 rounded">@BotFather</code></li>
                      <li>Send <code className="bg-muted px-1 rounded">/newbot</code> and follow the prompts</li>
                      <li>Copy the bot token provided</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Add Credentials to Project</h4>
                    <code className="block bg-slate-950 text-emerald-400 p-3 rounded text-sm">
                      NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token<br/>
                      NEXT_PUBLIC_TELEGRAM_CHAT_ID=your_chat_id<br/>
                      TELEGRAM_BOT_TOKEN=your_bot_token<br/>
                      TELEGRAM_CHAT_ID=your_chat_id
                    </code>
                    <p className="text-sm text-muted-foreground">Restart the dev server after saving.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Register Webhook (after deploying)</h4>
                    <p className="text-sm text-muted-foreground">
                      After deploying to a public URL, click <strong>"Register Webhook"</strong> above. This tells Telegram where to send bot messages.
                    </p>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-xs text-blue-800">
                        💡 Webhooks require HTTPS. For local testing, use <code className="bg-blue-100 px-1 rounded">ngrok</code> to expose your local server.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">4</div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Link Student Accounts</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Students open the bot and send <code className="bg-muted px-1 rounded">/start</code></li>
                      <li>They click <b>"📱 Share Contact"</b> to link their account</li>
                      <li>The bot automatically matches them by phone number</li>
                    </ol>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <p className="text-xs text-emerald-800">
                        ✨ Once linked, students stay linked permanently — no need to re-link unless they block the bot.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Events */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Events</CardTitle>
              <CardDescription>Active notification triggers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {[
                  { icon: "❌", title: "Lesson Cancelled by Teacher", desc: "Notifies the student via Telegram" },
                  { icon: "❌", title: "Lesson Cancelled by Student", desc: "Notifies the teacher via Telegram" },
                  { icon: "📅", title: "Lesson Rescheduled", desc: "Student request → teacher notified; Approval → student notified" },
                  { icon: "⏰", title: "30-min Reminder", desc: "Sent to students before each lesson (requires cron job)" },
                  { icon: "📝", title: "Homework Checked", desc: "Notifies the student when teacher reviews homework" },
                  { icon: "💰", title: "Payment Received", desc: "Notifies the student of payment confirmation" },
                  { icon: "💬", title: "New Chat Message", desc: "Notifies the teacher when a student sends a message" },
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
