"use client"

import * as React from "react"
import { IconFilter, IconPlus, IconSearch, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { PurchaserItem } from "@/services/api-client"


interface MobileFilterBarProps {
  searchInput: string
  setSearchInput: (v: string) => void
  onAdd: () => void
  purchasers: PurchaserItem[]
  buyerFilter: number | null
  setBuyerFilter: (v: number | null) => void
  className?: string
}

export function MobileFilterBar({
  searchInput, setSearchInput, onAdd,
  purchasers,
  buyerFilter, setBuyerFilter,
  className,
}: Readonly<MobileFilterBarProps>) {
  const activeCount = [
    buyerFilter !== null,
  ].filter(Boolean).length

  const clearAll = () => {
    setBuyerFilter(null)
  }

  return (
    <div className={cn("flex flex-col gap-2", className || "flex lg:hidden")}>
      {/* Search + action row */}
      <div className="flex items-center gap-2">
        {/* Filter button as Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              suppressHydrationWarning
              variant="outline"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 rounded-full border transition-all relative",
                activeCount > 0
                  ? "border-[#009640] bg-[#009640]/10 text-[#009640] hover:bg-[#009640]/20 hover:text-[#009640]"
                  : "border-border bg-background hover:bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              <IconFilter className="size-4" stroke={1.5} />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#009640] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold">Filters</h3>
                {activeCount > 0 && (
                  <button onClick={clearAll} className="text-xs text-rose-500 hover:text-rose-700 underline underline-offset-2 transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-5 pb-2">
                {/* Buyer */}
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Buyer</p>
                  <div className="flex flex-wrap gap-1.5">
                    <PillButton active={buyerFilter === null} onClick={() => setBuyerFilter(null)}>All</PillButton>
                    {purchasers.map(p => (
                      <PillButton key={p.p_id} active={buyerFilter === p.p_id} onClick={() => setBuyerFilter(p.p_id)}>{p.p_name}</PillButton>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search bar */}
        <div className="relative flex-1 flex items-center h-9 rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search invoice, vendor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
          )}
        </div>

        {/* Add button */}
        <Button
          onClick={onAdd}
          className="shrink-0 sm:hidden rounded-sm h-9 w-9 p-0 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-4" />
        </Button>
        <Button
          onClick={onAdd}
          className="shrink-0 hidden sm:flex rounded-sm h-9 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-3.5" />
          Add
        </Button>
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {buyerFilter !== null && (
            <Chip label={purchasers.find(p => p.p_id === buyerFilter)?.p_name ?? "Buyer"} onRemove={() => setBuyerFilter(null)} />
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: Readonly<{ label: string; onRemove: () => void }>) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#009640]/10 border border-[#009640]/30 text-[#009640] text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-[#007a34] transition-colors">
        <IconX className="size-3" />
      </button>
    </span>
  )
}

function PillButton({ active, onClick, children }: Readonly<{ active: boolean; onClick: () => void; children: React.ReactNode }>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
        active
          ? "border-[#009640] bg-[#009640] text-white"
          : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >{children}</button>
  )
}
