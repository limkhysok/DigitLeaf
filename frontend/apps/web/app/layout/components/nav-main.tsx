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
          const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"))

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  "group/btn relative overflow-hidden transition-all duration-500 ease-in-out",
                  // Sizing
                  "h-10 px-4 group-data-[collapsible=icon]/sidebar:h-11 group-data-[collapsible=icon]/sidebar:w-11 group-data-[collapsible=icon]/sidebar:p-0 group-data-[collapsible=icon]/sidebar:flex group-data-[collapsible=icon]/sidebar:items-center group-data-[collapsible=icon]/sidebar:justify-center",
                  // Shape
                  "rounded-none group-data-[collapsible=icon]/sidebar:rounded-full",
                  // Active State
                  isActive
                    ? "bg-[#009640]! text-white! hover:bg-[#008a3b]!"
                    : "hover:bg-[#009640]/5 active:bg-[#009640]/10"
                )}
              >
                <Link href={item.url} className="flex items-center gap-2 group-data-[collapsible=icon]/sidebar:gap-0 group-data-[collapsible=icon]/sidebar:justify-center">
                  {item.icon && (
                    <div className={cn(
                      "flex items-center justify-center transition-colors duration-300",
                      isActive ? "text-white" : "text-muted-foreground group-hover/btn:text-foreground"
                    )}>
                      <item.icon size={17} stroke={2} />
                    </div>
                  )}
                  <span className={cn(
                    "truncate text-[13px] transition-all duration-300 group-data-[collapsible=icon]/sidebar:hidden",
                    isActive ? "font-bold text-white" : "text-sidebar-foreground/80 group-hover/btn:text-sidebar-foreground"
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
