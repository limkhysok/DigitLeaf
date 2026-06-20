"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import Image from "next/image"
import { IconEye, IconEyeOff, IconLeaf, IconLoader2 } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"

interface Leaf {
  id: number
  left: string
  delay: string
  duration: string
  size: number
  opacity: number
  rotation: number
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true)
      setLeaves(Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 10}s`,
        duration: `${10 + Math.random() * 15}s`,
        size: 10 + Math.random() * 25,
        opacity: 0.1 + Math.random() * 0.2,
        rotation: Math.random() * 360,
      })))
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setErrorMsg("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setErrorMsg("")
    try {
      await login(username, password)
      setIsLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Incorrect username or password"
      setErrorMsg(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-x-hidden bg-white">
      {/* Brand Panel */}
      <div className="hidden md:flex md:w-[42%] bg-[#009640] items-center justify-center relative p-8 lg:p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute inset-0 pointer-events-none">
          {mounted && leaves.map((leaf) => (
            <div
              key={leaf.id}
              className="absolute animate-leaf-fall-subtle text-white"
              style={{
                left: leaf.left,
                animationDelay: leaf.delay,
                animationDuration: leaf.duration,
                width: leaf.size,
                height: leaf.size,
                opacity: leaf.opacity,
                transform: `rotate(${leaf.rotation}deg)`,
              }}
            >
              <IconLeaf size={leaf.size} stroke={1} />
            </div>
          ))}
        </div>
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
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="h-10 text-sm rounded-md px-5 bg-green-50/80 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-sm pl-5 pr-12 rounded-md bg-green-50/80 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#009640]">
                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-10 bg-[#009640] hover:bg-[#008a3b] font-bold rounded-md transition-all active:scale-[0.98]">
              {isLoading ? <IconLoader2 className="animate-spin size-5 font-medium" /> : "Sign In"}
            </Button>

            {errorMsg && <p className="text-sm font-medium text-red-500 text-center animate-in fade-in slide-in-from-top-1">{errorMsg}</p>}
          </form>

          <div className="flex justify-center pt-6">
            <p className="text-[12px] text-muted-foreground">
              Can&apos;t sign in? Get help <a href="https://t.me/soklimkhy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#009640] hover:underline">Telegram</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
