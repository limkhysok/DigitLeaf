"use client"

import * as React from "react"
import { IconFilter, IconPlus, IconSearch, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import type { PurchaserItem, RegionItem, OvenItem } from "@/lib/api-client"

function buildDateLabel(dateFrom: string, dateTo: string): string {
  if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`
  if (dateFrom) return `From ${dateFrom}`
  return `To ${dateTo}`
}

interface MobileFilterBarProps {
  searchInput: string
  setSearchInput: (v: string) => void
  onAdd: () => void
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  ovens: OvenItem[]
  buyerFilter: number | null
  setBuyerFilter: (v: number | null) => void
  regionFilter: number | null
  setRegionFilter: (v: number | null) => void
  ovenFilter: number | null
  setOvenFilter: (v: number | null) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
}

export function MobileFilterBar({
  searchInput, setSearchInput, onAdd,
  purchasers, regions, ovens,
  buyerFilter, setBuyerFilter,
  regionFilter, setRegionFilter,
  ovenFilter, setOvenFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
}: Readonly<MobileFilterBarProps>) {
  const [filterOpen, setFilterOpen] = React.useState(false)

  const activeCount = [
    buyerFilter !== null,
    regionFilter !== null,
    ovenFilter !== null,
    !!(dateFrom || dateTo),
  ].filter(Boolean).length

  const clearAll = () => {
    setBuyerFilter(null)
    setRegionFilter(null)
    setOvenFilter(null)
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="flex md:hidden flex-col gap-2">
      {/* Search + action row */}
      <div className="flex items-center gap-2">
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

        {/* Filter button */}
        <button
          onClick={() => setFilterOpen(true)}
          className={cn(
            "relative flex items-center justify-center h-9 w-9 rounded-full border transition-all",
            activeCount > 0
              ? "border-[#009640] bg-[#009640]/10 text-[#009640]"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <IconFilter className="size-4" stroke={1.5} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#009640] text-white text-[9px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        <Button
          onClick={onAdd}
          className="shrink-0 sm:hidden rounded-full h-9 w-9 p-0 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-4" />
        </Button>
        <Button
          onClick={onAdd}
          className="shrink-0 hidden sm:flex rounded-full h-9 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
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
          {regionFilter !== null && (
            <Chip label={regions.find(r => r.reg_id === regionFilter)?.reg_name ?? "Region"} onRemove={() => setRegionFilter(null)} />
          )}
          {ovenFilter !== null && (
            <Chip label={ovens.find(o => o.id === ovenFilter)?.name_en ?? "Oven"} onRemove={() => setOvenFilter(null)} />
          )}
          {(dateFrom || dateTo) && (
            <Chip
              label={buildDateLabel(dateFrom, dateTo)}
              onRemove={() => { setDateFrom(""); setDateTo("") }}
            />
          )}
        </div>
      )}

      {/* Filter dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-semibold">Filters</DialogTitle>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs text-rose-500 hover:text-rose-700 underline underline-offset-2 transition-colors">
                  Clear all
                </button>
              )}
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-5 pb-2">
            {/* Date Range */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="mob-date-from" className="text-[11px] text-muted-foreground mb-1 block">From</label>
                  <input
                    id="mob-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-[#009640] focus:border-[#009640] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="mob-date-to" className="text-[11px] text-muted-foreground mb-1 block">To</label>
                  <input
                    id="mob-date-to"
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-[#009640] focus:border-[#009640] transition-all"
                  />
                </div>
              </div>
            </div>

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

            {/* Region */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Region</p>
              <div className="flex flex-wrap gap-1.5">
                <PillButton active={regionFilter === null} onClick={() => setRegionFilter(null)}>All</PillButton>
                {regions.map(r => (
                  <PillButton key={r.reg_id} active={regionFilter === r.reg_id} onClick={() => setRegionFilter(r.reg_id)}>{r.reg_name}</PillButton>
                ))}
              </div>
            </div>

            {/* Oven */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Oven</p>
              <div className="flex flex-wrap gap-1.5">
                <PillButton active={ovenFilter === null} onClick={() => setOvenFilter(null)}>All</PillButton>
                {ovens.map(o => (
                  <PillButton key={o.id} active={ovenFilter === o.id} onClick={() => setOvenFilter(o.id)}>{o.name_en}</PillButton>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
