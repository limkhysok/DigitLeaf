"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"
import { AppSidebar } from "@/components/common/app-sidebar"
import { TopNav } from "@/components/common/top-nav"
import { useUserManifest } from "@/hooks/use-user-manifest"

function PageTracker() {
  const pathname = usePathname()
  const { setLastActivePage } = useUserManifest()

  React.useEffect(() => {
    setLastActivePage(pathname)
  }, [pathname, setLastActivePage])

  return null
}

export function DashboardLayoutClient({
  children,
  defaultOpen,
}: Readonly<{
  children: React.ReactNode
  defaultOpen: boolean
}>) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <PageTracker />
      <AppSidebar />
      <SidebarInset className="h-svh overflow-y-auto overflow-x-hidden">
        <TopNav />
        <div className="flex-1 p-3 md:p-4 lg:p-5">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
