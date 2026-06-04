"use client"

import * as React from "react"
import {
  IconFilter, IconSearch, IconSortAscending, IconSortDescending, IconChevronDown
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

interface MobileFilterBarProps {
  className?: string
  searchInput: string
  setSearchInput: (v: string) => void
  sortBy: "Quantity" | "total_repaid" | null
  setSortBy: (v: "Quantity" | "total_repaid" | null) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  selectedYear: string
  setSelectedYear: (v: string) => void
  availableYears: string[]
}

export function MobileFilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
  availableYears,
}: Readonly<MobileFilterBarProps>) {
  const [yearOpen, setYearOpen] = React.useState(false)
  const hasActiveFilters = sortBy !== null

  return (
    <div className={cn("flex items-center gap-2", className)}>

      {/* Filter popup */}
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
        <PopoverContent className="w-72 p-4" align="start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Filters</h3>
              <button
                onClick={() => setSortBy(null)}
                className="text-[10px] text-[#009640] font-medium hover:underline"
              >
                Reset Sort
              </button>
            </div>

            {/* Year select */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Year</span>
              <Popover open={yearOpen} onOpenChange={setYearOpen}>
                <PopoverTrigger asChild>
                  <button className="flex h-8 w-full items-center justify-between rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                    {selectedYear}
                    <IconChevronDown className={cn("size-3.5 transition-transform duration-200", yearOpen && "rotate-180")} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-28 p-1" align="start">
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => { setSelectedYear(yr); setYearOpen(false) }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                        selectedYear === yr && "font-medium bg-accent"
                      )}
                    >
                      {yr}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort by Qty */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Qty</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => { setSortBy("Quantity"); setSortOrder("asc") }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                    sortBy === "Quantity" && sortOrder === "asc"
                      ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                      : "bg-muted/30 text-muted-foreground border-border"
                  )}
                >
                  <IconSortAscending className="size-3.5" /> Smallest
                </button>
                <button
                  onClick={() => { setSortBy("Quantity"); setSortOrder("desc") }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                    sortBy === "Quantity" && sortOrder === "desc"
                      ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                      : "bg-muted/30 text-muted-foreground border-border"
                  )}
                >
                  <IconSortDescending className="size-3.5" /> Largest
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search */}
      <div className="relative flex-1 flex items-center h-9 rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
        <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          placeholder="Search Contract No, Contractor..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
        )}
      </div>
    </div>
  )
}
