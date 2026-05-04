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
  IconLoader2,
  IconUser,
  IconHistory,
  IconShieldLock
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

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@workspace/ui/components/tabs"

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

  const initials = user.user_name.substring(0, 2).toUpperCase()

  const renderProfileSection = () => (
    <Card className="shadow-2xl border-border/40 overflow-hidden bg-card rounded-md">
      <div className="h-40 w-full relative border-b border-border/20 overflow-hidden bg-muted/10">
        {LEAF_PATTERN.map((leaf) => (
          <IconLeaf key={leaf.id} size={leaf.size} className="absolute text-foreground/5" style={{ top: leaf.top, left: leaf.left, transform: `rotate(${leaf.rotate}deg)` }} />
        ))}
      </div>

      <CardContent className="p-8 pt-0 relative flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-4 -mt-16 relative z-10 w-full">
          <div className="relative group mx-auto">
            <Avatar className="size-32 border-[6px] border-background shadow-2xl transition-all duration-500 group-hover:scale-105 rounded-md">
              <AvatarImage src="https://github.com/shadcn.png" alt={`@${user.user_name}`} className="object-cover" />
              <AvatarFallback className="text-4xl bg-muted text-foreground font-black rounded-md">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-background">
              <IconCamera size={16} stroke={2.5} />
            </button>
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{user.user_name}</h2>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground/80">
              <IconBriefcase size={14} stroke={2} />
              {user.access_type} Access
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-4">
          <div className="space-y-1.5 bg-muted/20 p-4 border border-border/40 rounded-sm">
            <Label className="text-xs font-semibold text-muted-foreground">Username</Label>
            <p className="text-sm font-bold">{user.user_name}</p>
          </div>
          <div className="space-y-1.5 bg-muted/20 p-4 border border-border/40 rounded-sm">
            <Label className="text-xs font-semibold text-muted-foreground">Joined Date</Label>
            <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSessionsSection = () => (
    <Card className="shadow-xl border-border/40 bg-card rounded-md">
      <CardContent className="p-8 space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Active Sessions</h3>
          <p className="text-xs font-medium text-muted-foreground">Manage your current active login sessions across devices.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-sm">
            <div className="flex items-center gap-4">
              <div className="bg-foreground text-background p-2 rounded-sm">
                <IconShieldCheck size={18} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold">Current Device</p>
                <p className="text-xs text-muted-foreground font-medium">Windows • Chrome • 127.0.0.1</p>
              </div>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20 rounded-sm">Active Now</div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <Button
            variant="outline"
            className="w-full gap-3 font-semibold text-xs rounded-sm border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm h-12"
            onClick={() => logout()}
          >
            <IconLogout size={16} stroke={2} />
            Terminate All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSecuritySection = () => (
    <Card className="shadow-xl border-border/40 bg-card rounded-md">
      <CardContent className="p-8 space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Two-factor Authentication</h3>
          <p className="text-xs font-medium text-muted-foreground">Protect your account with an extra security layer.</p>
        </div>

        <div className="pt-4 border-t border-border/40">
          {renderTOTPSection()}
        </div>
      </CardContent>
    </Card>
  )

  const renderTOTPSection = () => {
    if (user.totp_enabled || setupSuccess) {
      return (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-md flex items-center justify-between gap-3 font-medium">
            <div className="flex items-center gap-3">
              <IconCheck size={20} stroke={3} className="bg-emerald-600 text-white rounded-sm p-1" />
              <div className="space-y-0.5">
                <p className="font-bold text-base text-emerald-800">Two-factor Authentication is Active</p>
                <p className="text-xs text-emerald-600/80 font-medium">Securely linked to your authenticator app</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-destructive hover:bg-transparent font-medium text-xs underline underline-offset-4"
                    disabled={isSettingUp}
                  >
                    {isSettingUp ? <IconLoader2 className="animate-spin size-3" /> : "Disable 2FA"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-md border-border/40">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-destructive">Disable Two-factor Authentication?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                      Enter the 6-digit code from your authenticator app to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="py-4 space-y-2">
                    <Label htmlFor="disable-code" className="text-xs font-semibold">Verification Code</Label>
                    <Input
                      id="disable-code"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      className="h-12 text-center text-xl font-bold tracking-[0.5em] rounded-sm border-border/60"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-sm font-semibold text-xs" onClick={() => setDisableCode("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisableTOTP}
                      disabled={disableCode.length !== 6 || isSettingUp}
                      className="bg-destructive text-white hover:bg-destructive/90 rounded-sm font-semibold text-xs min-w-[120px]"
                    >
                      {isSettingUp ? <IconLoader2 className="animate-spin size-3 mr-2" /> : "Confirm Disable"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {setupError && <p className="text-xs font-semibold text-destructive flex items-center gap-2 px-1"><IconAlertCircle size={14} /> {setupError}</p>}
        </div>
      )
    }

    if (totpData) {
      return (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="bg-muted/20 p-6 flex flex-col items-center gap-6 border border-dashed border-border/40">
            <div className="bg-white p-3 shadow-xl ring-1 ring-border/10 rounded-sm">
              <QRCodeSVG value={totpData.uri} size={160} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-foreground">Scan with Google Authenticator</p>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">Manual Entry Key</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 border border-border/40 font-bold rounded-sm">{totpData.secret}</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification" className="text-xs font-semibold">Enter 6-digit verification code</Label>
              <Input id="verification" type="text" maxLength={6} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="000 000" className="h-12 text-center text-xl tracking-[0.5em] font-bold rounded-sm" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleVerifyAndEnable} disabled={isSettingUp || verificationCode.length !== 6} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 h-11 font-semibold text-xs rounded-sm">
                {isSettingUp ? <IconLoader2 className="animate-spin size-4" /> : "Verify & Enable"}
              </Button>
              <Button variant="outline" onClick={() => setTotpData(null)} className="h-11 font-semibold text-xs rounded-sm">Cancel</Button>
            </div>
            {setupError && <p className="text-xs font-semibold text-destructive flex items-center gap-2"><IconAlertCircle size={14} /> {setupError}</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/20 p-6 border border-border/20 rounded-md">
        <div className="flex items-start gap-4">
          <div className="bg-muted p-2.5 rounded-sm border border-border/40">
            <IconLock className="text-foreground" size={18} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm">Authenticator App</p>
            <p className="text-xs text-muted-foreground font-medium">Use an app like Google Authenticator or Authy</p>
          </div>
        </div>
        <Button onClick={handleStartSetup} className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs h-11 px-8 rounded-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95">
          Set Up 2FA
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-10 px-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your workspace account and security.</p>
      </div>

      {/* Mobile & Tablet View: All content stacked */}
      <div className="lg:hidden space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold uppercase tracking-widest text-xs">
            <IconUser size={14} /> Profile
          </div>
          {renderProfileSection()}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold uppercase tracking-widest text-xs">
            <IconHistory size={14} /> Sessions
          </div>
          {renderSessionsSection()}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold uppercase tracking-widest text-xs">
            <IconShieldLock size={14} /> Security
          </div>
          {renderSecuritySection()}
        </div>
      </div>

      {/* Desktop View: Tabs */}
      <Tabs defaultValue="profile" orientation="vertical" className="hidden lg:flex flex-row gap-12 items-start">
        <TabsList variant="line" className="flex flex-col h-auto bg-transparent p-0 gap-1 items-start w-48 border-r border-border/10">
          <TabsTrigger
            value="profile"
            className="w-full justify-start rounded-sm px-4 py-3 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:text-foreground transition-all gap-2"
          >
            <IconUser size={16} />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="w-full justify-start rounded-sm px-4 py-3 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:text-foreground transition-all gap-2"
          >
            <IconHistory size={16} />
            Sessions
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="w-full justify-start rounded-sm px-4 py-3 text-sm font-medium data-[state=active]:bg-muted data-[state=active]:text-foreground transition-all gap-2"
          >
            <IconShieldLock size={16} />
            Security
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 max-w-3xl">
          <TabsContent value="profile" className="mt-0 animate-in fade-in duration-500">
            {renderProfileSection()}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0 animate-in fade-in duration-500">
            {renderSessionsSection()}
          </TabsContent>

          <TabsContent value="security" className="mt-0 animate-in fade-in duration-500">
            {renderSecuritySection()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
