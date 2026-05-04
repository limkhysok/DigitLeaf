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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative Leaves */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <IconLeaf size={200} className="absolute -top-20 -left-20 rotate-45 text-emerald-600" />
        <IconLeaf size={150} className="absolute top-1/2 -right-10 -translate-y-1/2 -rotate-12 text-emerald-600" />
        <IconLeaf size={180} className="absolute -bottom-10 left-1/4 rotate-[110deg] text-emerald-600" />
      </div>

      <div className="w-full max-w-[400px] space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="size-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <IconShieldCheck size={32} className="text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Two-Step Verification</h1>
            <p className="text-sm text-muted-foreground">
              Please enter the 6-digit code from your <br />
              <span className="font-bold text-foreground">Google Authenticator</span> app.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 shadow-xl border border-border/40 rounded-none space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verification Code</Label>
            <Input
              id="code"
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000 000"
              className="h-14 text-center text-2xl tracking-[0.5em] font-bold bg-muted/20 border-muted-foreground/10 focus:border-emerald-600/40"
              autoFocus
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || code.length !== 6} 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-none shadow-md transition-all"
          >
            {isLoading ? <IconLoader2 className="animate-spin size-5" /> : "Verify & Continue"}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium animate-in fade-in zoom-in-95">
              <IconAlertCircle size={18} />
              {error}
            </div>
          )}
        </form>

        <div className="text-center">
          <Button variant="link" onClick={() => router.push("/login")} className="text-xs text-muted-foreground hover:text-emerald-600 font-medium">
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
