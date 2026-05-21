"use client"

import * as React from "react"
import {
  IconLayoutGrid, IconLayoutList, IconSearch,
  IconArrowsSort, IconSortAscending, IconSortDescending, IconChevronDown
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"

interface FilterBarProps {
  className?: string
  searchClassName?: string
  searchInput: string
  setSearchInput: (v: string) => void
  view: "list" | "grid"
  setView: (v: "list" | "grid") => void
  sortBy: "sapling" | "yield" | null
  setSortBy: (v: "sapling" | "yield" | null) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  selectedYear: number
  setSelectedYear: (v: number) => void
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027]

export function FilterBar({
  className,
  searchClassName,
  searchInput, setSearchInput,
  view, setView,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
}: Readonly<FilterBarProps>) {
  const { t } = useLanguage()
  const [yearOpen, setYearOpen] = React.useState(false)

  function cycleSortBy(field: "sapling" | "yield") {
    if (sortBy !== field) {
      setSortBy(field)
      setSortOrder("desc")
    } else if (sortOrder === "desc") {
      setSortOrder("asc")
    } else {
      setSortBy(null)
    }
  }

  const isActive = sortBy !== null

  return (
    <div className={cn("flex-wrap items-center gap-2", className)}>

      {/* Year picker */}
      <Popover open={yearOpen} onOpenChange={setYearOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            {t.farmerContrast.year} {selectedYear}
            <IconChevronDown className={cn("size-3.5 transition-transform duration-200", yearOpen && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-28 p-1" align="start">
          {YEAR_OPTIONS.map((yr) => (
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

      {/* Sapling sort */}
      <button
        onClick={() => cycleSortBy("sapling")}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
          sortBy === "sapling"
            ? "border-[#009640]/30 bg-[#009640]/10 text-[#009640] font-medium"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        {t.farmerContrast.saplingKg}
        {sortBy === "sapling" && sortOrder === "asc" && <IconSortAscending className="size-3.5" />}
        {sortBy === "sapling" && sortOrder === "desc" && <IconSortDescending className="size-3.5" />}
        {sortBy !== "sapling" && <IconArrowsSort className="size-3.5 opacity-50" />}
      </button>

      {/* Yield sort */}
      <button
        onClick={() => cycleSortBy("yield")}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
          sortBy === "yield"
            ? "border-[#009640]/30 bg-[#009640]/10 text-[#009640] font-medium"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}
      >
        {t.farmerContrast.expectedYieldKg}
        {sortBy === "yield" && sortOrder === "asc" && <IconSortAscending className="size-3.5" />}
        {sortBy === "yield" && sortOrder === "desc" && <IconSortDescending className="size-3.5" />}
        {sortBy !== "yield" && <IconArrowsSort className="size-3.5 opacity-50" />}
      </button>

      {/* Reset */}
      {isActive && (
        <button
          onClick={() => setSortBy(null)}
          className="text-xs text-muted-foreground hover:text-[#009640] font-medium transition-colors ml-1"
        >
          {t.farmerContrast.resetSort}
        </button>
      )}

      <div className="flex-1" />

      {/* View toggle */}
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

      {/* Search */}
      <div className={cn("relative flex items-center h-9 rounded-full border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all", searchClassName)}>
        <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
        <input
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400 placeholder:text-[12px]"
          placeholder={t.farmerContrast.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
        )}
      </div>
    </div>
  )
}
