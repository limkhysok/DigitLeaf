"use client"

import * as React from "react"
import { IconLoader2, IconUsers, IconLockSquare } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, type RegionItem, type UserProfile } from "@/services/api-client"
import { hasScope } from "@/utils/rbac"
import { useQuery } from "@tanstack/react-query"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export default function MemberHubPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, language } = useLanguage()
  const canManageMembers = hasScope(tokens, "manage_users", "admin")

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => apiClient.listUsers(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading && canManageMembers,
  })

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: () => apiClient.getRegions(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading && canManageMembers,
  })

  const regionName = React.useCallback(
    (regionId: number | null) => {
      if (regionId == null) return "—"
      const match = regions?.find((r: RegionItem) => r.reg_id === regionId)
      if (!match) return "—"
      return language === "kh" ? match.reg_name_kh || match.reg_name : match.reg_name
    },
    [regions, language]
  )

  if (!mounted) return null

  if (!canManageMembers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-2 text-muted-foreground text-sm">
        <IconLockSquare className="h-8 w-8 stroke-[1.5]" />
        <span>{t.memberHub.accessDenied}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10">
      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.memberHub.title}</h1>
        <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
          {t.memberHub.subtitle}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!members || members.length === 0) && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
          <IconUsers className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{t.memberHub.noRecordsFound}</span>
        </div>
      )}

      {!isLoading && members && members.length > 0 && (
        <div className="rounded-md border border-black/20 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.memberHub.columns.username}</TableHead>
                <TableHead>{t.memberHub.columns.role}</TableHead>
                <TableHead>{t.memberHub.columns.region}</TableHead>
                <TableHead>{t.memberHub.columns.created}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member: UserProfile) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium capitalize">{member.user_name}</TableCell>
                  <TableCell className="capitalize">{member.access_type || "Standard"}</TableCell>
                  <TableCell>{regionName(member.region)}</TableCell>
                  <TableCell>{member.do_date ? new Date(member.do_date).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
