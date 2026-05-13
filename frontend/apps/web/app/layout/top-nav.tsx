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
import { LanguageToggle } from "@/app/layout/components/language-toggle"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@workspace/ui/lib/utils"

export function TopNav() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()

  const pathSegments = pathname.split('/').filter(Boolean)


  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center border-b sticky top-0 z-30 transition-all duration-300 bg-background"
      )}
    >
      <div className="flex h-full w-full items-center gap-2 px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SidebarTrigger className="h-8 w-8 hover:bg-muted/80 transition-colors" />
          <div className="h-4 w-px bg-border mx-1" />
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-sm hover:text-[#009640] transition-colors">
                  {t.breadcrumb.workspace}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, index) => {
                if (segment.toLowerCase() === 'dashboard' && index === 0) return null;

                return (
                  <React.Fragment key={segment}>
                    <BreadcrumbSeparator className="opacity-50" />
                    <BreadcrumbItem>
                      {index === pathSegments.length - 1 ? (
                        <BreadcrumbPage className="capitalize truncate max-w-35 text-sm font-medium text-foreground">
                          {segment.replaceAll('-', ' ')}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join('/')}`} className="capitalize truncate max-w-30 text-xs hover:text-[#009640] transition-colors">
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

        <div className="ml-auto flex items-center gap-1.5 pr-2">
          <LanguageToggle />
          <div className="h-6 w-px bg-border/60 mx-1.5" />
          <NavUser user={{
            name: user?.user_name || "Guest",
            email: `${user?.user_name || "guest"}@example.com`,
            avatar: "",
            role: user?.role?.name ?? ""
          }} />
        </div>
      </div>
    </header>
  )
}
