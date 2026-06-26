"use client"

import { useEffect, useState } from "react"
import {
  IconCamera,
  IconBriefcase,
  IconLeaf,
  IconLoader2,
  IconUser,
  IconMapPin,
  IconLogout,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient } from "@/services/api-client"

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
  const { user, tokens, logout } = useAuth()
  const { t } = useLanguage()

  const [regionName, setRegionName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadRegion = async () => {
      if (!tokens?.access_token || !user?.regions?.length) {
        if (isMounted) setRegionName(null)
        return
      }
      try {
        const regions = await apiClient.getRegions(tokens.access_token)
        const matches = regions.filter((r) => user.regions.includes(r.reg_id))
        if (!matches.length) {
          if (isMounted) setRegionName(null)
          return
        }
        const names = matches.map((m) => (m.reg_name_kh ? `${m.reg_name} | ${m.reg_name_kh}` : m.reg_name))
        if (isMounted) setRegionName(names.join(", "))
      } catch (err) {
        console.error("Failed to fetch region", err)
      }
    }
    loadRegion()
    return () => { isMounted = false }
  }, [tokens, user?.regions])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <IconLoader2 className="animate-spin size-8 text-muted-foreground" />
      </div>
    )
  }

  const initials = user.user_name.substring(0, 2).toUpperCase()

  const avatarSrc = user.access_type.toLowerCase() === "all" ? "/avatars/avatar-admin.svg" : "/avatars/avatar-default.svg"

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10 md:px-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.profile.title}</h1>
        <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
          {t.profile.subtitle}
        </p>
      </div>

      <Card className="border border-black/20 overflow-hidden bg-card rounded-md shadow-none ring-0 max-w-md mx-auto w-full">
        <div className="h-24 sm:h-32 w-full relative border-b border-border/20 overflow-hidden bg-muted/10">
          {LEAF_PATTERN.map((leaf) => (
            <IconLeaf key={leaf.id} size={leaf.size} className="absolute text-[#009640]/20" style={{ top: leaf.top, left: leaf.left, transform: `rotate(${leaf.rotate}deg)` }} />
          ))}
        </div>

        <CardContent className="p-4 sm:p-8 pt-0 relative flex flex-col items-center gap-4 sm:gap-6 text-center">
          <div className="relative group mx-auto -mt-10 sm:-mt-14 z-10">
            <Avatar className="size-20 sm:size-28 border-4 sm:border-6 border-background transition-all duration-500 group-hover:scale-105 rounded-full">
              <AvatarImage src={avatarSrc} alt={`@${user.user_name}`} className="object-cover" />
              <AvatarFallback className="text-2xl sm:text-4xl bg-muted text-foreground font-black rounded-full">{initials}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 p-2 sm:p-2.5 bg-[#009640] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border-2 sm:border-4 border-background">
              <IconCamera size={14} stroke={2.5} />
            </button>
          </div>

          <div className="flex flex-col gap-3 w-full text-left">
            <div className="flex items-center gap-3 bg-muted/20 p-3 sm:p-5 border border-black/20 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-center size-9 sm:size-10 rounded-full bg-background border border-black/20 text-muted-foreground shrink-0">
                <IconUser size={16} stroke={1.75} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">{t.profile.details.username}</Label>
                <p className="text-xs sm:text-sm font-medium capitalize truncate">{user.user_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted/20 p-3 sm:p-5 border border-black/20 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-center size-9 sm:size-10 rounded-full bg-background border border-black/20 text-muted-foreground shrink-0">
                <IconMapPin size={16} stroke={1.75} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">{t.profile.details.region}</Label>
                <p className="text-xs sm:text-sm font-medium truncate">{regionName || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted/20 p-3 sm:p-5 border border-black/20 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
              <div className="flex items-center justify-center size-9 sm:size-10 rounded-full bg-background border border-black/20 text-muted-foreground shrink-0">
                <IconBriefcase size={16} stroke={1.75} />
              </div>
              <div className="space-y-0.5 min-w-0">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">{t.profile.details.role}</Label>
                <p className="text-xs sm:text-sm font-medium capitalize truncate">{user.access_type || "Standard"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-md mx-auto w-full">
        <Button
          variant="outline"
          onClick={() => logout()}
          className="rounded-md h-10 px-6 text-xs capitalize tracking-wide w-full gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-white"
        >
          <IconLogout size={16} stroke={2.5} />
          {t.userMenu.logout}
        </Button>
      </div>
    </div>
  )
}
