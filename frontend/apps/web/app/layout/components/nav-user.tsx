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
    return <div className="h-8 w-8 animate-pulse bg-muted rounded-none" />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 outline-none hover:bg-muted/50 rounded-none pl-1 pr-3 py-1 transition-all duration-300 border border-transparent hover:border-border/40 active:scale-95"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-none bg-muted-foreground/20 text-foreground text-xs font-semibold shadow-sm group-hover:bg-muted-foreground/30 transition-colors duration-300">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors hidden sm:block">
            {user.name}
          </span>
          <IconChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-all duration-300 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-44 rounded-none p-1 shadow-xl border-border/40 bg-background/95 backdrop-blur-xl z-50"
        side="bottom"
        align="end"
        alignOffset={-4}
        sideOffset={8}
      >
        <DropdownMenuItem 
          className="gap-3 px-3 py-2 cursor-pointer rounded-none transition-colors focus:bg-muted focus:text-foreground group"
          onClick={() => router.push("/profile")}
        >
          <IconUser className="size-4 text-muted-foreground group-focus:text-foreground" />
          <span className="text-sm font-medium">Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1" />

        <DropdownMenuItem
          className="gap-3 px-3 py-2 cursor-pointer rounded-none text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-muted group"
          onClick={() => logout()}
        >
          <IconLogout className="size-4 opacity-70 group-focus:opacity-100" />
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
