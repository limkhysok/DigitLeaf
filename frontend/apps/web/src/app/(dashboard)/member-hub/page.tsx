"use client"

import * as React from "react"
import { IconLoader2, IconUsers, IconLockSquare, IconMapPin, IconEye } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, type RegionItem, type UserProfile } from "@/services/api-client"
import { hasScope } from "@/utils/rbac"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { Input } from "@workspace/ui/components/input"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { MemberCard } from "./_components/member-card"
import { SetRegionsDialog } from "./_components/set-regions-dialog"
import { ViewMemberDialog } from "./_components/view-member-dialog"

export default function MemberHubPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  const canManageMembers = hasScope(tokens, "manage_users", "admin")

  const [searchInput, setSearchInput] = React.useState("")
  const [search] = useDebounce(searchInput, 300)

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

  const { data: assignableRegions } = useQuery({
    queryKey: ["assignable-regions"],
    queryFn: () => apiClient.getAssignableRegions(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading && canManageMembers,
  })

  const regionNames = React.useCallback(
    (regionIds: number[]) => {
      if (!regionIds.length) return "—"
      const matches = (regions ?? []).filter((r: RegionItem) => regionIds.includes(r.reg_id))
      if (!matches.length) return "—"
      return matches.map((m) => (m.reg_name_kh ? `${m.reg_name} | ${m.reg_name_kh}` : m.reg_name)).join(", ")
    },
    [regions]
  )

  const filteredMembers = React.useMemo(() => {
    if (!members) return []
    if (!search) return members
    const q = search.toLowerCase()
    return members.filter((m) => m.user_name.toLowerCase().includes(q))
  }, [members, search])

  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [regionsTarget, setRegionsTarget] = React.useState<UserProfile | null>(null)
  const [viewTarget, setViewTarget] = React.useState<UserProfile | null>(null)

  const toggleRow = React.useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const isAllSelected = filteredMembers.length > 0 && filteredMembers.every((m) => selectedIds.has(m.id))
  const isSomeSelected = !isAllSelected && filteredMembers.some((m) => selectedIds.has(m.id))

  const toggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) filteredMembers.forEach((m) => next.add(m.id))
      else filteredMembers.forEach((m) => next.delete(m.id))
      return next
    })
  }, [filteredMembers])

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
      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.memberHub.title}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
            {t.memberHub.subtitle}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SEARCH
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-2">
        <Input
          placeholder={t.memberHub.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md h-8 w-full sm:w-62.5 text-xs placeholder:text-sm"
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          LOADING / EMPTY STATES
      ════════════════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && filteredMembers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
          <IconUsers className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{t.memberHub.noRecordsFound}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE & TABLET CONTENT — (< 1024px / below lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && filteredMembers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
          {filteredMembers.map((member, idx) => (
            <MemberCard
              key={member.id}
              member={member}
              index={idx + 1}
              isAdmin={member.access_type.toLowerCase() === "all" || member.access_type.toLowerCase() === "admin"}
              regionLabel={t.memberHub.columns.region}
              regionText={regionNames(member.regions)}
              manageRegionsLabel={t.memberHub.manageRegions}
              onManageRegions={() => setRegionsTarget(member)}
              viewDetailsLabel={t.memberHub.viewDetails}
              onViewDetails={() => setViewTarget(member)}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && filteredMembers.length > 0 && (
        <div className="hidden lg:block rounded-md border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllSelected || (isSomeSelected && "indeterminate")}
                      onCheckedChange={(value) => toggleAllRows(!!value)}
                      aria-label="Select all"
                      className="translate-y-0.5"
                    />
                  </TableHead>
                  <TableHead className="w-12">{t.memberHub.columns.no}</TableHead>
                  <TableHead>{t.memberHub.columns.username}</TableHead>
                  <TableHead>{t.memberHub.columns.role}</TableHead>
                  <TableHead>{t.memberHub.columns.region}</TableHead>
                  <TableHead>{t.memberHub.columns.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {filteredMembers.map((member: UserProfile, idx: number) => {
                  const isAdmin = member.access_type.toLowerCase() === "all" || member.access_type.toLowerCase() === "admin"
                  const initials = member.user_name.substring(0, 2).toUpperCase()
                  return (
                    <TableRow key={member.id} className="group/row" data-state={selectedIds.has(member.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(member.id)}
                          onCheckedChange={(value) => toggleRow(member.id, !!value)}
                          aria-label="Select row"
                          className="translate-y-0.5"
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 rounded-full border border-border/60 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-muted text-foreground rounded-full">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium capitalize">{member.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px] font-medium rounded-sm capitalize w-fit",
                            isAdmin
                              ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {member.access_type || "Standard"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-50 truncate" title={regionNames(member.regions)}>
                        {regionNames(member.regions)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setViewTarget(member)}
                            className="h-7 w-7"
                            aria-label={t.memberHub.viewDetails}
                            title={t.memberHub.viewDetails}
                          >
                            <IconEye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRegionsTarget(member)}
                            className="h-7 text-xs"
                          >
                            <IconMapPin className="h-3.5 w-3.5" />
                            {t.memberHub.manageRegions}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <SetRegionsDialog
        open={regionsTarget !== null}
        onOpenChange={(open) => { if (!open) setRegionsTarget(null) }}
        member={regionsTarget}
        regions={assignableRegions ?? []}
      />

      <ViewMemberDialog
        open={viewTarget !== null}
        onOpenChange={(open) => { if (!open) setViewTarget(null) }}
        member={viewTarget}
        regions={regions ?? []}
      />
    </div>
  )
}
