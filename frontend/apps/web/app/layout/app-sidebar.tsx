"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import {
  IconLeaf,
  IconLayoutDashboard,
  IconReceipt,
  IconTerminal2,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"

import Image from "next/image"
import { NavMain } from "@/app/layout/components/nav-main"

export const data = {
  user: {
    name: "Limkhi",
    email: "soklim@example.com",
    avatar: "/avatars/sk.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconLayoutDashboard,
      isActive: true,
    },
    {
      title: "Leaf",
      url: "/leaf",
      icon: IconLeaf,
    },
    {
      title: "Invoice",
      url: "/invoice",
      icon: IconReceipt,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: IconTerminal2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <SidebarHeader className="h-10 border-b p-2">
          <div className="h-full w-full animate-pulse bg-sidebar-accent/50 rounded-lg" />
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-4 p-4">
            <div className="h-4 w-3/4 animate-pulse bg-sidebar-accent/50 rounded" />
            <div className="h-4 w-1/2 animate-pulse bg-sidebar-accent/50 rounded" />
            <div className="h-4 w-2/3 animate-pulse bg-sidebar-accent/50 rounded" />
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader className="h-12 border-b p-0 px-3 group-data-[collapsible=icon]/sidebar:p-0">
        <div className="flex h-full items-center gap-2 group-data-[collapsible=icon]/sidebar:justify-center relative">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src="/assets/newKAIC.png"
              alt="KAIC Logo"
              width={24}
              height={24}
              className="object-contain transition-all duration-300 group-data-[collapsible=icon]/sidebar:scale-110"
            />
          </div>
          <span className="font-medium text-lg tracking-widest text-sidebar-foreground/90 truncate group-data-[collapsible=icon]/sidebar:hidden uppercase">
            K.A.I.C
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
