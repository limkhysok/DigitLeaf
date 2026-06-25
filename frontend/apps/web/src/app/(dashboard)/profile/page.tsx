"use client"

import { useState, useEffect, useCallback } from "react"
import {
  IconCamera,
  IconBriefcase,
  IconLogout,
  IconLeaf,
  IconLoader2,
  IconUser,
  IconHistory,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Label } from "@workspace/ui/components/label"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, UserSession } from "@/services/api-client"
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

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device"
  const browsers: [string, string][] = [["Firefox", "Firefox"], ["Edg/", "Edge"], ["Chrome", "Chrome"], ["Safari", "Safari"]]
  const oses: [string, string][] = [["Windows", "Windows"], ["Macintosh", "macOS"], ["Android", "Android"], ["iPhone", "iOS"], ["iPad", "iOS"], ["Linux", "Linux"]]
  const browser = browsers.find(([token]) => ua.includes(token))?.[1] ?? "Browser"
  const os = oses.find(([token]) => ua.includes(token))?.[1] ?? "Unknown OS"
  return `${browser} on ${os}`
}

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
  const { user, tokens, isLoading: isAuthLoading } = useAuth()
  const { t, language } = useLanguage()

  // New states for sessions
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  const fetchSessions = useCallback(async (isMounted: boolean) => {
    if (isAuthLoading || !tokens?.access_token) return
    setIsLoadingSessions(true)
    try {
      const data = await apiClient.getSessions(tokens.access_token)
      if (isMounted) setSessions(data)
    } catch (err) {
      console.error("Failed to fetch sessions", err)
    } finally {
      if (isMounted) setIsLoadingSessions(false)
    }
  }, [isAuthLoading, tokens])

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

  const renderSessionsList = () => {
    if (isLoadingSessions) {
      return (
        <div className="flex justify-center p-8">
          <IconLoader2 className="animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (sessions.length === 0) {
      return <p className="text-center text-xs text-muted-foreground py-4">{t.profile.sessions.noSessions}</p>
    }

    return sessions.map((session) => (
      <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-5 bg-muted/20 border border-border/60 rounded-sm sm:rounded-md hover:bg-muted/30 transition-colors gap-3 sm:gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-foreground text-background p-2.5 rounded-full mt-1 shrink-0">
            <IconHistory size={20} />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm">{parseUserAgent(session.user_agent)}</p>
              {session.refresh_token === tokens?.refresh_token && (
                <span className="text-[9px] font-bold capitalize tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-full">{t.profile.sessions.current}</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="text-foreground/70">IP:</span> {session.ip_address || "Unknown"}
              </p>
              <p className="text-[11px] text-muted-foreground/70 font-medium">
                <span className="text-foreground/70">{t.profile.sessions.started}:</span> {new Date(session.created_at).toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground/70 font-medium">
                <span className="text-foreground/70">{t.profile.sessions.expires}:</span> {new Date(session.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))
  }


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <IconLoader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

  const initials = user.user_name.substring(0, 2).toUpperCase()

  const avatarSrc = user.access_type.toLowerCase() === "all" ? "/avatars/avatar-admin.svg" : "/avatars/avatar-default.svg"

  const dateLocale = language === 'en' ? 'en-US' : 'km-KH'
  const memberSince = user.do_date
    ? new Date(user.do_date).toLocaleDateString(dateLocale, { month: 'short', year: 'numeric', day: 'numeric' })
    : "—"

  const renderProfileSection = () => (
    <Card className="border border-border/70 overflow-hidden bg-card rounded-md shadow-none ring-0">
      <div className="h-24 sm:h-40 w-full relative border-b border-border/20 overflow-hidden bg-muted/10">
        {LEAF_PATTERN.map((leaf) => (
          <IconLeaf key={leaf.id} size={leaf.size} className="absolute text-[#009640]/20" style={{ top: leaf.top, left: leaf.left, transform: `rotate(${leaf.rotate}deg)` }} />
        ))}
      </div>

      <CardContent className="p-4 sm:p-8 pt-0 relative flex flex-col items-center gap-4 sm:gap-6 text-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4 -mt-10 sm:-mt-16 relative z-10 w-full">
          <div className="relative group mx-auto">
            <Avatar className="size-20 sm:size-36 border-4 sm:border-8 border-background transition-all duration-500 group-hover:scale-105 rounded-full">
              <AvatarImage src={avatarSrc} alt={`@${user.user_name}`} className="object-cover" />
              <AvatarFallback className="text-2xl sm:text-5xl bg-muted text-foreground font-black rounded-full">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 p-2 sm:p-3 bg-[#009640] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border-2 sm:border-4 border-background">
              <IconCamera size={14} stroke={2.5} />
            </button>
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-lg sm:text-2xl tracking-tight text-foreground capitalize">{user.user_name}</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground capitalize tracking-wider">
              <IconBriefcase size={13} stroke={2} />
              {user.access_type || "Standard"} {t.profile.details.role}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full text-left pt-2 sm:pt-6">
          <div className="space-y-1 bg-muted/20 p-3 sm:p-5 border border-border/60 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground ml-1 sm:ml-2">{t.profile.details.username}</Label>
            <p className="text-xs sm:text-sm font-medium px-1 sm:px-2 capitalize">{user.user_name}</p>
          </div>
          <div className="space-y-1 bg-muted/20 p-3 sm:p-5 border border-border/60 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground ml-1 sm:ml-2">{t.profile.details.memberSince}</Label>
            <p className="text-xs sm:text-sm font-medium px-1 sm:px-2">{memberSince}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSessionsSection = () => (
    <Card className="border border-border/70 bg-card rounded-md shadow-none ring-0">
      <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-8">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg tracking-tight">{t.profile.sessions.title}</h3>
          <p className="text-xs text-muted-foreground tracking-wide">{t.profile.sessions.subtitle}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {renderSessionsList()}
        </div>

        <div className="pt-2 sm:pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full h-10 px-6 text-xs capitalize tracking-wide transition-all duration-300 w-full sm:w-auto gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
              >
                <IconLogout size={16} stroke={2.5} />
                {t.profile.sessions.terminateAll}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-md border-border/70 shadow-none ring-0 p-8 gap-0">
              <div className="flex flex-col items-center text-center gap-5">
                <div className="bg-destructive/8 p-4 rounded-full">
                  <IconLogout className="text-destructive" size={22} stroke={1.75} />
                </div>
                <AlertDialogHeader className="space-y-2 items-center">
                  <AlertDialogTitle className="text-lg text-foreground">{t.profile.sessions.confirmTerminateTitle}</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {t.profile.sessions.confirmTerminateDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
              </div>
              <AlertDialogFooter className="flex-col gap-2 mt-8 sm:flex-col">
                <AlertDialogAction
                  onClick={handleLogoutAll}
                  className="rounded-full h-10 px-6 text-xs capitalize tracking-wide transition-all duration-300 bg-destructive hover:bg-destructive/90 text-white w-full"
                >
                  {t.profile.sessions.confirmTerminateAction}
                </AlertDialogAction>
                <AlertDialogCancel className="rounded-full h-10 px-6 text-xs capitalize tracking-wide transition-all duration-300 w-full m-0">{t.common.cancel || "Cancel"}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10 md:px-0">
      <div className="space-y-1 px-2">
        <h1 className="text-xl text-foreground">{t.profile.title}</h1>
        <p className="text-xs text-muted-foreground tracking-wide">{t.profile.subtitle}</p>
      </div>

      <div className="lg:hidden space-y-6">
        {renderProfileSection()}
        {renderSessionsSection()}
      </div>

      <Tabs defaultValue="profile" orientation="vertical" className="hidden lg:flex flex-row gap-6 items-start w-full">
        <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1 items-start w-44 border-none sticky top-24">
          <TabsTrigger
            value="profile"
            className="w-full justify-start rounded-md px-4 py-2.5 text-sm data-[state=active]:bg-[#009640] data-[state=active]:text-white transition-all duration-200 gap-2.5 hover:bg-muted/50 text-muted-foreground/60"
          >
            <IconUser size={16} stroke={1.75} />
            {t.profile.tabs.details}
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="w-full justify-start rounded-md px-4 py-2.5 text-sm data-[state=active]:bg-[#009640] data-[state=active]:text-white transition-all duration-200 gap-2.5 hover:bg-muted/50 text-muted-foreground/60"
          >
            <IconHistory size={16} stroke={1.75} />
            {t.profile.tabs.sessions}
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="profile" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500 focus-visible:outline-none">
            {renderProfileSection()}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500 focus-visible:outline-none">
            {renderSessionsSection()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
