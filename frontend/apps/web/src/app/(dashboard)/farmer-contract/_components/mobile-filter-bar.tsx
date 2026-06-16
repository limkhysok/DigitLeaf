"use client"

import * as React from "react"
import {
  IconFilter, IconSortAscending, IconSortDescending, IconChevronDown, IconCirclePlusFilled, IconX
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"

interface MobileFilterBarProps {
  className?: string
  searchInput: string
  setSearchInput: (v: string) => void
  sortBy: "sapling" | "yield" | "purchased" | null
  setSortBy: (v: "sapling" | "yield" | "purchased" | null) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  selectedYear: number
  setSelectedYear: (v: number) => void
  onAddClick: () => void
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027]

export function MobileFilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
  onAddClick,
}: Readonly<MobileFilterBarProps>) {
  const { t } = useLanguage()
  const [yearOpen, setYearOpen] = React.useState(false)
  const hasActiveFilters = sortBy !== null

  return (
    <div className={cn("flex w-full items-center justify-between gap-2", className)}>

      {/* Left group: Filter popup + Reset */}
      <div className="flex items-center gap-2 shrink-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 rounded-sm relative"
            >
              <IconFilter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-[#009640]" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold">{t.sackRegistration.filters.filterTitle}</h3>
                <button
                  onClick={() => setSortBy(null)}
                  className="text-[10px] text-[#009640] font-medium hover:underline"
                >
                  {t.farmerContract.resetSort}
                </button>
              </div>

              {/* Year select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.farmerContract.year}</span>
                <Popover open={yearOpen} onOpenChange={setYearOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex h-8 w-full items-center justify-between rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      {selectedYear}
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
              </div>

              {/* Sort by Sapling */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.farmerContract.saplingKg}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setSortBy("sapling"); setSortOrder("asc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "sapling" && sortOrder === "asc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortAscending className="size-3.5" /> {t.sackRegistration.filters.smallest}
                  </button>
                  <button
                    onClick={() => { setSortBy("sapling"); setSortOrder("desc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "sapling" && sortOrder === "desc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortDescending className="size-3.5" /> {t.sackRegistration.filters.largest}
                  </button>
                </div>
              </div>

              {/* Sort by Yield */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.farmerContract.expectedYieldKg}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setSortBy("yield"); setSortOrder("asc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "yield" && sortOrder === "asc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortAscending className="size-3.5" /> {t.sackRegistration.filters.smallest}
                  </button>
                  <button
                    onClick={() => { setSortBy("yield"); setSortOrder("desc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "yield" && sortOrder === "desc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortDescending className="size-3.5" /> {t.sackRegistration.filters.largest}
                  </button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => setSortBy(null)}
            className="h-8 px-2 rounded-sm shrink-0"
          >
            {t.farmerContract.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex">
        <Input
          placeholder={t.farmerContract.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-sm! h-8 w-full text-xs placeholder:text-sm"
        />
      </div>

      {/* Right: Add */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onAddClick} className="h-8 px-2 flex gap-1.5 rounded-sm">
          <IconCirclePlusFilled className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>
    </div>
  )
}
