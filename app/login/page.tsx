"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { BookOpen } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Teacher State
  const [teacherEmail, setTeacherEmail] = useState("")
  const [teacherPassword, setTeacherPassword] = useState("")

  // Student State
  const [studentPhone, setStudentPhone] = useState("")
  const [studentPassword, setStudentPassword] = useState("")
  
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simple hardcoded check for demo purposes
    if (teacherEmail === "admin@itland.com" && teacherPassword === "admin123") {
        const user = { name: "Alex Teacher", email: "admin@itland.com", role: "teacher", id: "admin-1" }
        
        // Create server-side session
        await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user })
        })

        localStorage.setItem("currentUser", JSON.stringify(user))
        router.push("/")
    } else {
        alert("Invalid email or password")
    }
    setIsLoading(false)
  }

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
        // Secure server-side verification
        const verifyResponse = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contact: studentPhone, password: studentPassword })
        })

        const verifyResult = await verifyResponse.json()

        if (verifyResult.success && verifyResult.student) {
            const student = verifyResult.student
            const userData = { ...student, role: "student" }
            
            // Create server-side session
            await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user: userData })
            })

            localStorage.setItem("currentUser", JSON.stringify(userData))
            localStorage.setItem("currentStudent", JSON.stringify(student))
            router.push("/student")
        } else {
            alert(verifyResult.error || "Invalid credentials")
        }
    } catch (error) {
        console.error("Login failed", error)
        alert("Login failed")
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <div className="flex justify-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
        </div>
        
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Enter your phone/email and password to access your portal.</CardDescription>
              </CardHeader>
              <form onSubmit={handleStudentLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone or Email</Label>
                    <Input 
                        id="phone" 
                        placeholder="e.g. +1234567890" 
                        value={studentPhone}
                        onChange={e => setStudentPhone(e.target.value)}
                        required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spassword">Password</Label>
                    <Input 
                        id="spassword" 
                        type="password"
                        value={studentPassword}
                        onChange={e => setStudentPassword(e.target.value)}
                        required
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Login</CardTitle>
                <CardDescription>Enter your admin passcode.</CardDescription>
              </CardHeader>
              <form onSubmit={handleTeacherLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="temail">Email</Label>
                    <Input 
                        id="temail" 
                        type="email"
                        placeholder="admin@itland.com"
                        value={teacherEmail}
                        onChange={e => setTeacherEmail(e.target.value)}
                        required
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="tpassword">Password</Label>
                    <Input 
                        id="tpassword" 
                        type="password"
                        value={teacherPassword}
                        onChange={e => setTeacherPassword(e.target.value)}
                        required
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
