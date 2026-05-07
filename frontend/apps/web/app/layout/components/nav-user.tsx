"use client"

import * as React from "react"

import {
  IconLogout,
  IconUser,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

const ROLE_AVATAR: Record<string, string> = {
  admin:   "/avatars/avatar-admin.svg",
  manager: "/avatars/avatar-manager.svg",
  staff:   "/avatars/avatar-staff.svg",
}

export function NavUser({
  user,
}: Readonly<{
  user: {
    name: string
    email: string
    avatar: string
    role?: string
  }
}>) {
  const { mounted } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth()

  if (!mounted) {
    return <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group relative flex h-8 w-8 items-center justify-center rounded-full outline-none transition-all duration-300 active:scale-90"
        >
          {/* Shimmering Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#009640]/0 group-hover:border-[#009640]/20 group-hover:scale-110 transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(0,150,64,0.2)]" />

          <div className="flex h-full w-full items-center justify-center rounded-full overflow-hidden relative border border-green-600/20 bg-[#ecfdf5]">
            {ROLE_AVATAR[user.role?.toLowerCase() ?? ""] ? (
              <img
                src={ROLE_AVATAR[user.role?.toLowerCase() ?? ""] ?? "/avatars/avatar-default.svg"}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[#009640] text-[10px] font-bold">{user.name.substring(0, 2).toUpperCase()}</span>
            )}
          </div>

          {/* Animated Online Status Dot */}
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative block h-2.5 w-2.5 rounded-full bg-[#009640] ring-2 ring-background" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-52 rounded-sm p-2 shadow-2xl border-border/40 bg-background/95 backdrop-blur-xl z-50 mt-1"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-xs font-bold text-[#009640] uppercase tracking-wider">User Account</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
        </div>

        <DropdownMenuItem
          className="gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all duration-200 focus:bg-[#009640]/10 focus:text-[#009640] group"
          onClick={() => router.push("/profile")}
        >
          <IconUser className="size-4 text-muted-foreground group-focus:text-[#009640] transition-colors" />
          <span className="text-sm font-medium">Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 mx-1 opacity-50" />

        <DropdownMenuItem
          className="gap-3 px-3 py-2 cursor-pointer rounded-lg text-muted-foreground hover:text-destructive focus:text-destructive focus:bg-destructive/10 group transition-all duration-200"
          onClick={() => logout()}
        >
          <IconLogout className="size-4 opacity-70 group-focus:opacity-100 transition-opacity" />
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
