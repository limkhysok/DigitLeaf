"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  RepresentItem,
  SackRegistrationItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconArrowsSort, IconChevronDown, IconCalendar, IconEye, IconLayoutGrid, IconLayoutList, IconLoader2, IconMoneybag, IconPencil, IconPlus, IconSearch, IconSortAscending, IconSortDescending, IconTrash, IconFilter } from "@tabler/icons-react"
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
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Sack Registration</h1>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">Register and manage sacks.</p>
        </div>
        <Button
          onClick={() => setRegisterOpen(true)}
          className="shrink-0 rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          <span className="hidden sm:inline">New</span>
          <span className="sm:hidden">New</span>
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
            <PopoverContent className="w-[280px] p-4" align="start">
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
          <div className="relative flex items-center h-9 min-w-40 max-w-xs rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
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
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">No.</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Represent</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack (kg)</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered By</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered At</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, idx) => {
                      const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
                      return (
                        <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                          <td className="px-4 py-3">{rec.represent_name}</td>
                          <td className="px-4 py-3">{rec.member_farmer_name}</td>
                          <td className="px-4 py-3">{rec.sack_in_kg}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{rec.dl_user_name}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(rec.registered_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewTarget(rec)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <IconEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditTarget(rec)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <IconPencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                                className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                              >
                                <IconTrash className="h-4 w-4" />
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
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3",
          view === "list" && "md:hidden"
        )}>
          {records.map((rec, idx) => {
            const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
            return (
              <div
                key={rec.id}
                className="group relative flex flex-col gap-2 rounded-sm border border-border bg-card px-3 py-2.5 transition-all duration-200 hover:shadow-sm hover:border-border/80 mb-2"
              >
                {/* Top row: index + status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground/60">No. {idx + 1}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {/* Farmer + Represent */}
                <div className="flex flex-col min-w-0 -mt-0.5">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-[13px] text-muted-foreground shrink-0">Farmer:</span>
                    <span className="text-sm font-semibold truncate leading-tight">{rec.member_farmer_name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-[13px] text-muted-foreground shrink-0">Representative:</span>
                    <span className="text-[13px] text-muted-foreground truncate">{rec.represent_name}</span>
                  </div>
                </div>

                {/* Footer: kg · date */}
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <IconMoneybag className="h-3 w-3 text-muted-foreground" />
                      {rec.sack_in_kg} kg
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <IconCalendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(rec.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Overlay — last in DOM so it's above non-positioned content, below z-[1] action buttons */}
                <button
                  onClick={() => setViewTarget(rec)}
                  className="absolute inset-0 rounded-sm cursor-pointer focus:outline-none"
                  aria-label={`View detail for ${rec.member_farmer_name}`}
                />
              </div>
            )
          })}
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
