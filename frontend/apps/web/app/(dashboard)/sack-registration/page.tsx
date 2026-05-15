"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  RepresentItem,
  SackRegistrationItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import {
  IconEye, IconLoader2, IconPencil, IconTrash
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import {
  STATUS_MAP,
  SortOrder,
  SORT_CYCLE,
  buildFetchParams
} from "./_components/constants"
import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { ViewDialog } from "./_components/view-dialog"
import { RegisterDialog } from "./_components/register-dialog"
import { SackRegistrationCard } from "./_components/sack-registration-card"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { FilterBar } from "./_components/filter-bar"

function checkHasActiveFilters(
  statusFilter: number | null,
  datePreset: string,
  sortOrder: SortOrder
) {
  return statusFilter !== null || datePreset !== "last30" || sortOrder !== "default"
}

export default function SackRegistrationPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()

  // ── Data ──────────────────────────────────────────────────────────────────
  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [skip, setSkip] = React.useState(0)
  const [refetchKey, setRefetchKey] = React.useState(0)
  const refetch = React.useCallback(() => setRefetchKey((k) => k + 1), [])
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<number | null>(null)
  const [datePreset, setDatePreset] = React.useState("last30")
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("default")
  const [view, setView] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  // ── Search debounce ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch represents once ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => {})
  }, [isAuthLoading, tokens])

  // ── Fetch records ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let cancelled = false
    const timer = setTimeout(() => setIsLoading(true), 0)
    const params = buildFetchParams(0, search, statusFilter, sortOrder, datePreset)
    apiClient.getSackRegistrations(tokens.access_token, params)
      .then((res) => {
        if (cancelled) return
        setRecords(res.items)
        setHasMore(res.has_more)
        setSkip(res.items.length)
      })
      .catch((err) => { toast.error((err as Error).message) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isAuthLoading, tokens, search, statusFilter, sortOrder, datePreset, refetchKey])

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (!tokens?.access_token || !hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    const currentSkip = skip
    const params = buildFetchParams(currentSkip, search, statusFilter, sortOrder, datePreset)
    try {
      const res = await apiClient.getSackRegistrations(tokens.access_token, params)
      setRecords((prev) => [...prev, ...res.items])
      setHasMore(res.has_more)
      setSkip(currentSkip + res.items.length)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoadingMore(false)
    }
  }, [tokens, hasMore, isLoadingMore, isLoading, skip, search, statusFilter, sortOrder, datePreset])

  // ── IntersectionObserver ──────────────────────────────────────────────────
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const cycleSortOrder = () => setSortOrder((prev) => SORT_CYCLE[prev])

  if (!mounted) return null

  const hasActiveFilters = checkHasActiveFilters(statusFilter, datePreset, sortOrder)

  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Sack Registration</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            Register and manage sacks for tobacco processing.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FILTER BAR — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      <MobileFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        hasActiveFilters={hasActiveFilters}
        onRegister={() => setRegisterOpen(true)}
      />

      {/* ════════════════════════════════════════════════════════════════════
          TABLET FILTER BAR — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      <FilterBar
        className="hidden md:flex lg:hidden"
        searchClassName="min-w-36 max-w-56"
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        sortOrder={sortOrder}
        cycleSortOrder={cycleSortOrder}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        view={view}
        setView={setView}
        onRegister={() => setRegisterOpen(true)}
      />

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP FILTER BAR — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      <FilterBar
        className="hidden lg:flex"
        searchClassName="min-w-40 max-w-xs"
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        sortOrder={sortOrder}
        cycleSortOrder={cycleSortOrder}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        view={view}
        setView={setView}
        onRegister={() => setRegisterOpen(true)}
      />

      {/* ════════════════════════════════════════════════════════════════════
          LOADING / EMPTY STATES — shared
      ════════════════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && records.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No registrations found.
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {records.map((rec, idx) => (
            <SackRegistrationCard
              key={rec.id}
              rec={rec}
              index={idx}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: idx + 1 })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {records.map((rec, idx) => (
            <SackRegistrationCard
              key={rec.id}
              rec={rec}
              index={idx}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: idx + 1 })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="hidden lg:block">
          {view === "list" ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-[#F9FAFB] border-gray-200">
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-10">No.</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Represent</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Farmer</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Registered By</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Registered At</th>
                        <th className="px-4 py-3 w-10 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => {
                        const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
                        return (
                          <tr key={rec.id} className={cn("group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors", idx % 2 === 1 && "bg-[#F9FAFB]/60")}>
                            <td className="px-4 py-3 text-[#9CA3AF] text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 text-[#111827] font-semibold">{rec.represent_name}</td>
                            <td className="px-4 py-3 text-[#374151]">{rec.member_farmer_name}</td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border", status.className)}>
                                {status.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#6B7280] text-xs font-medium">{rec.dl_user_name}</td>
                            <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                              {new Date(rec.registered_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setViewTarget(rec)}
                                  className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                                >
                                  <IconEye className="size-4" stroke={1.5} />
                                </button>
                                <button
                                  onClick={() => setEditTarget(rec)}
                                  className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                                >
                                  <IconPencil className="size-4" stroke={1.5} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                                  className="p-1 rounded-md hover:bg-rose-50 text-[#9CA3AF] hover:text-rose-600 transition-colors"
                                >
                                  <IconTrash className="size-4" stroke={1.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
              {records.map((rec, idx) => (
                <SackRegistrationCard
                  key={rec.id}
                  rec={rec}
                  index={idx}
                  onView={setViewTarget}
                  onEdit={setEditTarget}
                  onDelete={(rec) => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Infinite scroll sentinel ─────────────────────────────────────── */}
      <div ref={sentinelRef} className="h-1" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <EditDialog target={editTarget} onClose={() => setEditTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <ViewDialog
        target={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={setEditTarget}
        onDelete={(rec) => setDeleteTarget({ id: rec.id, no: records.findIndex(r => r.id === rec.id) + 1 })}
      />
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
    </div>
  )
}
