"use client"

import { useEffect, useState, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import type { Student, Message } from "@/lib/types"
import { useCustomization } from "@/lib/context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react"
import { format } from "date-fns"

export default function ChatPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { sidebarCollapsed } = useCustomization()

  // Load students with chat summaries on mount
  useEffect(() => {
    loadStudents()
    
    // Subscribe to ANY message change to update the student list order/badges
    const globalChannel = supabase
        .channel('global-chat-list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
            loadStudents()
        })
        .subscribe()

    return () => {
        supabase.removeChannel(globalChannel)
    }
  }, [])
  
  // Load messages when student selected
  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.id)
      
      // Subscribe to real-time changes
      const channel = supabase
        .channel(`chat:${selectedStudent.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages', 
            filter: `student_id=eq.${selectedStudent.id}`
        }, (payload) => {
            const newMsg = payload.new as any 
            // Map DB snake_case to camelCase manually since API does it usually
            const mappedMsg: Message = {
                id: newMsg.id,
                studentId: newMsg.student_id,
                teacherId: newMsg.teacher_id,
                sender: newMsg.sender,
                content: newMsg.content,
                read: newMsg.read,
                createdAt: newMsg.created_at
            }
            // Avoid duplicates if we optimistically added it
            setMessages(prev => {
                const exists = prev.some(m => m.id === mappedMsg.id)
                if (exists) return prev
                return [...prev, mappedMsg]
            })
            scrollToBottom()
            // Also refresh student list to update badges/order
            loadStudents()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      const data = await api.getChatSummaries()
      setStudents(data)
    } catch (error) {
      console.error("Failed to load students", error)
    } finally {
        setLoading(false)
    }
  }

  const loadMessages = async (studentId: string) => {
    try {
      const msgs = await api.getMessages(studentId)
      setMessages(msgs)
      scrollToBottom()
      
      // Mark unseen student messages as read
      const unreadIds = msgs.filter(m => m.sender === 'student' && !m.read).map(m => m.id)
      if (unreadIds.length > 0) {
          await api.markAsRead(unreadIds)
          // Refresh list to clear badge
          loadStudents()
      }
    } catch (error) {
      console.error("Failed to load messages", error)
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
    if (!selectedStudent || !newMessage.trim() || sending) return

    const content = newMessage.trim()
    setNewMessage("") // Clear immediately for UX
    setSending(true)

    try {
      const sentMsg = await api.sendMessage({
          studentId: selectedStudent.id,
          sender: 'teacher',
          content: content
      })
      
      setMessages(prev => [...prev, sentMsg])
      scrollToBottom()
      loadStudents() // Update list order (teacher sent last message)
      
    } catch (error) {
      console.error("Failed to send message", error)
      setNewMessage(content) // Restore
    } finally {
      setSending(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background transition-all duration-300 ease-in-out">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        <Header title="Messages" subtitle="Chat with your students" />
        
        <div className="h-[calc(100vh-64px)] p-4 lg:p-6 flex gap-4 lg:gap-6">
            {/* Student List Sidebar */}
            <div className="w-80 hidden lg:flex flex-col bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search students..." 
                            className="pl-9 bg-muted/50 border-input/50" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto"> 
                    <div className="flex flex-col">
                        {filteredStudents.map((student: any) => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={cn(
                                    "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-l-2 border-transparent w-full",
                                    selectedStudent?.id === student.id && "bg-muted/50 border-primary"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {student.fullName.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {student.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white border border-white">
                                            {student.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={cn("font-medium truncate text-sm", student.unreadCount > 0 && "font-bold text-foreground")}>{student.fullName}</span>
                                        {student.lastMessage && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(student.lastMessage.createdAt), 'h:mm a')}
                                            </span>
                                        )}
                                    </div>
                                    <p className={cn("text-xs truncate", student.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                                        {student.lastMessage ? (
                                            student.lastMessage.sender === 'teacher' ? `You: ${student.lastMessage.content}` : student.lastMessage.content
                                        ) : (
                                            "No messages yet"
                                        )}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {filteredStudents.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No students found
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
                {selectedStudent ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-muted/20 shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {selectedStudent.fullName.substring(0,2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-sm lg:text-base">{selectedStudent.fullName}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <span className="text-[10px] lg:text-xs text-muted-foreground">Active now</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 lg:gap-2">
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 lg:h-9 lg:w-9">
                                    <Phone className="h-4 w-4 lg:h-5 lg:w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 lg:h-9 lg:w-9">
                                    <Video className="h-4 w-4 lg:h-5 lg:w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8 lg:h-9 lg:w-9">
                                    <MoreVertical className="h-4 w-4 lg:h-5 lg:w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/10 relative" ref={scrollRef}>
                            <div className="flex flex-col gap-4 pb-2">
                                {messages.map((msg, idx) => {
                                    const isTeacher = msg.sender === 'teacher'
                                    const showAvatar = idx === 0 || messages[idx-1].sender !== msg.sender
                                    
                                    return (
                                        <div 
                                            key={msg.id} 
                                            className={cn(
                                                "flex gap-3 max-w-[85%] lg:max-w-[75%]",
                                                isTeacher ? "ml-auto flex-row-reverse" : ""
                                            )}
                                        >
                                            <Avatar className={cn("h-8 w-8 mt-1 border border-border shrink-0", !showAvatar && "opacity-0")}>
                                                <AvatarFallback className={cn("text-xs", isTeacher ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                    {isTeacher ? "T" : selectedStudent.fullName.substring(0,1).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div 
                                                    className={cn(
                                                        "p-3 rounded-2xl text-sm shadow-sm break-words",
                                                        isTeacher 
                                                            ? "bg-primary text-primary-foreground rounded-br-none" 
                                                            : "bg-white dark:bg-muted rounded-bl-none border border-border/50"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                                <span className={cn("text-[10px] text-muted-foreground px-1", isTeacher ? "text-right" : "")}>
                                                    {format(new Date(msg.createdAt), 'h:mm a')}
                                                    {isTeacher && (
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
                                        <p>No messages yet. Say hello! 👋</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background shrink-0">
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
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 p-4 text-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                            <Send className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Your Messages</h3>
                        <p className="text-sm max-w-xs">Select a student from the sidebar to start chatting</p>
                        
                        {/* Mobile Student List (Visible only when no student selected on mobile) */}
                        <div className="mt-8 w-full max-w-sm lg:hidden border rounded-lg overflow-hidden">
                             {/* Simplified list for mobile empty state */}
                             {filteredStudents.slice(0, 5).map(student => (
                                <button
                                    key={student.id}
                                    onClick={() => setSelectedStudent(student)}
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left border-b last:border-0 w-full bg-card"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {student.fullName.substring(0,2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{student.fullName}</span>
                                </button>
                             ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
