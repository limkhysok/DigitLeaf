"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import Image from "next/image"
import { IconEye, IconEyeOff, IconLoader2, IconAlertCircle, IconCheck } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [capsLock, setCapsLock] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const passwordRef = React.useRef<HTMLInputElement>(null)

  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setErrorMsg("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setErrorMsg("")
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("The server is taking too long to respond. Please check your connection.")), 10000)
      )
      await Promise.race([login(username, password), timeoutPromise])
      setIsSuccess(true)
      // Note: The actual redirect will be handled by the useEffect watching isAuthenticated
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Incorrect username or password"
      setErrorMsg(message)
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <IconLoader2 className="animate-spin size-8 text-[#009640]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-x-hidden bg-white">
      {isSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center space-x-2 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-md shadow-sm">
            <IconCheck className="size-5" />
            <p className="text-sm font-medium">Login successful! Redirecting...</p>
          </div>
        </div>
      )}

      {/* Brand Panel */}
      <div className="hidden md:flex md:w-[42%] bg-[#009640] items-center justify-center relative p-8 lg:p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 lg:space-y-6">
          <div className="bg-transparent">
            <Image src="/assets/white-kaic.png" alt="Logo" width={140} height={140} priority unoptimized />
          </div>
          <div className="space-y-1 lg:space-y-2">
            <h1 className="text-xl lg:text-2xl font-branding tracking-widest text-white leading-tight">K.A.I.C</h1>
          </div>
        </div>
      </div>

      {/* Login Section */}
      <div className="flex-1 flex flex-col items-center justify-start pt-14 md:pt-0 md:justify-center min-h-svh md:min-h-full p-6 sm:p-12 md:p-16 lg:p-24 bg-white relative">
        <div className="w-full max-w-85 lg:max-w-sm space-y-8 md:space-y-10">
          <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-3">
            <div className="md:hidden flex flex-col items-center mb-2">
              <Image src="/assets/newKAIC.png" alt="Logo" width={80} height={80} priority className="object-contain" />
            </div>
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Sign In</h2>
              <p className="text-sm text-muted-foreground font-medium">Welcome back to your workspace</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (errorMsg) setErrorMsg("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      passwordRef.current?.focus()
                    }
                  }}
                  placeholder="Enter your username"
                  className="h-9 text-sm rounded-md px-3 bg-green-50/80 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40 focus:ring-2 focus:ring-[#009640]/20 focus:outline-none transition-all"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errorMsg) setErrorMsg("")
                    }}
                    onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                    placeholder="••••••••"
                    className="h-9 text-sm pl-3 pr-12 rounded-md bg-green-50/80 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40 focus:ring-2 focus:ring-[#009640]/20 focus:outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button type="button" disabled={isLoading} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#009640] disabled:opacity-50 disabled:cursor-not-allowed">
                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
                    <IconAlertCircle className="size-3.5" />
                    Caps lock is on
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-9 bg-[#009640] hover:bg-[#008a3b] font-medium rounded-md transition-all active:scale-[0.98]">
              {isLoading ? <IconLoader2 className="animate-spin size-5 font-medium" /> : "Sign In"}
            </Button>

            {errorMsg && (
              <div className="flex items-center space-x-2 bg-red-50/80 text-red-600 border border-red-200 p-3 rounded-md animate-in fade-in slide-in-from-top-1">
                <IconAlertCircle className="size-5 shrink-0" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
