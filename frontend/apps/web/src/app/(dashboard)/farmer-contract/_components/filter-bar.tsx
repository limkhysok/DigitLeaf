"use client"

import * as React from "react"
import {
  IconSortAscending, IconSortDescending,
  IconCirclePlus, IconX, IconAdjustmentsHorizontal,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"
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

type ColumnVisibility = {
  code: boolean
  sapling: boolean
  expected: boolean
  purchased: boolean
  year: boolean
}

interface FilterBarProps {
  className?: string
  searchClassName?: string
  searchInput: string
  setSearchInput: (v: string) => void
  sortBy: "sapling" | "yield" | "purchased" | null
  setSortBy: (v: "sapling" | "yield" | "purchased" | null) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  selectedYear: number
  setSelectedYear: (v: number) => void
  columnVisibility: ColumnVisibility
  setColumnVisibility: (v: ColumnVisibility) => void
  onAddClick: () => void
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027]

export function FilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
  columnVisibility, setColumnVisibility,
  onAddClick,
}: Readonly<FilterBarProps>) {
  const { t } = useLanguage()
  const [yearOpen, setYearOpen] = React.useState(false)
  const [yieldOpen, setYieldOpen] = React.useState(false)
  const [purchasedOpen, setPurchasedOpen] = React.useState(false)

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
              {t.farmerContract.view}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t.farmerContract.toggleColumns}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={columnVisibility.code}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, code: v })}
            >
              {t.farmerContract.idCard}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.sapling}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, sapling: v })}
            >
              {t.farmerContract.saplingKg}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.expected}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, expected: v })}
            >
              {t.farmerContract.expectedYieldKg}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.purchased}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, purchased: v })}
            >
              {t.farmerContract.purchasedWeightKg}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.year}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, year: v })}
            >
              {t.farmerContract.year}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Year filter */}
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {t.farmerContract.year}
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedYear}
              </Badge>
            </Button>
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

        {/* Sort by Yield */}
        <Popover open={yieldOpen} onOpenChange={setYieldOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {t.farmerContract.expectedYield}
              {sortBy === "yield" && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal flex items-center gap-1">
                    {sortOrder === "asc"
                      ? <IconSortAscending className="size-3" />
                      : <IconSortDescending className="size-3" />}
                    {sortOrder === "asc" ? t.farmerContract.asc : t.farmerContract.desc}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            <button
              onClick={() => { setSortBy("yield"); setSortOrder("desc"); setYieldOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "yield" && sortOrder === "desc" && "bg-accent font-medium")}
            >
              <IconSortDescending className="size-3.5" /> {t.farmerContract.largestFirst}
            </button>
            <button
              onClick={() => { setSortBy("yield"); setSortOrder("asc"); setYieldOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "yield" && sortOrder === "asc" && "bg-accent font-medium")}
            >
              <IconSortAscending className="size-3.5" /> {t.farmerContract.smallestFirst}
            </button>
          </PopoverContent>
        </Popover>

        {/* Sort by Purchased Weight */}
        <Popover open={purchasedOpen} onOpenChange={setPurchasedOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {t.farmerContract.purchasedWeight}
              {sortBy === "purchased" && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal flex items-center gap-1">
                    {sortOrder === "asc" ? <IconSortAscending className="size-3" /> : <IconSortDescending className="size-3" />}
                    {sortOrder === "asc" ? t.farmerContract.asc : t.farmerContract.desc}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            <button
              onClick={() => { setSortBy("purchased"); setSortOrder("desc"); setPurchasedOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "purchased" && sortOrder === "desc" && "bg-accent font-medium")}
            >
              <IconSortDescending className="size-3.5" /> {t.farmerContract.largestFirst}
            </button>
            <button
              onClick={() => { setSortBy("purchased"); setSortOrder("asc"); setPurchasedOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "purchased" && sortOrder === "asc" && "bg-accent font-medium")}
            >
              <IconSortAscending className="size-3.5" /> {t.farmerContract.smallestFirst}
            </button>
          </PopoverContent>
        </Popover>

        {/* Reset */}
        {isFiltered && (
          <Button variant="ghost" onClick={clearAll} className="h-8 px-2 lg:px-3 shrink-0">
            {t.farmerContract.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Right group ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <Input
          placeholder={t.farmerContract.searchPlaceholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md h-8 w-62.5 text-xs placeholder:text-sm"
        />

        <Button onClick={onAddClick} size="sm" className="h-8 bg-[#009640] hover:bg-[#007a33] text-white">
          <IconCirclePlus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  )
}
