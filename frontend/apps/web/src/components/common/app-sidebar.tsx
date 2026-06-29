            "use client"

            import * as React from "react"
            import { useSyncExternalStore } from "react"
            import {
              IconLayoutDashboard,
              IconArrowAutofitRight,
              IconClover,
              IconFileDescription,
              IconCashBanknote,
              IconUsers,
              IconActivity,
            } from "@tabler/icons-react"

            import {
              Sidebar,
              SidebarContent,
              SidebarHeader,
            } from "@workspace/ui/components/sidebar"

            import Image from "next/image"
            import { NavMain } from "@/components/common/nav-main"
            import { useLanguage } from "@/hooks/use-language"
            import { useAuth } from "@/hooks/use-auth"
            import { hasScope } from "@/utils/rbac"

            export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
              const { t } = useLanguage()
              const { tokens } = useAuth()
              const canManageMembers = hasScope(tokens, "manage_users", "admin")
              const canViewLogs = hasScope(tokens, "view_audit_logs")

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
                  title: t.sidebar.farmerContract,
                  url: "/farmer-contract",
                  icon: IconFileDescription,
                },
                {
                  title: t.sidebar.tobaccoRepay,
                  url: "/tobacco-repay",
                  icon: IconCashBanknote,
                },
                ...(canManageMembers
                  ? [{
                    title: t.sidebar.memberHub,
                    url: "/member-hub",
                    icon: IconUsers,
                  }]
                  : []),
                ...(canViewLogs
                  ? [{
                    title: t.sidebar.monitorLogs,
                    url: "/monitor-logs",
                    icon: IconActivity,
                  }]
                  : []),
              ], [t, canManageMembers, canViewLogs])

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
                    <div className="flex h-full border-b border-gray-300 items-center gap-2 w-full px-4.5 group/logo mx-2 transition-all duration-200 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:mx-0 group-data-[collapsible=icon]/sidebar:px-0 group-data-[collapsible=icon]/sidebar:gap-0">
                      <div className="flex items-center justify-center rounded-sm p-0 shrink-0 transition-transform duration-200">
                        <Image
                          src="/assets/newKAIC.png"
                          alt="KAIC Logo"
                          width={25}
                          height={25}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex flex-col gap-0 overflow-hidden transition-[opacity,max-width] duration-300 ease-in-out group-data-[collapsible=icon]/sidebar:opacity-0 group-data-[collapsible=icon]/sidebar:max-w-0">
                        <span className="text-md font-semibold text-foreground leading-tight ">
                          KAIC
                        </span>
                        <span className="text-[12px] font-normal text-muted-foreground leading-tight">
                          Internal system
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
