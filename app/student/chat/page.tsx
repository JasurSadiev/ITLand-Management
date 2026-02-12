"use client"

import { useEffect, useState, useRef } from "react"
import { Header } from "@/components/header"
import { StudentSidebar } from "@/components/student-sidebar"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import type { Student, Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Paperclip, Smile } from "lucide-react"
import { format } from "date-fns"
import { useCustomization } from "@/lib/context"
import { notifications } from "@/lib/notifications/notifier"

export default function StudentChatPage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { sidebarCollapsed } = useCustomization()

  useEffect(() => {
    loadStudentAndMessages()
  }, [])

  const loadStudentAndMessages = async () => {
    try {
        // Simple auth check via cookie (demo only)
        const match = document.cookie.match(new RegExp('(^| )student-id=([^;]+)'))
        const studentId = match ? match[2] : null

        if (!studentId) {
            window.location.href = "/login"
            return
        }

        const currentStudent = await api.getStudentById(studentId)
        setStudent(currentStudent)
        
        // Load messages
        const msgs = await api.getMessages(studentId)
        setMessages(msgs)
        scrollToBottom()

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`chat:${studentId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages', 
                filter: `student_id=eq.${studentId}`
            }, (payload) => {
                const newMsg = payload.new as any 
                const mappedMsg: Message = {
                    id: newMsg.id,
                    studentId: newMsg.student_id,
                    teacherId: newMsg.teacher_id,
                    sender: newMsg.sender,
                    content: newMsg.content,
                    read: newMsg.read,
                    createdAt: newMsg.created_at
                }
                setMessages(prev => {
                    const exists = prev.some(m => m.id === mappedMsg.id)
                    if (exists) return prev
                    return [...prev, mappedMsg]
                })
                scrollToBottom()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }

    } catch (error) {
        console.error("Failed to load chat", error)
    } finally {
        setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, 100)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!student || !newMessage.trim() || sending) return

    const content = newMessage.trim()
    setNewMessage("") 
    setSending(true)

    try {
      const sentMsg = await api.sendMessage({
          studentId: student.id,
          sender: 'student',
          content: content
      })
      
      setMessages(prev => [...prev, sentMsg])
      scrollToBottom()

      // Notify teacher via Telegram
      notifications.chatMessageReceived(student.fullName, student.id, content)
      
    } catch (error) {
      console.error("Failed to send message", error)
      setNewMessage(content) 
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <StudentSidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Messages" subtitle="Chat with your teacher" />
        
        <main className="h-[calc(100vh-64px)] p-4 lg:p-6 pb-20 lg:pb-6">
            <div className="h-full bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">Loading chat...</div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        T
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">Teacher</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs text-muted-foreground">Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/10 relative" ref={scrollRef}>
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, idx) => {
                                    const isStudent = msg.sender === 'student'
                                    const showAvatar = idx === 0 || messages[idx-1].sender !== msg.sender
                                    
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={cn(
                                                "flex gap-3 max-w-[85%] lg:max-w-[75%]",
                                                isStudent ? "ml-auto flex-row-reverse" : ""
                                            )}
                                        >
                                            <Avatar className={cn("h-8 w-8 mt-1 border border-border shrink-0", !showAvatar && "opacity-0")}>
                                                <AvatarFallback className={cn("text-xs", isStudent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                    {isStudent ? student?.fullName.substring(0,1).toUpperCase() : "T"}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div 
                                                    className={cn(
                                                        "p-3 rounded-2xl text-sm shadow-sm break-words",
                                                        isStudent 
                                                            ? "bg-primary text-primary-foreground rounded-br-none" 
                                                            : "bg-white dark:bg-muted rounded-bl-none border border-border/50"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                                <span className={cn("text-[10px] text-muted-foreground px-1", isStudent ? "text-right" : "")}>
                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                    {isStudent && (
                                                        <span className="ml-1">
                                                            {msg.read ? "✓✓" : "✓"}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                                {messages.length === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50">
                                        <Smile className="h-10 w-10 mb-2" />
                                        <p>No messages yet. Ask your teacher anything!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background">
                            <form 
                                onSubmit={handleSendMessage}
                                className="flex items-end gap-2 bg-muted/30 p-2 rounded-xl border border-border/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
                            >
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-lg hidden sm:flex">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <Input 
                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 min-h-[44px]" 
                                    placeholder="Type your message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button 
                                    type="submit" 
                                    disabled={!newMessage.trim() || sending}
                                    className="h-10 w-10 rounded-lg shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </main>
      </div>
    </div>
  )
}
