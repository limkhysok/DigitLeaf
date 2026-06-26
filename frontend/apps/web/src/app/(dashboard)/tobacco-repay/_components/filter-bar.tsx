"use client"

import * as React from "react"
import type { VisibilityState } from "@tanstack/react-table"
import {
  IconCirclePlus, IconX, IconAdjustmentsHorizontal, IconPlus,
} from "@tabler/icons-react"
import { useLanguage } from "@/hooks/use-language"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

interface FilterBarProps {
  className?: string
  searchInput: string
  setSearchInput: (v: string) => void
  sortBy: "Quantity" | "total_repaid" | null
  setSortBy: (v: "Quantity" | "total_repaid" | null) => void
  selectedYear: string
  setSelectedYear: (v: string) => void
  availableYears: string[]
  columnVisibility: VisibilityState
  setColumnVisibility: (v: VisibilityState) => void
  onAdd: () => void
}

export function FilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  selectedYear, setSelectedYear,
  availableYears,
  columnVisibility, setColumnVisibility,
  onAdd,
}: Readonly<FilterBarProps>) {
  const { t } = useLanguage()
  const [yearOpen, setYearOpen] = React.useState(false)

  const isFiltered = sortBy !== null || searchInput !== ""

  const clearAll = () => {
    setSortBy(null)
    setSearchInput("")
  }

  return (
    <div className={cn("flex w-full flex-wrap items-center justify-between gap-2", className)}>

      {/* ── Left group ── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">

        {/* View (column visibility) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8">
              <IconAdjustmentsHorizontal className="mr-2 h-4 w-4" />
              {t.tobaccoRepay.toolbar.view}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t.tobaccoRepay.toolbar.toggleColumns}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={columnVisibility.contractNo}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, contractNo: v })}
            >
              {t.tobaccoRepay.toolbar.columns.contractNo}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.representative}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, representative: v })}
            >
              {t.tobaccoRepay.toolbar.columns.representative}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.contractor}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, contractor: v })}
            >
              {t.tobaccoRepay.toolbar.columns.farmer}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.tobaccoType}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, tobaccoType: v })}
            >
              {t.tobaccoRepay.toolbar.columns.tobaccoType}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.year}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, year: v })}
            >
              {t.tobaccoRepay.toolbar.columns.year}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.qty}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, qty: v })}
            >
              {t.tobaccoRepay.toolbar.columns.qty}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.totalReturned}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, totalReturned: v })}
            >
              {t.tobaccoRepay.toolbar.columns.totalReturned}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.status}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, status: v })}
            >
              {t.tobaccoRepay.toolbar.columns.status}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Year filter */}
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {t.tobaccoRepay.toolbar.year}
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedYear}
              </Badge>
            </Button>
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

        {/* Reset */}
        {isFiltered && (
          <Button variant="ghost" onClick={clearAll} className="h-8 px-2 lg:px-3 shrink-0">
            {t.tobaccoRepay.toolbar.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Right group ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <Input
          placeholder={t.tobaccoRepay.toolbar.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md h-8 w-64 text-xs placeholder:text-sm"
        />

        {/* Add button */}
        <Button
          size="sm"
          className="h-8 bg-[#009640] hover:bg-[#007a33] text-white"
          onClick={onAdd}
        >
          <IconPlus className="mr-1.5 h-3.5 w-3.5" />
          {t.tobaccoRepay.toolbar.add}
        </Button>

      </div>
    </div>
  )
}
