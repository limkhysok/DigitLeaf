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
                  "group/btn relative transition-all duration-200 ease-in-out h-9",
                  "group-data-[collapsible=icon]/sidebar:justify-center",
                  isActive
                    ? "bg-[#009640]! text-white! font-medium"
                    : "text-black! hover:bg-black/5! hover:text-black!"
                )}
              >
                <Link href={item.url}>
                  {item.icon && (
                    <item.icon size={18} stroke={1.5} />
                  )}
                  <span className={cn(
                    "truncate text-sm transition-all duration-200 group-data-[collapsible=icon]/sidebar:hidden",
                    isActive ? "font-semibold" : "font-medium"
                  )}>
                    {item.title}
                  </span>

                  {item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white text-[10px] font-bold px-1 group-data-[collapsible=icon]/sidebar:hidden">
                      {item.badge}
                    </span>
                  )}

                  {item.hasUpdate && !item.badge && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white group-data-[collapsible=icon]/sidebar:hidden" />
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
