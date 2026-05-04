"use client"

import { useState } from "react"
import {
  IconCamera,
  IconBriefcase,
  IconLogout,
  IconLeaf,
  IconShieldCheck,
  IconLock,
  IconCheck,
  IconAlertCircle,
  IconLoader2
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"

const LEAF_PATTERN = [
  { id: 'l1', size: 24, top: '10%', left: '10%', rotate: 45 },
  { id: 'l2', size: 32, top: '65%', left: '20%', rotate: -15 },
  { id: 'l3', size: 20, top: '15%', left: '35%', rotate: 110 },
  { id: 'l4', size: 28, top: '75%', left: '45%', rotate: -45 },
  { id: 'l5', size: 24, top: '35%', left: '60%', rotate: 180 },
  { id: 'l6', size: 30, top: '10%', left: '85%', rotate: 30 },
  { id: 'l7', size: 22, top: '60%', left: '75%', rotate: 95 },
  { id: 'l8', size: 26, top: '40%', left: '5%', rotate: -60 },
  { id: 'l9', size: 20, top: '85%', left: '10%', rotate: 15 },
  { id: 'l10', size: 34, top: '25%', left: '20%', rotate: 140 },
  { id: 'l11', size: 22, top: '50%', left: '40%', rotate: 200 },
  { id: 'l12', size: 28, top: '80%', left: '70%', rotate: -110 },
]

export default function ProfilePage() {
  const { user, logout, tokens, refreshUserProfile } = useAuth()
  const [totpData, setTotpData] = useState<{ secret: string; uri: string } | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [setupError, setSetupError] = useState("")
  const [setupSuccess, setSetupSuccess] = useState(false)
  const [disableCode, setDisableCode] = useState("")

  const handleStartSetup = async () => {
    if (!tokens?.access_token) return
    setIsSettingUp(true)
    setSetupError("")
    try {
      const data = await apiClient.setupTOTP(tokens.access_token)
      setTotpData(data)
    } catch (err) {
      const error = err as Error
      setSetupError(error.message || "Failed to start TOTP setup")
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!tokens?.access_token || !user) return
    setIsSettingUp(true)
    setSetupError("")
    try {
      await apiClient.enableTOTP(tokens.access_token, user.user_name, verificationCode)
      setSetupSuccess(true)
      setTotpData(null)
      await refreshUserProfile()
      toast.success("Two-Factor Authentication enabled successfully!")
    } catch (err) {
      const error = err as Error
      setSetupError(error.message || "Failed to verify TOTP code")
      toast.error(error.message || "Verification failed")
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleDisableTOTP = async () => {
    if (!tokens?.access_token || !user) return
    
    setIsSettingUp(true)
    setSetupError("")
    try {
      await apiClient.disableTOTP(tokens.access_token, user.user_name, disableCode)
      setSetupSuccess(false)
      setDisableCode("")
      await refreshUserProfile()
      toast.success("Two-Factor Authentication disabled.")
    } catch (err) {
      const error = err as Error
      setSetupError(error.message || "Failed to disable TOTP")
      toast.error(error.message || "Failed to disable 2FA")
    } finally {
      setIsSettingUp(false)
    }
  }

  if (!user) {
    // ... (Loading state)
    return (
      <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10 w-full px-4 sm:px-0">
        {/* Existing loading card content */}
      </div>
    )
  }

  const initials = user.user_name.substring(0, 2).toUpperCase()

  // Helper component to render 2FA states and avoid nested ternaries
  const renderTOTPSection = () => {
    if (user.totp_enabled || setupSuccess) {
      return (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-none flex items-center justify-between gap-3 text-emerald-700 font-medium">
            <div className="flex items-center gap-3">
              <IconCheck size={20} stroke={3} className="bg-emerald-600 text-white rounded-full p-1" />
              <div className="space-y-0.5">
                <p className="font-bold text-base">2FA is Active</p>
                <p className="text-[11px] text-emerald-600/80 font-semibold uppercase tracking-wider">Securely linked to your authenticator app</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-[10px] bg-emerald-600 text-white px-2 py-1 font-black uppercase tracking-tighter rounded-sm">
                PROTECTED
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-destructive hover:text-destructive hover:bg-transparent font-bold text-[10px] uppercase tracking-tighter underline underline-offset-4"
                    disabled={isSettingUp}
                  >
                    {isSettingUp ? <IconLoader2 className="animate-spin size-3" /> : "Disable 2FA"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-none border-border/40">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight text-destructive">Disable 2FA?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium">
                      Enter the 6-digit code from your authenticator app to confirm you want to disable 2FA.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="py-4 space-y-2">
                    <Label htmlFor="disable-code" className="text-xs font-bold uppercase tracking-wider">Verification Code</Label>
                    <Input 
                      id="disable-code"
                      type="text"
                      maxLength={6}
                      placeholder="000 000"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      className="h-12 text-center text-xl font-bold tracking-[0.5em] rounded-none border-border/60"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none font-semibold" onClick={() => setDisableCode("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDisableTOTP}
                      disabled={disableCode.length !== 6 || isSettingUp}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none font-bold min-w-[140px]"
                    >
                      {isSettingUp ? <IconLoader2 className="animate-spin size-4 mr-2" /> : "Confirm Disable"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {setupError && <p className="text-sm text-red-500 flex items-center gap-2 px-1"><IconAlertCircle size={16} /> {setupError}</p>}
        </div>
      )
    }

    if (totpData) {
      // ... (Existing setup UI)
      return (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-muted/30 p-6 flex flex-col items-center gap-4 border border-dashed border-border/60">
            <div className="bg-white p-4 shadow-sm border border-border/10">
              <QRCodeSVG value={totpData.uri} size={180} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold">Scan this code with Google Authenticator</p>
              <p className="text-xs text-muted-foreground font-mono bg-muted p-1 px-2 rounded">{totpData.secret}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification">Enter 6-digit verification code</Label>
              <Input id="verification" type="text" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="000 000" className="h-11 text-center text-lg tracking-[0.5em] font-bold" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleVerifyAndEnable} disabled={isSettingUp || verificationCode.length !== 6} className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-11 font-bold">
                {isSettingUp ? <IconLoader2 className="animate-spin size-5" /> : "Verify & Enable"}
              </Button>
              <Button variant="ghost" onClick={() => setTotpData(null)} className="h-11 font-medium">Cancel</Button>
            </div>
            {setupError && <p className="text-sm text-red-500 flex items-center gap-2"><IconAlertCircle size={16} /> {setupError}</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/20 p-6 border border-border/20">
        <div className="flex items-start gap-4">
          <IconLock className="text-muted-foreground mt-1" size={20} />
          <div className="space-y-1">
            <p className="font-bold">Google Authenticator (TOTP)</p>
            <p className="text-xs text-muted-foreground italic">Use an app to generate secure login codes.</p>
          </div>
        </div>
        <Button onClick={handleStartSetup} className="bg-[#009640] hover:bg-[#008a3b] font-bold h-11 px-8 rounded-none">
          Set Up 2FA
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground font-medium">Your personal workspace identity.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="shadow-lg border-border/40 overflow-hidden bg-card/80 backdrop-blur-md rounded-none">
          <div className="h-40 w-full relative border-b border-border/20 overflow-hidden bg-green-500/[0.04]">
            {LEAF_PATTERN.map((leaf) => (
              <IconLeaf key={leaf.id} size={leaf.size} className="absolute text-emerald-600/10" style={{ top: leaf.top, left: leaf.left, transform: `rotate(${leaf.rotate}deg)` }} />
            ))}
          </div>

          <CardContent className="p-8 pt-0 relative flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4 -mt-16 relative z-10 w-full">
              <div className="relative group mx-auto">
                <Avatar className="size-32 border-4 border-background shadow-xl transition-all duration-500 group-hover:scale-105">
                  <AvatarImage src="https://github.com/shadcn.png" alt={`@${user.user_name}`} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-emerald-500/10 text-emerald-600 font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button className="absolute bottom-1 right-1 p-2 bg-emerald-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-background">
                  <IconCamera size={16} stroke={2.5} />
                </button>
              </div>

              <div className="space-y-2 w-full">
                <h2 className="text-xl font-bold tracking-tight capitalize text-foreground">{user.user_name}</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-emerald-600 ">
                    <IconBriefcase size={12} stroke={3} />
                    {user.access_type} Access
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 w-full max-w-[200px] mx-auto">
              <Button variant="outline" className="w-full gap-2 font-semibold rounded-none border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shadow-sm h-11" onClick={() => logout()}>
                <IconLogout size={18} stroke={2} />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border/40 bg-card/80 backdrop-blur-md rounded-none">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                <IconShieldCheck size={20} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold">Two-Factor Authentication</h3>
                <p className="text-[13px] text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
            </div>

            {renderTOTPSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
