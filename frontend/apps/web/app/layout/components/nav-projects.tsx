"use client"

import * as React from "react"

import { IconDotsVertical, IconFolder, IconShare, IconTrash, type TablerIcon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

export function NavProjects({
  projects,
}: Readonly<{
  projects: {
    name: string
    url: string
    icon: TablerIcon
  }[]
}>) {
  const { isMobile } = useSidebar()
  const side = isMobile ? "bottom" : "right"
  const align = isMobile ? "end" : "start"

  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]/sidebar:hidden">
      <SidebarGroupLabel className="px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const isActive = pathname === item.url
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive}
                className={cn(
                  "group/btn relative gap-3 rounded-md transition-all duration-300 h-9 px-3",
                  isActive 
                    ? "bg-emerald-50 text-emerald-700 font-medium" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3 w-full">
                  {/* Indicator Line */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-r-full" />
                  )}
                  
                  <item.icon size={18} stroke={1.5} className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-emerald-600" : "text-slate-400 group-hover/btn:text-slate-600"
                  )} />
                  <span className={cn(
                    "text-sm transition-all duration-300",
                    isActive ? "font-semibold" : "font-medium"
                  )}>
                    {item.name}
                  </span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <IconDotsVertical />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={side}
                  align={align}
                >
                  <DropdownMenuItem>
                    <IconFolder className="mr-2 size-[1.1rem] text-muted-foreground" />
                    <span>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconShare className="mr-2 size-[1.1rem] text-muted-foreground" />
                    <span>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <IconTrash className="mr-2 size-[1.1rem] text-muted-foreground" />
                    <span>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/80">
            <IconDotsVertical />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
