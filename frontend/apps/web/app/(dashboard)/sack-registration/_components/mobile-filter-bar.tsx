"use client"

import * as React from "react"
import { IconFilter, IconPlus, IconSearch } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { SackStatusCounts } from "@/lib/api-client"
import { DATE_PRESETS, STATUS_FILTER_OPTIONS } from "./constants"

function statusCount(counts: SackStatusCounts, value: number | null): number {
  if (value === null) return counts.all
  if (value === 0) return counts.pending
  if (value === 1) return counts.approved
  return counts.rejected
}

interface MobileFilterBarProps {
  statusFilter: number | null
  setStatusFilter: (v: number | null) => void
  datePreset: string
  setDatePreset: (v: string) => void
  searchInput: string
  setSearchInput: (v: string) => void
  hasActiveFilters: boolean
  statusCounts: SackStatusCounts | null
  onRegister: () => void
}

export function MobileFilterBar({
  statusFilter, setStatusFilter,
  datePreset, setDatePreset,
  searchInput, setSearchInput,
  hasActiveFilters,
  statusCounts,
  onRegister,
}: Readonly<MobileFilterBarProps>) {
  return (
    <div className="flex md:hidden items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 rounded-full border-border bg-background hover:bg-muted/30 relative"
          >
            <IconFilter className="size-3.5" />
            {hasActiveFilters && <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-[#009640]" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-70 p-4" align="start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Filters</h3>
              <button
                onClick={() => { setStatusFilter(null); setDatePreset("last30") }}
                className="text-[10px] text-[#009640] font-medium hover:underline"
              >
                Reset All
              </button>
            </div>
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
                    {statusCounts && (
                      <span className="ml-1 opacity-70">
                        ({statusCount(statusCounts, opt.value)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
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
          </div>
        </PopoverContent>
      </Popover>

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

      <Button
        onClick={onRegister}
        className="shrink-0 sm:hidden rounded-full h-9 w-9 p-0 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
      >
        <IconPlus className="size-4" />
      </Button>
    </div>
  )
}
