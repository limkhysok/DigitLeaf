"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"
import { AppSidebar } from "@/app/layout/app-sidebar"
import { TopNav } from "@/app/layout/top-nav"
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
        <div className="flex-1 p-4 md:p-5 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
