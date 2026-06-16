"use client"

import * as React from "react"
import {
  IconSortAscending, IconSortDescending,
  IconCirclePlus, IconX, IconAdjustmentsHorizontal, IconPlus,
} from "@tabler/icons-react"
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

export type ColumnVisibility = {
  contractNo: boolean
  contractor: boolean
  representative: boolean
  tobaccoType: boolean
  year: boolean
  qty: boolean
  totalReturned: boolean
}

interface FilterBarProps {
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
  columnVisibility: ColumnVisibility
  setColumnVisibility: (v: ColumnVisibility) => void
  onAdd: () => void
}

export function FilterBar({
  className,
  searchInput, setSearchInput,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  selectedYear, setSelectedYear,
  availableYears,
  columnVisibility, setColumnVisibility,
  onAdd,
}: Readonly<FilterBarProps>) {
  const [yearOpen, setYearOpen] = React.useState(false)
  const [qtyOpen, setQtyOpen] = React.useState(false)

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
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={columnVisibility.contractNo}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, contractNo: v })}
            >
              Contract No
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.contractor}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, contractor: v })}
            >
              Contractor
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.representative}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, representative: v })}
            >
              Representative
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.tobaccoType}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, tobaccoType: v })}
            >
              Tobacco Type
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.year}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, year: v })}
            >
              Year
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.qty}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, qty: v })}
            >
              Quantity
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columnVisibility.totalReturned}
              onCheckedChange={(v) => setColumnVisibility({ ...columnVisibility, totalReturned: v })}
            >
              Total Returned
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Year filter */}
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              Year
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

        {/* Sort by Qty */}
        <Popover open={qtyOpen} onOpenChange={setQtyOpen}>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              Quantity
              {sortBy === "Quantity" && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal flex items-center gap-1">
                    {sortOrder === "asc"
                      ? <IconSortAscending className="size-3" />
                      : <IconSortDescending className="size-3" />}
                    {sortOrder === "asc" ? "Asc" : "Desc"}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            <button
              onClick={() => { setSortBy("Quantity"); setSortOrder("desc"); setQtyOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "Quantity" && sortOrder === "desc" && "bg-accent font-medium")}
            >
              <IconSortDescending className="size-3.5" /> Largest first
            </button>
            <button
              onClick={() => { setSortBy("Quantity"); setSortOrder("asc"); setQtyOpen(false) }}
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent", sortBy === "Quantity" && sortOrder === "asc" && "bg-accent font-medium")}
            >
              <IconSortAscending className="size-3.5" /> Smallest first
            </button>
          </PopoverContent>
        </Popover>



        {/* Reset */}
        {isFiltered && (
          <Button variant="ghost" onClick={clearAll} className="h-8 px-2 lg:px-3 shrink-0">
            Reset
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Right group ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <Input
          placeholder="Search Contract No, Contractor..."
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
          Add
        </Button>

      </div>
    </div>
  )
}
