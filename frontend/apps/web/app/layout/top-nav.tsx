"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { NavUser } from "@/app/layout/components/nav-user"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@workspace/ui/lib/utils"

export function TopNav() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const pathSegments = pathname.split('/').filter(Boolean)

  let dynamicPadding = "pl-4"
  if (mounted) {
    dynamicPadding = "pl-[10px]"
  }

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 transition-all duration-300",
        dynamicPadding
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <SidebarTrigger className="h-8 w-8 relative z-50" />
        <Breadcrumb className="flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                Workspace
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              if (segment.toLowerCase() === 'dashboard' && index === 0) return null;

              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === pathSegments.length - 1 ? (
                      <BreadcrumbPage className="capitalize truncate max-w-[140px]">
                        {segment.replaceAll('-', ' ')}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join('/')}`} className="capitalize truncate max-w-[120px]">
                        {segment.replaceAll('-', ' ')}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <NavUser user={{
          name: user?.user_name || "Guest",
          email: `${user?.user_name || "guest"}@example.com`,
          avatar: ""
        }} />
      </div>
    </header>
  )
}
