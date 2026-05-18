"use client"

import * as React from "react"
import {
  IconCalendar, IconChevronDown,
  IconLayoutGrid, IconLayoutList, IconPlus, IconSearch,
  IconSortAscending, IconSortDescending, IconArrowsSort
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { SackStatusCounts } from "@/lib/api-client"
import { STATUS_MAP } from "./constants"
import { useLanguage } from "@/hooks/use-language"

function statusCount(counts: SackStatusCounts, value: number | null): number {
  if (value === null) return counts.all
  if (value === 0) return counts.pending
  if (value === 1) return counts.approved
  return counts.rejected
}

interface FilterBarProps {
  className?: string
  searchClassName?: string
  statusFilter: number | null
  setStatusFilter: (v: number | null) => void
  datePreset: string
  setDatePreset: (v: string) => void
  searchInput: string
  setSearchInput: (v: string) => void
  view: "list" | "grid"
  setView: (v: "list" | "grid") => void
  statusCounts: SackStatusCounts | null
  onRegister: () => void
  sortSackInKg: "asc" | "desc" | null
  setSortSackInKg: (v: "asc" | "desc" | null) => void
}

export function FilterBar({
  className,
  searchClassName,
  statusFilter, setStatusFilter,
  datePreset, setDatePreset,
  searchInput, setSearchInput,
  view, setView,
  statusCounts,
  onRegister,
  sortSackInKg, setSortSackInKg,
}: Readonly<FilterBarProps>) {
  const { t } = useLanguage()
  const [statusFilterOpen, setStatusFilterOpen] = React.useState(false)
  const [datePresetOpen, setDatePresetOpen] = React.useState(false)

  const statusFilterOptions = React.useMemo(() => [
    { label: t.sackRegistration.filters.statusAll, value: null },
    { label: t.sackRegistration.filters.statusPending, value: 0 },
    { label: t.sackRegistration.filters.statusApproved, value: 1 },
    { label: t.sackRegistration.filters.statusRejected, value: 2 },
  ], [t])

  const datePresets = React.useMemo(() => [
    { label: t.sackRegistration.filters.today, value: "today" },
    { label: t.sackRegistration.filters.thisWeek, value: "week" },
    { label: t.sackRegistration.filters.last30Days, value: "last30" },
    { label: t.sackRegistration.filters.threeMonths, value: "3m" },
    { label: t.sackRegistration.filters.sixMonths, value: "6m" },
    { label: t.sackRegistration.filters.twelveMonths, value: "12m" },
    { label: t.sackRegistration.filters.allTime, value: "all" },
  ], [t])

  return (
    <div className={cn("flex-wrap items-center gap-2", className)}>
      <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
            statusFilter === null
              ? "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              : cn(STATUS_MAP[statusFilter]?.className, "border-transparent font-medium")
          )}>
            {statusFilterOptions.find((o) => o.value === statusFilter)?.label ?? t.sackRegistration.filters.statusAll}
            <IconChevronDown className={cn("size-3.5 transition-transform duration-200", statusFilterOpen && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {statusFilterOptions.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false) }}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                statusFilter === opt.value && "font-medium bg-accent"
              )}
            >
              <span>{opt.label}</span>
              {statusCounts && (
                <span className="text-muted-foreground tabular-nums">
                  {statusCount(statusCounts, opt.value)}
                </span>
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Popover open={datePresetOpen} onOpenChange={setDatePresetOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
            datePreset === "last30"
              ? "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
              : "border-[#009640]/30 bg-[#009640]/10 text-[#009640] font-medium"
          )}>
            <IconCalendar className="size-3.5" />
            {datePresets.find((p) => p.value === datePreset)?.label ?? t.sackRegistration.filters.last30Days}
            <IconChevronDown className={cn("size-3.5 transition-transform duration-200", datePresetOpen && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {datePresets.map((p) => (
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

      <button
        onClick={() => {
          if (sortSackInKg === "asc") setSortSackInKg("desc");
          else if (sortSackInKg === "desc") setSortSackInKg(null);
          else setSortSackInKg("asc");
        }}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
          sortSackInKg === null
            ? "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
            : "border-[#009640]/30 bg-[#009640]/10 text-[#009640] font-medium"
        )}
      >
        <div className="flex items-center gap-1">
          {t.sackRegistration.filters.sackWeight}
          {sortSackInKg === "asc" && <IconSortAscending className="size-3.5" />}
          {sortSackInKg === "desc" && <IconSortDescending className="size-3.5" />}
          {!sortSackInKg && <IconArrowsSort className="size-3.5 opacity-50" />}
        </div>
      </button>

      {(statusFilter !== null || datePreset !== "last30" || sortSackInKg !== null) && (
        <button
          onClick={() => { setStatusFilter(null); setDatePreset("last30"); setSortSackInKg(null); }}
          className="text-xs text-muted-foreground hover:text-[#009640] font-medium transition-colors ml-1"
        >
          {t.sackRegistration.filters.resetAll}
        </button>
      )}

      <div className="flex-1" />

      <div className="hidden lg:flex items-center rounded-full border border-border p-0.5 gap-0.5">
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

      <div className={cn("relative flex items-center h-9 rounded-full border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all", searchClassName)}>
        <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
        <input
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400 placeholder:text-[12px]"
          placeholder={t.sackRegistration.filters.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
        )}
      </div>

      <Button
        onClick={onRegister}
        className="shrink-0 rounded-full h-9 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
      >
        <IconPlus className="size-3.5" />
        {t.sackRegistration.filters.add}
      </Button>
    </div>
  )
}
