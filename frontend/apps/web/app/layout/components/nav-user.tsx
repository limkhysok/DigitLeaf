"use client"

import * as React from "react"

import {
  IconChevronDown,
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

export function NavUser({
  user,
}: Readonly<{
  user: {
    name: string
    email: string
    avatar: string
  }
}>) {
  const { mounted } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth()

  if (!mounted) {
    return <div className="h-8 w-8 animate-pulse bg-emerald-500/10 rounded-full" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 outline-none hover:bg-emerald-500/10 rounded-md pl-1 pr-3 py-1 transition-all duration-300 border border-transparent hover:border-emerald-500/20 active:scale-95"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-normal text-foreground/80 group-hover:text-emerald-600 transition-colors hidden sm:block">
            {user.name}
          </span>
          <IconChevronDown className="size-3.5 text-muted-foreground group-hover:text-emerald-600 transition-all duration-300 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-30 rounded-md p-1.5 shadow-md border-border/50 bg-background/95 backdrop-blur-xl z-50"
        side="bottom"
        align="end"
        sideOffset={10}
      >
        <DropdownMenuItem 
          className="gap-3 px-3 py-2.5 cursor-pointer rounded-md transition-colors focus:bg-emerald-500/10 focus:text-emerald-600 group"
          onClick={() => router.push("/profile")}
        >
          <IconUser className="size-4 text-muted-foreground group-focus:text-emerald-600" />
          <span className="text-sm font-medium">Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="opacity-50" />

        <DropdownMenuItem
          className="gap-3 px-3 py-2.5 cursor-pointer rounded-md text-destructive focus:text-destructive focus:bg-destructive/10 group"
          onClick={() => logout()}
        >
          <IconLogout className="size-4 opacity-70 group-focus:opacity-100" />
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
