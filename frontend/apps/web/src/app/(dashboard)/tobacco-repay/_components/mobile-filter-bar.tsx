"use client"

import * as React from "react"
import {
  IconFilter, IconSortAscending, IconSortDescending, IconChevronDown, IconCirclePlusFilled, IconX
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { useLanguage } from "@/hooks/use-language"
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
  onAdd: () => void
}

export function MobileFilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
  availableYears,
  onAdd,
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
                <h3 className="text-sm font-semibold">{t.tobaccoRepay.mobileFilter.filters}</h3>
                <button
                  onClick={() => setSortBy(null)}
                  className="text-[10px] text-[#009640] font-medium hover:underline"
                >
                  {t.tobaccoRepay.mobileFilter.resetSort}
                </button>
              </div>

              {/* Year select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.tobaccoRepay.mobileFilter.year}</span>
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

              {/* Sort by Amount (kg) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.tobaccoRepay.mobileFilter.amountKg}</span>
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
                    <IconSortAscending className="size-3.5" /> {t.tobaccoRepay.mobileFilter.smallest}
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
                    <IconSortDescending className="size-3.5" /> {t.tobaccoRepay.mobileFilter.largest}
                  </button>
                </div>
              </div>

              {/* Sort by Delivery (kg) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t.tobaccoRepay.mobileFilter.deliveryKg}</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { setSortBy("total_repaid"); setSortOrder("asc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "total_repaid" && sortOrder === "asc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortAscending className="size-3.5" /> {t.tobaccoRepay.mobileFilter.smallest}
                  </button>
                  <button
                    onClick={() => { setSortBy("total_repaid"); setSortOrder("desc") }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border transition-colors",
                      sortBy === "total_repaid" && sortOrder === "desc"
                        ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20 font-medium"
                        : "bg-muted/30 text-muted-foreground border-border"
                    )}
                  >
                    <IconSortDescending className="size-3.5" /> {t.tobaccoRepay.mobileFilter.largest}
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
            {t.tobaccoRepay.mobileFilter.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex">
        <Input
          placeholder={t.tobaccoRepay.mobileFilter.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-sm! h-8 w-full text-xs placeholder:text-sm"
        />
      </div>

      {/* Right: Add */}
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={onAdd} className="h-8 px-2 flex gap-1.5 rounded-sm">
          <IconCirclePlusFilled className="h-4 w-4" />
          <span className="hidden sm:inline">{t.tobaccoRepay.mobileFilter.add}</span>
        </Button>
      </div>
    </div>
  )
}
