"use client"

import { useState, useEffect } from "react"

import { Button } from "@workspace/ui/components/button"

import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import Image from "next/image"
import { IconEye, IconEyeOff, IconLeaf, IconLoader2 } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    setMounted(true)
    // Subtler leaves for the login page
    setLeaves(Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
      duration: `${10 + Math.random() * 15}s`,
      size: 10 + Math.random() * 25,
      opacity: 0.05 + Math.random() * 0.15,
    })))
  }, [])

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    
    const username = e.target.username.value
    const password = e.target.password.value

    try {
      await login(username, password)
      // router.push("/dashboard") is already handled in login function
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to login. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-x-hidden">

      {/* Brand Panel: Hidden on mobile, synced width with landing page */}
      <div className="hidden md:flex md:w-[42%] bg-[#009640] items-center justify-center relative p-8 lg:p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        {/* Falling Leaves Background Layer */}
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
              }}
            >
              <IconLeaf size={leaf.size} stroke={1} />
            </div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 lg:space-y-6">
          <div className="bg-transparent">
            <Image
              src="/assets/white-kaic.png"
              alt="Logo"
              width={140}
              height={140}
              priority
              unoptimized
            />
          </div>
          <div className="space-y-1 lg:space-y-2">
            <h1 className="text-xl lg:text-2xl font-black tracking-[0.1em] text-white uppercase leading-tight">
              K.A.I.C
            </h1>
            <p className="text-green-50/70 text-[10px] lg:text-sm tracking-widest uppercase font-medium">
              INTERNAL MANAGEMENT SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Login Section: Adapts width based on sidebar existence */}
      <div className="flex-1 flex flex-col items-center justify-start pt-20 md:pt-0 md:justify-center min-h-[100svh] md:min-h-full p-6 sm:p-12 md:p-16 lg:p-24 bg-white relative transition-all duration-1000 ease-in-out">
        <div className="w-full max-w-[340px] lg:max-w-sm space-y-10 animate-in fade-in duration-1000 slide-in-from-right-10">
          {/* Refined Header: Centered on mobile, aligned on desktop */}
          <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-3">
            {/* Logo/Brand Section (Visible on Mobile/Tablet) */}
            <div className="md:hidden flex flex-col items-center space-y-6">
              <div className="bg-transparent">
                <Image
                  src="/assets/newKAIC.png"
                  alt="Logo"
                  width={90}
                  height={90}
                  priority
                  className="object-contain mix-blend-multiply"
                />
              </div>
            </div>
            {/* Title Section */}
            <div className="text-center md:text-left space-y-1 pt-0 md:pt-0">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Sign In
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Welcome back to your workspace
              </p>
            </div>
          </div>

          <form className="space-y-5 lg:space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="h-11 text-sm rounded-sm bg-muted/20 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40 transition-all placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 text-sm pr-10 rounded-sm bg-muted/20 border-muted-foreground/10 focus:bg-background focus:border-[#009640]/40 transition-all placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#009640] transition-colors"
                >
                  {showPassword ? (
                    <IconEyeOff className="size-4 lg:size-5" />
                  ) : (
                    <IconEye className="size-4 lg:size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" className="rounded-none border-muted-foreground/30 data-[state=checked]:bg-[#009640] data-[state=checked]:border-[#009640]" />
              <label
                htmlFor="remember"
                className="text-xs lg:text-sm font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                Remember me
              </label>
            </div>

            {errorMsg && (
              <p className="text-sm font-medium text-red-500">{errorMsg}</p>
            )}

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm rounded-sm bg-[#009640] hover:bg-[#008a3b] text-white font-bold transition-all shadow-md shadow-[#009640]/10 active:scale-[0.98]"
            >
              {isLoading ? (
                <IconLoader2 className="animate-spin size-5" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="flex justify-center">
            <p className="text-[12px] lg:text-xs text-muted-foreground">
              Can't sign in? Get help{" "}
              <a
                href="https://t.me/soklimkhy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#009640] hover:underline underline-offset-4 transition-colors"
              >
                Telegram
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
