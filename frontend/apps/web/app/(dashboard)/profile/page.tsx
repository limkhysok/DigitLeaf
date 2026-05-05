"use client"

import { useState, useEffect, useCallback } from "react"
import {
  IconCamera,
  IconBriefcase,
  IconLogout,
  IconLeaf,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
  IconUser,
  IconHistory,
  IconShieldLock,
  IconEye,
  IconEyeOff
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useAuth } from "@/hooks/use-auth"
import { apiClient, UserSession } from "@/lib/api-client"
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
  const { user, tokens, refreshUserProfile } = useAuth()
  const [totpData, setTotpData] = useState<{ secret: string; uri: string } | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [setupError, setSetupError] = useState("")
  const [disableCode, setDisableCode] = useState("")

  // New states for sessions and password
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)


  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)


  const fetchSessions = useCallback(async (isMounted: boolean) => {
    if (!tokens?.access_token) return
    setIsLoadingSessions(true)
    try {
      const data = await apiClient.getSessions(tokens.access_token)
      if (isMounted) setSessions(data)
    } catch (err) {
      console.error("Failed to fetch sessions", err)
    } finally {
      if (isMounted) setIsLoadingSessions(false)
    }
  }, [tokens])

  useEffect(() => {
    let isMounted = true

    // Defer the execution to avoid the "synchronous setState in useEffect" warning
    const initialize = async () => {
      if (isMounted) {
        await fetchSessions(isMounted)
      }
    }

    initialize()
    return () => { isMounted = false }
  }, [fetchSessions])


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

  const handleLogoutAll = async () => {
    if (!tokens?.access_token) return
    try {
      await apiClient.logout(tokens.access_token)
      toast.success("Successfully logged out of all other sessions")
      fetchSessions(true)
    } catch {
      toast.error("Failed to logout of all sessions")
    }
  }

  const handleChangePassword = async () => {
    if (!tokens?.access_token) return
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    setIsUpdatingPassword(true)
    try {
      await apiClient.changePassword(tokens.access_token, currentPassword, newPassword)
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsChangingPassword(false)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "Failed to update password")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const renderSessionsList = () => {
    if (isLoadingSessions) {
      return (
        <div className="flex justify-center p-8">
          <IconLoader2 className="animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (sessions.length === 0) {
      return <p className="text-center text-xs text-muted-foreground py-4">No other active sessions found.</p>
    }

    return sessions.map((session) => (
      <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-muted/20 border border-border/40 rounded-2xl hover:bg-muted/30 transition-colors gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-foreground text-background p-2.5 rounded-full mt-1 shrink-0">
            <IconHistory size={20} />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold">Session ID: {session.id}</p>
              {session.refresh_token === tokens?.refresh_token && (
                <span className="text-[9px] font-bold capitalize tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">Current</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="font-bold text-foreground/70">IP:</span> {session.ip_address || "Unknown"}
              </p>
              <p className="text-[11px] text-muted-foreground/80 font-medium leading-relaxed max-w-md line-clamp-1 break-all">
                <span className="font-bold text-foreground/70">Agent:</span> {session.user_agent || "Unknown Browser"}
              </p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1 capitalize tracking-wide">
                Expires: {new Date(session.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))
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
    <Card className="border border-border/40 overflow-hidden bg-card rounded-[2rem] shadow-none ring-0">
      <div className="h-40 w-full relative border-b border-border/20 overflow-hidden bg-muted/10">
        {LEAF_PATTERN.map((leaf) => (
          <IconLeaf key={leaf.id} size={leaf.size} className="absolute text-foreground/5" style={{ top: leaf.top, left: leaf.left, transform: `rotate(${leaf.rotate}deg)` }} />
        ))}
      </div>

      <CardContent className="p-8 pt-0 relative flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-4 -mt-16 relative z-10 w-full">
          <div className="relative group mx-auto">
            <Avatar className="size-36 border-[8px] border-background transition-all duration-500 group-hover:scale-105 rounded-full">
              <AvatarImage src="https://github.com/shadcn.png" alt={`@${user.user_name}`} className="object-cover" />
              <AvatarFallback className="text-5xl bg-muted text-foreground font-black rounded-full">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 p-3 bg-emerald-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-background">
              <IconCamera size={18} stroke={2.5} />
            </button>
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-foreground capitalize">{user.user_name}</h2>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground capitalize tracking-wider">
              <IconBriefcase size={15} stroke={2} />
              {user.role?.name || "Standard"} Role
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left pt-6">
          <div className="space-y-1.5 bg-muted/20 p-5 border border-border/40 rounded-2xl transition-colors hover:bg-muted/30">
            <Label className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-2">Username</Label>
            <p className="text-sm font-bold px-2 capitalize">{user.user_name}</p>
          </div>
          <div className="space-y-1.5 bg-muted/20 p-5 border border-border/40 rounded-2xl transition-colors hover:bg-muted/30">
            <Label className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-2">Member Since</Label>
            <p className="text-sm font-bold px-2 capitalize">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSessionsSection = () => (
    <Card className="border border-border/40 bg-card rounded-md shadow-none ring-0">
      <CardContent className="p-8 space-y-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight">Active Sessions</h3>
          <p className="text-xs font-medium text-muted-foreground capitalize tracking-wide">Manage your login sessions across devices.</p>
        </div>

        <div className="space-y-4">
          {renderSessionsList()}
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full gap-3 font-bold text-xs capitalize tracking-wider rounded-full border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all h-12"
            onClick={handleLogoutAll}
          >
            <IconLogout size={16} stroke={2.5} />
            Terminate All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSecuritySection = () => (
    <div className="space-y-10">
      <Card className="border border-border/40 bg-card rounded-md shadow-none ring-0">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold flex items-center gap-3">
                <IconShieldLock className="text-emerald-600" size={20} />
                Password Management
              </h3>
              <p className="text-xs font-medium text-muted-foreground capitalize">Keep your account secure with a strong password</p>
            </div>
            <Button 
              variant={isChangingPassword ? "ghost" : "outline"}
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="rounded-full h-10 px-6 font-bold text-xs capitalize tracking-wide transition-all duration-300 w-full sm:w-auto"
            >
              {isChangingPassword ? "Cancel" : "Change Password"}
            </Button>
          </div>

          {isChangingPassword && (
            <div className="space-y-8 pt-8 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-3">
                <Label className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-6">Current Password</Label>
                <div className="relative group">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    className="rounded-full h-14 pr-14 bg-muted/10 border-border/40 focus:bg-white transition-all pl-8 text-sm font-bold placeholder:font-medium placeholder:text-muted-foreground/40 shadow-none" 
                    placeholder="Verify your identity"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-[#009640] transition-colors"
                  >
                    {showCurrentPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-6">New Password</Label>
                  <div className="relative group">
                    <Input 
                      type={showNewPassword ? "text" : "password"} 
                      className="rounded-full h-14 pr-14 bg-muted/10 border-border/40 focus:bg-white transition-all pl-8 text-sm font-bold placeholder:font-medium placeholder:text-muted-foreground/40 shadow-none"
                      placeholder="Create new secret"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-[#009640] transition-colors"
                    >
                      {showNewPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold capitalize tracking-wide text-muted-foreground ml-6">Confirm Password</Label>
                  <div className="relative group">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="rounded-full h-14 pr-14 bg-muted/10 border-border/40 focus:bg-white transition-all pl-8 text-sm font-bold placeholder:font-medium placeholder:text-muted-foreground/40 shadow-none"
                      placeholder="Repeat to verify"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-[#009640] transition-colors"
                    >
                      {showConfirmPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-full font-bold capitalize tracking-[0.1em] text-xs bg-[#009640] hover:bg-[#008a3b] transition-all"
                onClick={handleChangePassword}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? <IconLoader2 className="animate-spin mr-3" size={20} /> : "Update Security Credentials"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/40 bg-card rounded-md shadow-none ring-0">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight">Two-factor Authentication</h3>
            <p className="text-xs font-medium text-muted-foreground capitalize tracking-wide">Protect your account with time-based verification codes.</p>
          </div>

          <div className="pt-4 border-t border-border/40">
            {renderTOTPSection()}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTOTPSection = () => {
    if (totpData) {
      return (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="bg-muted/10 p-8 flex flex-col items-center gap-8 border border-dashed border-border/40 rounded-[2rem]">
            <div className="bg-white p-5 shadow-none ring-1 ring-border/20 rounded-[1.5rem]">
              <QRCodeSVG value={totpData.uri} size={180} />
            </div>
            <div className="text-center space-y-3">
              <p className="text-sm font-bold text-foreground capitalize tracking-widest">Scan with authenticator app</p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground capitalize tracking-wide">Manual secret key</span>
                <code className="text-xs font-mono bg-muted px-4 py-2 border border-border/20 font-bold rounded-full text-emerald-600">{totpData.secret}</code>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="verification" className="text-xs font-bold capitalize tracking-wide ml-6">Enter 6-digit code</Label>
              <Input 
                id="verification" 
                type="text" 
                maxLength={6} 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                placeholder="000 000" 
                className="h-14 text-center text-2xl tracking-[0.5em] font-bold rounded-full border-border/60 bg-muted/10 shadow-none" 
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleVerifyAndEnable} 
                disabled={isSettingUp || verificationCode.length !== 6} 
                className="flex-1 bg-[#009640] text-white hover:bg-[#008a3b] h-12 font-bold capitalize tracking-widest text-xs rounded-full transition-all"
              >
                {isSettingUp ? <IconLoader2 className="animate-spin size-4" /> : "Verify & Activate"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTotpData(null)} 
                className="h-12 font-bold capitalize tracking-widest text-xs rounded-full px-8"
              >
                Cancel
              </Button>
            </div>
            {setupError && <p className="text-xs font-bold text-destructive flex items-center gap-2 px-4 animate-in fade-in"><IconAlertCircle size={14} /> {setupError}</p>}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-muted/10 p-6 sm:p-10 rounded-[2rem] border border-border/20">
        <div className="flex items-start gap-4">
          <div className="bg-[#009640]/10 p-4 rounded-full shrink-0">
            <IconShieldLock className="text-[#009640]" size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold">Authenticator App</h3>
              {user.totp_enabled && (
                <span className="flex items-center gap-1 text-xs font-bold capitalize tracking-wide text-emerald-600 bg-emerald-500/10 px-3 py-1 border border-emerald-500/20 rounded-full">
                  <IconCheck size={12} /> Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-md">
              Protect your account with time-based verification codes.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          {user.totp_enabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-full px-8 h-12 font-bold capitalize tracking-widest text-xs border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all w-full sm:w-auto"
                  disabled={isSettingUp}
                >
                  {isSettingUp ? <IconLoader2 className="animate-spin size-4" /> : "Disable 2FA"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem] border-border/40 shadow-none ring-0">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-destructive">Disable Security Layer?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                    Enter your 6-digit code to confirm removal of 2FA protection.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-4">
                  <Label htmlFor="disable-code" className="text-xs font-bold capitalize tracking-wide ml-4">Verification Code</Label>
                  <Input
                    id="disable-code"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="h-14 text-center text-2xl font-bold tracking-[0.5em] rounded-full border-border/60 bg-muted/10 shadow-none"
                  />
                </div>

                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel className="rounded-full font-bold text-xs capitalize tracking-wide h-12 px-6" onClick={() => setDisableCode("")}>Keep Secure</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisableTOTP}
                    disabled={disableCode.length !== 6 || isSettingUp}
                    className="bg-destructive text-white hover:bg-destructive/90 rounded-full font-bold text-xs capitalize tracking-wide h-12 px-6 min-w-[140px]"
                  >
                    {isSettingUp ? <IconLoader2 className="animate-spin size-4 mr-2" /> : "Confirm Disable"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              onClick={handleStartSetup} 
              className="rounded-full px-8 h-12 font-bold capitalize tracking-widest text-xs bg-[#009640] hover:bg-[#008a3b] transition-all w-full sm:w-auto"
              disabled={isSettingUp}
            >
              {isSettingUp ? <IconLoader2 className="animate-spin size-4" /> : "Set Up 2FA"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-10 px-4">
      <div className="space-y-1.5 px-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs font-bold text-emerald-600 capitalize tracking-[0.2em]">Manage your workspace account and security.</p>
      </div>

      {/* Mobile & Tablet View: All content stacked */}
      <div className="lg:hidden space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold capitalize tracking-wide text-xs">
            <IconUser size={14} /> Profile
          </div>
          {renderProfileSection()}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold capitalize tracking-wide text-xs">
            <IconHistory size={14} /> Sessions
          </div>
          <div className="space-y-4">
            {renderSessionsList()}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-emerald-600 font-bold capitalize tracking-wide text-xs">
            <IconShieldLock size={14} /> Security
          </div>
          {renderSecuritySection()}
        </div>
      </div>

      {/* Desktop View: Tabs */}
      <Tabs defaultValue="profile" orientation="vertical" className="hidden lg:flex flex-row gap-16 items-start">
        <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-2 items-start w-56 border-none">
          <TabsTrigger
            value="profile"
            className="w-full justify-start rounded-full px-5 py-3 text-sm font-medium data-[state=active]:bg-[#009640] data-[state=active]:text-white transition-all gap-3 hover:bg-muted/50"
          >
            <IconUser size={17} stroke={2} />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="w-full justify-start rounded-full px-5 py-3 text-sm font-medium data-[state=active]:bg-[#009640] data-[state=active]:text-white transition-all gap-3 hover:bg-muted/50"
          >
            <IconHistory size={17} stroke={2} />
            Sessions
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="w-full justify-start rounded-full px-5 py-3 text-sm font-medium data-[state=active]:bg-[#009640] data-[state=active]:text-white transition-all gap-3 hover:bg-muted/50"
          >
            <IconShieldLock size={17} stroke={2} />
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
