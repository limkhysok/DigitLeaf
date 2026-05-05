"use client"

import React, { useState, useEffect, Suspense, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { IconShieldCheck, IconLoader2, IconAlertCircle, IconLeaf } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"

function VerifyContent() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const router = useRouter()
  const searchParams = useSearchParams()
  const username = searchParams.get("username")
  const { verifyTOTP, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
    if (!username) {
      router.push("/login")
    }
  }, [isAuthenticated, router, username])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!username || code.length !== 6) return

    setIsLoading(true)
    setError("")
    try {
      await verifyTOTP(username, code)
    } catch (err) {
      const error = err as Error
      setError(error.message || "Invalid verification code")
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Decorative Leaves Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <IconLeaf size={200} className="absolute -top-20 -left-20 rotate-45 text-[#009640]" />
        <IconLeaf size={150} className="absolute top-1/2 -right-10 -translate-y-1/2 -rotate-12 text-[#009640]" />
        <IconLeaf size={180} className="absolute -bottom-10 left-1/4 rotate-[110deg] text-[#009640]" />
      </div>

      <div className="w-full max-w-[400px] space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="size-20 rounded-full bg-[#009640]/5 border border-[#009640]/20 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full bg-[#009640]/10 animate-pulse" />
            <IconShieldCheck size={40} className="text-[#009640] relative z-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-branding tracking-tight text-foreground">K.A.I.C</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Security Layer</p>
          </div>
        </div>

        <div className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden shadow-none ring-0">
          <div className="p-10 space-y-8">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold tracking-tight">Two-Step Verification</h2>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Enter the 6-digit code from your <br />
                <span className="font-bold text-[#009640]">Authenticator App</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="code" className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-6">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000 000"
                  className="h-11 text-center text-2xl tracking-[0.5em] font-bold bg-muted/20 border-border/40 rounded-full focus:bg-white transition-all shadow-none"
                  autoFocus
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || code.length !== 6} 
                className="w-full h-11 bg-[#009640] hover:bg-[#008a3b] font-bold text-xs capitalize tracking-widest rounded-full transition-all shadow-none"
              >
                {isLoading ? <IconLoader2 className="animate-spin size-5" /> : "Verify & Continue"}
              </Button>

              {error && (
                <div className="flex items-center gap-2 p-4 rounded-3xl bg-destructive/5 text-destructive text-xs font-bold border border-destructive/10 animate-in fade-in slide-in-from-top-2">
                  <IconAlertCircle size={16} />
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/login")} 
            className="text-xs text-muted-foreground hover:text-[#009640] font-bold rounded-full px-8 h-10"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><IconLoader2 className="animate-spin text-emerald-600" /></div>}>
      <VerifyContent />
    </Suspense>
  )
}
