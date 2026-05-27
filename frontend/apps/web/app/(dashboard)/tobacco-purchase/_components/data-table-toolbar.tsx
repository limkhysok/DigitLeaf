"use client"

import { Table } from "@tanstack/react-table"
import { IconCalendar, IconX, IconCirclePlus, IconCheck } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DataTableViewOptions } from "@workspace/ui/components/data-table-view-options"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"

import type { PurchaserItem } from "@/lib/api-client"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  action?: React.ReactNode

  purchasers: PurchaserItem[]
  buyerFilter: number | null
  setBuyerFilter: (v: number | null) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  searchInput: string
  setSearchInput: (v: string) => void
}

export function DataTableToolbar<TData>({
  table,
  action,

  purchasers,
  buyerFilter,
  setBuyerFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchInput,
  setSearchInput,
}: Readonly<DataTableToolbarProps<TData>>) {
  const isFiltered = buyerFilter !== null || dateFrom !== "" || dateTo !== "" || searchInput !== ""

  const clearAll = () => {
    setBuyerFilter(null)
    setDateFrom("")
    setDateTo("")
    setSearchInput("")
  }

  const clearDates = () => {
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      {/* Left Group */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center">
          <DataTableViewOptions
            table={table}
            title="View"
            label="Toggle columns"
            columnLabels={{
              no: "No.",
              invoice_num: "Invoice No",
              buyer: "Buyer",
              vendor: "Vendor",
              purchase_date: "Purchase Date",
              tobacco_item_count: "Item Count",
              net_weight: "Total Weight",
              grand_total: "Grand Total",
              actions: "Actions",
            }}
          />
        </div>

        {/* Buyer Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              Buyer
              {buyerFilter !== null && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal lg:hidden"
                  >
                    1
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {purchasers.find(p => p.p_id === buyerFilter)?.p_name}
                    </Badge>
                  </div>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No buyers found.</CommandEmpty>
                <CommandGroup>
                  {purchasers.map((p) => {
                    const isSelected = buyerFilter === p.p_id
                    return (
                      <CommandItem
                        key={p.p_id}
                        onSelect={() => {
                          if (isSelected) {
                            setBuyerFilter(null)
                          } else {
                            setBuyerFilter(p.p_id)
                          }
                        }}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <IconCheck className={cn("h-4 w-4")} />
                        </div>
                        <span>{p.p_name}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {buyerFilter !== null && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setBuyerFilter(null)}
                        className="justify-center text-center"
                      >
                        Clear filter
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-md border border-dashed text-xs font-medium transition-all",
              (dateFrom || dateTo)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}>
              <IconCalendar className="size-3.5" />
              Date Range
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
            <div className="flex flex-col gap-2">
              <div>
                <label htmlFor="filter-date-from" className="text-[11px] text-muted-foreground mb-1 block">From</label>
                <input
                  id="filter-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <div>
                <label htmlFor="filter-date-to" className="text-[11px] text-muted-foreground mb-1 block">To</label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDates}
                  className="text-[11px] text-rose-500 hover:text-rose-700 text-left transition-colors"
                >Clear dates</button>
              )}
            </div>
          </PopoverContent>
        </Popover>



        {isFiltered && (
          <Button
            variant="ghost"
            onClick={clearAll}
            className="h-8 px-2 lg:px-3 shrink-0"
          >
            Reset
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Center Group (Search) */}
      <div className="flex-1 flex justify-center lg:justify-end">
        <Input
          placeholder="Search records..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="rounded-md h-8 w-full lg:max-w-none lg:w-[250px] text-xs md:text-sm placeholder:text-sm"
        />
      </div>

      {/* Right Group (Create Button) */}
      <div className="flex items-center gap-2 shrink-0">
        {action}
      </div>
    </div>
  )
}
