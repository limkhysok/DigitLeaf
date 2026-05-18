"use client"

import * as React from "react"
import { format } from "date-fns"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import {
  apiClient,
  RepresentItem,
  SackRegistrationItem,
  SackStatusCounts,
} from "@/lib/api-client"
import { toast } from "sonner"
import {
  IconEye, IconLoader2, IconPencil, IconTrash,
  IconSortAscending, IconSortDescending, IconArrowsSort
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import {
  STATUS_MAP,
  buildFetchParams,
  getDateRange,
} from "./_components/constants"
import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { ViewDialog } from "./_components/view-dialog"
import { RegisterDialog } from "./_components/register-dialog"
import { SackRegistrationCard } from "./_components/sack-registration-card"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { FilterBar } from "./_components/filter-bar"

function checkHasActiveFilters(statusFilter: number | null, datePreset: string, sortSackInKg: string | null) {
  return statusFilter !== null || datePreset !== "last30" || sortSackInKg !== null
}

export default function SackRegistrationPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  // ── Data ──────────────────────────────────────────────────────────────────
  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [total, setTotal] = React.useState(0)
  const [skip, setSkip] = React.useState(0)
  const [refetchKey, setRefetchKey] = React.useState(0)
  const refetch = React.useCallback(() => setRefetchKey((k) => k + 1), [])
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<number | null>(null)
  const [datePreset, setDatePreset] = React.useState("last30")
  const [view, setView] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)
  const [statusCounts, setStatusCounts] = React.useState<SackStatusCounts | null>(null)
  const [sortSackInKg, setSortSackInKg] = React.useState<"asc" | "desc" | null>(null)

  // ── Search debounce ───────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch represents once ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => { })
  }, [isAuthLoading, tokens])

  // ── Fetch status counts (no status param — shows all buckets) ─────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    const dateRange = getDateRange(datePreset)
    const params = {
      ...(search.trim() ? { search: search.trim() } : {}),
      ...dateRange,
    }
    apiClient.getSackStatusCounts(tokens.access_token, params)
      .then(setStatusCounts)
      .catch(() => { })
  }, [isAuthLoading, tokens, search, datePreset, refetchKey])

  // ── Fetch records ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let cancelled = false
    const timer = setTimeout(() => setIsLoading(true), 0)
    const params = buildFetchParams(0, search, statusFilter, datePreset, sortSackInKg)
    apiClient.getSackRegistrations(tokens.access_token, params)
      .then((res) => {
        if (cancelled) return
        setRecords(res.items)
        setHasMore(res.has_more)
        setTotal(res.total)
        setSkip(res.items.length)
      })
      .catch((err) => { toast.error((err as Error).message) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isAuthLoading, tokens, search, statusFilter, datePreset, refetchKey, sortSackInKg])

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (!tokens?.access_token || !hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    const currentSkip = skip
    const params = buildFetchParams(currentSkip, search, statusFilter, datePreset, sortSackInKg)
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
  }, [tokens, hasMore, isLoadingMore, isLoading, skip, search, statusFilter, datePreset, sortSackInKg])

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

  if (!mounted) return null

  const hasActiveFilters = checkHasActiveFilters(statusFilter, datePreset, sortSackInKg)

  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">{t.sackRegistration.title}</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            {t.sackRegistration.subtitle}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE & TABLET FILTER BAR — (< 1024px / below lg)
      ════════════════════════════════════════════════════════════════════ */}
      <MobileFilterBar
        className="flex lg:hidden"
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        hasActiveFilters={hasActiveFilters}
        statusCounts={statusCounts}
        onRegister={() => setRegisterOpen(true)}
        sortSackInKg={sortSackInKg}
        setSortSackInKg={setSortSackInKg}
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
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        view={view}
        setView={setView}
        statusCounts={statusCounts}
        onRegister={() => setRegisterOpen(true)}
        sortSackInKg={sortSackInKg}
        setSortSackInKg={setSortSackInKg}
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
          {t.sackRegistration.table.noRecords}
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
              index={total - idx - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
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
              index={total - idx - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
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
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider w-10">{t.sackRegistration.table.no}</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.representative}</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.farmer}</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.status}</th>
                        <th
                          className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider cursor-pointer group select-none"
                          onClick={() => setSortSackInKg(prev => {
                            if (prev === "asc") return "desc";
                            if (prev === "desc") return null;
                            return "asc";
                          })}
                        >
                          <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                            {t.sackRegistration.table.sackWeight}
                            {sortSackInKg === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                            {sortSackInKg === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                            {!sortSackInKg && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.registeredBy}</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.registeredAt}</th>
                        <th className="px-4 py-3 w-10 text-center font-bold text-[#9CA3AF] text-[13px] uppercase tracking-wider">{t.sackRegistration.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => {
                        const status = STATUS_MAP[rec.status] ?? { className: "bg-gray-100 text-gray-800" }
                        const getStatusLabel = (statusVal: number) => {
                          switch (statusVal) {
                            case 0: return t.sackRegistration.filters.statusPending
                            case 1: return t.sackRegistration.filters.statusApproved
                            case 2: return t.sackRegistration.filters.statusRejected
                            default: return String(statusVal)
                          }
                        }
                        const statusLabel = getStatusLabel(rec.status)
                        return (
                          <tr key={rec.id} className={cn("group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors", idx % 2 === 1 && "bg-[#F9FAFB]/60")}>
                            <td className="px-4 py-3 text-[#9CA3AF] text-xs">{total - idx}</td>
                            <td className="px-4 py-3 text-[#111827] font-semibold">{rec.represent_name}</td>
                            <td className="px-4 py-3 text-[#374151]">{rec.member_farmer_name}</td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-bold border", status.className)}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-left tabular-nums text-[#374151] text-xs font-medium">
                              {rec.sack_in_kg ?? <span className="text-[#D1D5DB]">—</span>}
                            </td>
                            <td className="px-4 py-3 text-[#6B7280] text-xs font-medium">{rec.dl_user_name}</td>
                            <td className="px-4 py-3 text-[#9CA3AF] text-xs">
                              {format(new Date(rec.registered_at), "dd/MM/yyyy 'at' h:mm a")}
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
                                  onClick={() => setDeleteTarget({ id: rec.id, no: total - idx })}
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
                  index={total - idx - 1}
                  onView={setViewTarget}
                  onEdit={setEditTarget}
                  onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
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
        onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - records.findIndex(r => r.id === rec.id) })}
      />
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
    </div>
  )
}
