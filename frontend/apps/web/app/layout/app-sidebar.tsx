"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import {
  IconLeaf,
  IconLayoutDashboard,
  IconReceipt,
  IconTerminal2,
  IconPackage,
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
      title: "Leaf Sack Registration",
      url: "/leaf-sack-registration",
      icon: IconPackage,
    },
    {
      title: "Invoices",
      url: "/invoice",
      icon: IconReceipt,
      badge: "3",
    },
    {
      title: "Activity Logs",
      url: "/logs",
      icon: IconTerminal2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <SidebarHeader className="h-10 border-b">
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
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader className="h-14 flex items-center justify-center p-0 px-2 transition-all duration-300 group-data-[collapsible=icon]/sidebar:h-14 border-b border-sidebar-border/50">
        <div className="flex h-12 items-center gap-3 bg-transparent px-3 w-full group/logo cursor-pointer hover:bg-sidebar-accent/30 transition-all duration-300 group-data-[collapsible=icon]/sidebar:p-0 group-data-[collapsible=icon]/sidebar:bg-transparent group-data-[collapsible=icon]/sidebar:border-none group-data-[collapsible=icon]/sidebar:justify-center relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute inset-0 bg-[#009640]/0 group-hover:bg-[#009640]/2 transition-colors duration-500" />



          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#009640] to-[#007a33] shadow-[0_4px_12px_rgba(0,150,64,0.2)] transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(0,150,64,0.3)] ml-0.5 relative z-10">
            <div className="absolute inset-0 animate-pulse bg-white/20 group-hover:animate-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <Image
              src="/assets/newKAIC.png"
              alt="KAIC Logo"
              width={18}
              height={18}
              className="object-contain brightness-0 invert relative z-20 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <div className="flex flex-col truncate group-data-[collapsible=icon]/sidebar:hidden flex-1 ml-1 relative z-10">
            <span className="font-branding text-sm tracking-[0.12em] text-[#009640] group-hover:text-[#008a3b] transition-colors duration-300 uppercase">
              K.A.I.C
            </span>
            <span className="text-[9px] font-branding text-muted-foreground tracking-wider uppercase -mt-0.5">
              Internal System
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
