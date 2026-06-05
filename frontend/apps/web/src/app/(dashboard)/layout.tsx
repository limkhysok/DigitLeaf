import { cookies } from "next/headers"
import { DashboardLayoutClient } from "./layout-client"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get("sidebar_state")
  const defaultOpen = sidebarCookie ? sidebarCookie.value !== "false" : true

  return (
    <DashboardLayoutClient defaultOpen={defaultOpen}>
      {children}
    </DashboardLayoutClient>
  )
}
