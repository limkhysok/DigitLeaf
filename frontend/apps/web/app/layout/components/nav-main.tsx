"use client"

import { type TablerIcon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

export function NavMain({
  items,
}: Readonly<{
  items: {
    title: string
    url: string
    icon?: TablerIcon
    isActive?: boolean
    badge?: string
    hasUpdate?: boolean
  }[]
}>) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))

          return (
            <SidebarMenuItem key={item.title} className="px-2 mb-1.5 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "group/btn relative overflow-hidden transition-all duration-300 h-10 px-4 rounded-full",
                  isActive
                    ? "!bg-[#009640] !text-white hover:!bg-[#008a3b]"
                    : "hover:bg-[#009640]/5 active:bg-[#009640]/10"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  {item.icon && (
                    <div className={cn(
                      "flex items-center justify-center transition-colors duration-300",
                      isActive ? "text-white" : "text-muted-foreground group-hover/btn:text-foreground"
                    )}>
                      <item.icon size={17} stroke={isActive ? 2.5 : 1.5} />
                    </div>
                  )}
                  <span className={cn(
                    "truncate transition-all duration-300",
                    isActive ? "font-bold text-white" : "text-sidebar-foreground/70 group-hover/btn:text-sidebar-foreground"
                  )}>
                    {item.title}
                  </span>

                  {item.badge && (
                    <span className={cn(
                      "ml-auto flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold group-data-[collapsible=icon]/sidebar:hidden",
                      isActive ? "bg-white text-[#009640]" : "bg-[#009640] text-white"
                    )}>
                      {item.badge}
                    </span>
                  )}

                  {item.hasUpdate && !item.badge && (
                    <div className="ml-auto h-2 w-2 relative group-data-[collapsible=icon]/sidebar:hidden">
                      <span className={cn(
                        "absolute inset-0 animate-ping rounded-full opacity-75",
                        isActive ? "bg-white" : "bg-green-400"
                      )} />
                      <span className={cn(
                        "relative block h-2 w-2 rounded-full",
                        isActive ? "bg-white" : "bg-[#009640]"
                      )} />
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
