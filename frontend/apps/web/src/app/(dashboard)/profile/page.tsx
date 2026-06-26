"use client"

import { useEffect, useState } from "react"
import {
  IconCamera,
  IconBriefcase,
  IconLeaf,
  IconLoader2,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Label } from "@workspace/ui/components/label"
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
  const { user, tokens } = useAuth()
  const { t, language } = useLanguage()

  const [regionName, setRegionName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadRegion = async () => {
      if (!tokens?.access_token || user?.region == null) {
        if (isMounted) setRegionName(null)
        return
      }
      try {
        const regions = await apiClient.getRegions(tokens.access_token)
        const match = regions.find((r) => r.reg_id === user.region)
        if (!match) {
          if (isMounted) setRegionName(null)
          return
        }
        const name = language === "kh" ? match.reg_name_kh || match.reg_name : match.reg_name
        if (isMounted) setRegionName(name)
      } catch (err) {
        console.error("Failed to fetch region", err)
      }
    }
    loadRegion()
    return () => { isMounted = false }
  }, [tokens, user?.region, language])

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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10 md:px-0">
      <div className="space-y-1 px-2">
        <h1 className="text-xl text-foreground">{t.profile.title}</h1>
        <p className="text-xs text-muted-foreground tracking-wide">{t.profile.subtitle}</p>
      </div>

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
            <div className="space-y-1 bg-muted/20 p-3 sm:p-5 border border-border/60 rounded-sm sm:rounded-md transition-colors hover:bg-muted/30">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground ml-1 sm:ml-2">{t.profile.details.region}</Label>
              <p className="text-xs sm:text-sm font-medium px-1 sm:px-2">{regionName || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
