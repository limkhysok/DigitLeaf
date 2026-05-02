"use client"

import {
  IconCamera,
  IconBriefcase,
  IconLogout,
  IconLeaf
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { useAuth } from "@/hooks/use-auth"

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
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10 w-full px-4 sm:px-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 sm:mt-0">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-primary/10 animate-pulse rounded-md"></div>
            <div className="h-4 w-64 bg-primary/10 animate-pulse rounded-md"></div>
          </div>
        </div>

        <Card className="shadow-lg border-border/40 overflow-hidden bg-card/80 backdrop-blur-md rounded-none">
          <div className="h-40 w-full bg-green-500/[0.02] animate-pulse"></div>
          <CardContent className="p-8 pt-0 relative flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-4 -mt-16 relative z-10 w-full">
              <div className="size-32 rounded-full border-4 border-background shadow-xl bg-primary/10 animate-pulse"></div>

              <div className="space-y-4 w-full flex flex-col items-center pt-2">
                <div className="h-8 w-48 bg-primary/10 animate-pulse rounded-md"></div>
                <div className="flex gap-4">
                  <div className="h-6 w-32 bg-primary/10 animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="pt-4 w-full max-w-[200px] mx-auto">
              <div className="h-11 w-full bg-primary/10 animate-pulse rounded-none"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const initials = user.user_name.substring(0, 2).toUpperCase()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground font-medium">Your personal workspace identity.</p>
        </div>
      </div>

      <Card className="shadow-lg border-border/40 overflow-hidden bg-card/80 backdrop-blur-md rounded-none">
        {/* Simple Green Banner with Scattered Leaves */}
        <div className="h-40 w-full relative border-b border-border/20 overflow-hidden bg-green-500/[0.04]">

          {LEAF_PATTERN.map((leaf) => (
            <IconLeaf
              key={leaf.id}
              size={leaf.size}
              className="absolute text-emerald-600/10"
              style={{
                top: leaf.top,
                left: leaf.left,
                transform: `rotate(${leaf.rotate}deg)`
              }}
            />
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
              <h2 className="text-xl font-bold tracking-tight capitalize text-foreground">
                {user.user_name}
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-emerald-600 ">
                  <IconBriefcase size={12} stroke={3} />
                  {user.access_type} Access
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 w-full max-w-[200px] mx-auto">
            <Button
              variant="outline"
              className="w-full gap-2 font-semibold rounded-none border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors shadow-sm h-11"
              onClick={() => logout()}
            >
              <IconLogout size={18} stroke={2} />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
