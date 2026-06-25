  "use client"

  import React from "react"
  import { SidebarTrigger } from "@workspace/ui/components/sidebar"
  import { NavUser } from "@/components/common/nav-user"
  import { LanguageToggle } from "@/components/common/language-toggle"
  import { useAuth } from "@/hooks/use-auth"

  export function TopNav() {
    const { user } = useAuth()
    return (
      <header
        className="flex h-13 shrink-0 items-center border-b border-gray-300 sticky top-0 z-30 bg-white"
      >
        <div className="flex h-full w-full items-center gap-2 px-2 md:px-3 lg:px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <SidebarTrigger className="h-7 w-7 hover:bg-black/5 transition-colors text-black" />
          </div>

          <div className="ml-auto flex items-center gap-1.5 pr-2">
            <LanguageToggle />
            <div className="h-6 w-px bg-black/20 mx-1.5" />
            <NavUser user={{
              name: user?.user_name || "Guest",
              email: `${user?.user_name || "guest"}@example.com`,
              avatar: "",
              accessType: user?.access_type ?? ""
            }} />
          </div>
        </div>
      </header>
    )
  }
