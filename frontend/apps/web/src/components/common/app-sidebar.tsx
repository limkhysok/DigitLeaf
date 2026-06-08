"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import {
  IconLayoutDashboardFilled,
  IconCloverFilled,
  IconArrowAutofitRightFilled,
  IconFileDescriptionFilled,
  IconCashBanknoteFilled,
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
      icon: IconLayoutDashboardFilled,
      isActive: true,
    },
    {
      title: t.sidebar.sackRegistration,
      url: "/sack-registration",
      icon: IconArrowAutofitRightFilled,
    },
    {
      title: t.sidebar.tobaccoPurchase,
      url: "/tobacco-purchase",
      icon: IconCloverFilled,
    },
    {
      title: t.sidebar.farmerContrast,
      url: "/farmer-contrast",
      icon: IconFileDescriptionFilled,
    },
    {
      title: t.sidebar.tobaccoReturn,
      url: "/tobacco-return",
      icon: IconCashBanknoteFilled,
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
        <SidebarHeader className="h-10 border-b">
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
      <SidebarHeader className="h-14 flex items-center bg-white border-b border-gray-200 p-0">
        <div className="flex h-full items-center gap-3 w-full px-4 group/logo cursor-pointer hover:bg-gray-200 transition-colors group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:px-0 group-data-[collapsible=icon]/sidebar:gap-0">
          <Image
            src="/assets/newKAIC.png"
            alt="KAIC Logo"
            width={26}
            height={26}
            className="object-contain shrink-0 transition-transform duration-300 group-hover/logo:scale-105"
          />

          <div className="flex flex-col gap-0 pt-1 min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-300 ease-in-out group-data-[collapsible=icon]/sidebar:opacity-0 group-data-[collapsible=icon]/sidebar:max-w-0">
            <span className="text-sm font-bold tracking-widest text-black uppercase leading-none whitespace-nowrap">
              KAIC
            </span>
            <span className="text-[11px] font-semibold text-green-700 uppercase tracking-normal">
              Internal System
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-2">
        <NavMain items={navData} />
      </SidebarContent>
    </Sidebar>
  )
}
