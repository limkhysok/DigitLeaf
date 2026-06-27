"use client"

import * as React from "react"
import { IconLoader2, IconUsers, IconLockSquare, IconMapPin, IconEye, IconCirclePlusFilled, IconTrash } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, type RegionItem, type UserProfile } from "@/services/api-client"
import { hasScope } from "@/utils/rbac"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { MemberCard } from "./_components/member-card"
import { SetRegionsDialog } from "./_components/set-regions-dialog"
import { ViewMemberDialog } from "./_components/view-member-dialog"
import { AddMemberDialog } from "./_components/add-member-dialog"

export default function MemberHubPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()
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

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiClient.getRoles(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading && canManageMembers,
  })

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      apiClient.setUserRole(tokens!.access_token, userId, roleId),
    onSuccess: () => {
      toast.success(t.memberHub.roleUpdated)
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update role")
    },
  })

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<UserProfile | null>(null)

  const { mutate: deleteMember, isPending: isDeleting } = useMutation({
    mutationFn: (userId: number) => apiClient.deleteUser(tokens!.access_token, userId),
    onSuccess: () => {
      toast.success(t.memberHub.memberDeleted)
      queryClient.invalidateQueries({ queryKey: ["members"] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete member")
    },
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

  const regionSummary = React.useCallback(
    (regionIds: number[]) => {
      if (!regionIds.length) return "—"
      const matches = (regions ?? []).filter((r: RegionItem) => regionIds.includes(r.reg_id))
      if (!matches.length) return "—"
      const first = matches[0]!
      const firstLabel = first.reg_name_kh ? `${first.reg_name} | ${first.reg_name_kh}` : first.reg_name
      if (matches.length === 1) return firstLabel
      return `${firstLabel} ${t.memberHub.andMore.replace("{count}", String(matches.length - 1))}`
    },
    [regions, t]
  )

  const isProtectedRole = React.useCallback(
    (member: UserProfile) => ["admin", "boss"].includes((member.role_name ?? "").toLowerCase()),
    []
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
          <p className="text-muted-foreground text-sm md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
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
          autoComplete="off"
          className="rounded-md h-8 w-full sm:w-62.5 text-sm placeholder:text-sm"
        />
        <Button size="sm" onClick={() => setIsAddOpen(true)} className="h-8 px-2 flex gap-1.5 rounded-sm">
          <IconCirclePlusFilled className="h-4 w-4" />
          <span className="hidden sm:inline">{t.memberHub.add}</span>
        </Button>
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
              regionText={regionSummary(member.regions)}
              regionTitle={regionNames(member.regions)}
              manageRegionsLabel={t.memberHub.manageRegions}
              onManageRegions={() => setRegionsTarget(member)}
              viewDetailsLabel={t.memberHub.viewDetails}
              onViewDetails={() => setViewTarget(member)}
              onDelete={() => setDeleteTarget(member)}
              isProtected={isProtectedRole(member)}
              protectedTitle={t.memberHub.protectedRole}
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
                        <span className="font-medium capitalize">{member.user_name}</span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role_id ? String(member.role_id) : ""}
                          onValueChange={(value) => changeRole({ userId: member.id, roleId: Number(value) })}
                        >
                          <SelectTrigger className="h-7 w-40 text-sm capitalize">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {(roles ?? []).map((role) => (
                              <SelectItem key={role.id} value={String(role.id)} className="capitalize text-sm">
                                {role.name.replaceAll("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="max-w-50 truncate" title={regionNames(member.regions)}>
                        {regionSummary(member.regions)}
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
                            className="h-7 text-sm"
                          >
                            <IconMapPin className="h-3.5 w-3.5" />
                            {t.memberHub.manageRegions}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteTarget(member)}
                            disabled={isProtectedRole(member)}
                            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={t.memberHub.deleteMember}
                            title={isProtectedRole(member) ? t.memberHub.protectedRole : t.memberHub.deleteMember}
                          >
                            <IconTrash className="h-3.5 w-3.5" />
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

      <AddMemberDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        regions={assignableRegions ?? []}
        roles={roles ?? []}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.memberHub.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.memberHub.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) deleteMember(deleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.memberHub.deleteMember}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
