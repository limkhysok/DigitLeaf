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
  IconArrowsSort, IconChevronDown, IconCalendar, IconEye,
  IconLayoutGrid, IconLayoutList, IconLoader2,
  IconPencil, IconPlus, IconSearch, IconSortAscending,
  IconSortDescending, IconTrash, IconFilter, IconUser,
  IconUsers, IconClock, IconWeight

} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  STATUS_MAP,
  STATUS_FILTER_OPTIONS,
  DATE_PRESETS,
  SortOrder,
  SORT_CYCLE,
  buildFetchParams
} from "./_components/constants"
import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { ViewDialog } from "./_components/view-dialog"
import { RegisterDialog } from "./_components/register-dialog"

export default function SackRegistrationPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()

  // ── Data ────────────────────────────────────────────────────────────────────
  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [skip, setSkip] = React.useState(0)
  const [refetchKey, setRefetchKey] = React.useState(0)
  const refetch = React.useCallback(() => setRefetchKey((k) => k + 1), [])
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<number | null>(null)
  const [statusFilterOpen, setStatusFilterOpen] = React.useState(false)
  const [datePreset, setDatePreset] = React.useState("last30")
  const [datePresetOpen, setDatePresetOpen] = React.useState(false)
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("default")

  const [view, setView] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  // ── Search debounce ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch represents once ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => { })
  }, [isAuthLoading, tokens])

  // ── Fetch records (reset on filter/refetch change) ────────────────────────
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
      .catch((err) => { if (!cancelled) toast.error((err as Error).message) })
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

  const SORT_CONFIG: Record<"default" | "asc" | "desc", { icon: typeof IconArrowsSort; label: string }> = {
    default: { icon: IconArrowsSort, label: "Newest First" },
    asc: { icon: IconSortAscending, label: "Sack kg ↑" },
    desc: { icon: IconSortDescending, label: "Sack kg ↓" },
  }
  const { icon: SortIcon, label: sortLabel } = SORT_CONFIG[sortOrder]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Sack Registration</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">Register and manage sacks for tobacco processing.</p>
        </div>
        <Button
          onClick={() => setRegisterOpen(true)}
          className="shrink-0 rounded-md h-9 px-4 text-xs font-bold uppercase tracking-wide gap-2 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-4" />
          New Registration
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3">
        {/* Mobile Filter Row: [Filter Button] [Search] */}
        <div className="flex md:hidden items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-full gap-1.5 text-xs font-normal border-border bg-background hover:bg-muted/30">
                <IconFilter className="size-3.5" />
                <span>Filter</span>
                {(statusFilter !== null || datePreset !== "last30" || sortOrder !== "default") && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#009640]" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-70 p-4" align="start">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <button
                    onClick={() => {
                      setStatusFilter(null);
                      setDatePreset("last30");
                      setSortOrder("default");
                    }}
                    className="text-[10px] text-[#009640] font-medium hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                {/* Status in Mobile Popover */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setStatusFilter(opt.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-colors",
                          statusFilter === opt.value
                            ? "bg-[#009640] text-white border-[#009640]"
                            : "bg-muted/30 text-muted-foreground border-border hover:border-muted-foreground/30"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date in Mobile Popover */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Time Range</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setDatePreset(p.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs border text-left transition-colors",
                          datePreset === p.value
                            ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                            : "bg-muted/30 text-muted-foreground border-border"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort in Mobile Popover */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sort Order</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(SORT_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setSortOrder(key as SortOrder)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                          sortOrder === key
                            ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                            : "bg-muted/30 text-muted-foreground border-border"
                        )}
                      >
                        <cfg.icon className="size-3.5" />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search for Mobile */}
          <div className="relative flex-1 flex items-center h-9 rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
            <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
            )}
          </div>
        </div>

        {/* Desktop Filter Bar (md and up) */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          {/* Status dropdown */}
          <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
                statusFilter === null
                  ? "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  : cn(STATUS_MAP[statusFilter]?.className, "border-transparent font-medium")
              )}>
                {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All"}
                <IconChevronDown className={cn("size-3.5 transition-transform duration-200", statusFilterOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1" align="start">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false) }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                    statusFilter === opt.value && "font-medium bg-accent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Date preset */}
          <Popover open={datePresetOpen} onOpenChange={setDatePresetOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
                datePreset === "last30" ? "text-muted-foreground hover:text-foreground hover:bg-muted/30" : "font-medium text-foreground bg-muted/50"
              )}>
                <IconCalendar className="size-3.5" />
                {DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? "Last 30 Days"}
                <IconChevronDown className={cn("size-3.5 transition-transform duration-200", datePresetOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="start">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setDatePreset(p.value); setDatePresetOpen(false) }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                    datePreset === p.value && "font-medium bg-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <button
            onClick={cycleSortOrder}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
              sortOrder === "default" ? "text-muted-foreground hover:text-foreground hover:bg-muted/30" : "font-medium text-foreground bg-muted/50"
            )}
          >
            <SortIcon className="size-3.5" />
            {sortLabel}
          </button>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex items-center h-9 min-w-40 max-w-xs rounded-md border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
            <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
            <input
              className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-full border border-border p-0.5 gap-0.5">
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "list" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <IconLayoutList className="size-3.5" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "grid" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <IconLayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
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

      {/* List View */}
      {!isLoading && records.length > 0 && view === "list" && (
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/50 border-slate-100">
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider w-10">No.</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Represent</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Farmer</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Sack (kg)</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Registered By</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-400 text-[10px] uppercase tracking-wider">Registered At</th>
                      <th className="px-4 py-3 w-10 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => {
                      const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
                      return (
                        <tr key={rec.id} className="group/row border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-slate-900 font-medium">{rec.represent_name}</td>
                          <td className="px-4 py-3 text-slate-700">{rec.member_farmer_name}</td>
                          <td className="px-4 py-3 text-slate-900 font-bold tabular-nums">{rec.sack_in_kg}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border", status.className)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-medium">{rec.dl_user_name}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(rec.registered_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
                              <button
                                onClick={() => setViewTarget(rec)}
                                className="p-1 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                <IconEye className="size-4" stroke={1.5} />
                              </button>
                              <button
                                onClick={() => setEditTarget(rec)}
                                className="p-1 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                <IconPencil className="size-4" stroke={1.5} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                                className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
        </div>
      )}

      {/* Grid View (Shown if view is 'grid' OR on mobile/tablet when view is 'list') */}
      {!isLoading && records.length > 0 && (
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4",
          view === "list" && "md:hidden"
        )}>
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

      {/* Infinite scroll sentinel */}
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

// ── Enhanced Grid Card Component ──────────────────────────────────────────

const SackRegistrationCard = React.memo(({
  rec, index, onView, onEdit, onDelete
}: {
  rec: SackRegistrationItem,
  index: number,
  onView: (rec: SackRegistrationItem) => void,
  onEdit: (rec: SackRegistrationItem) => void,
  onDelete: (rec: SackRegistrationItem) => void
}) => {
  const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:ring-1 hover:ring-emerald-500/20">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-5 rounded bg-[#009640] text-white text-[10px] font-bold shadow-xs">
            {index + 1}
          </div>
          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            ID: {rec.id.toString().padStart(5, '0')}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button onClick={() => onView(rec)} className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all">
            <IconEye className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={() => onEdit(rec)} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
            <IconPencil className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={() => onDelete(rec)} className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all">
            <IconTrash className="size-3.5" stroke={1.5} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Main Participant */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <IconUser className="size-3" stroke={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Member Farmer</span>
          </div>
          <p className="text-[14px] font-bold text-slate-900 leading-tight line-clamp-1 pl-4.5">
            {rec.member_farmer_name}
          </p>
        </div>

        {/* Support Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <IconUsers className="size-3" stroke={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Represent Group</span>
          </div>
          <p className="text-[12px] font-medium text-slate-600 line-clamp-1 pl-4.5">
            {rec.represent_name}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-md bg-slate-50 border border-slate-100 mt-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Sack weight</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <IconWeight className="size-3" stroke={2} />
              <span className="text-[13px] tabular-nums">{rec.sack_in_kg} kg</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-right items-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Status</span>
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black border uppercase tracking-wider",
              status.className
            )}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 mt-auto flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <IconClock className="size-3 text-slate-300" stroke={1.5} />
          <span className="text-[10px] font-medium text-slate-500 tabular-nums">
            {new Date(rec.registered_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">
            {rec.dl_user_name}
          </span>
        </div>
      </div>

      {/* Click Overlay */}
      <button
        onClick={() => onView(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
        aria-label={`View ${rec.member_farmer_name}`}
      />
    </div>
  )
})

SackRegistrationCard.displayName = "SackRegistrationCard"
