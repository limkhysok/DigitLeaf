"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import {
  IconLayoutDashboard,
  IconArrowAutofitRight,
  IconClover,
  IconFileDescription,
  IconCashBanknote,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@workspace/ui/components/sidebar"

import Image from "next/image"
import { NavMain } from "@/components/common/nav-main"
import { useLanguage } from "@/hooks/use-language"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useLanguage()

  const navData = React.useMemo(() => [
    {
      title: t.sidebar.dashboard,
      url: "/dashboard",
      icon: IconLayoutDashboard,
      isActive: true,
    },
    {
      title: t.sidebar.sackRegistration,
      url: "/sack-registration",
      icon: IconArrowAutofitRight,
    },
    {
      title: t.sidebar.tobaccoPurchase,
      url: "/tobacco-purchase",
      icon: IconClover,
    },
    {
      title: t.sidebar.farmerContrast,
      url: "/farmer-contrast",
      icon: IconFileDescription,
    },
    {
      title: t.sidebar.tobaccoReturn,
      url: "/tobacco-return",
      icon: IconCashBanknote,
    },
  ], [t])

  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  )

  if (!mounted) {
    return (
      <Sidebar variant="sidebar" collapsible="icon" {...props}>
        <SidebarHeader className="h-8 border-b">
          <div className="h-full w-full animate-pulse bg-sidebar-accent/50 rounded-sm" />
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
    <Sidebar variant="sidebar" collapsible="icon" className="bg-white border-r border-gray-200" {...props}>
      <SidebarHeader className="h-13 flex items-center bg-white p-0">
        <div className="flex h-full border-b border-gray-300 items-center gap-0.5 w-full px-4.5 group/logo cursor-pointer  mx-2 hover:bg-gray-50 transition-all duration-200 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:mx-0 group-data-[collapsible=icon]/sidebar:px-0 group-data-[collapsible=icon]/sidebar:gap-0">
          <Image
            src="/assets/newKAIC.png"
            alt="KAIC Logo"
            width={21}
            height={21}
            className="mb-1 object-contain shrink-0 transition-transform duration-200 group-hover/logo:scale-105"
          />
          <span className="text-[20px] font-medium tracking-wider text-green-800 whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-300 ease-in-out group-data-[collapsible=icon]/sidebar:opacity-0 group-data-[collapsible=icon]/sidebar:max-w-0 ">
            Kaic
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavMain items={navData} />
      </SidebarContent>
    </Sidebar>
  )
}
