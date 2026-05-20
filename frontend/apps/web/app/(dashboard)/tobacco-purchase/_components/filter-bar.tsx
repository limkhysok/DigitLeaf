"use client"

import * as React from "react"
import {
  IconCalendar, IconChevronDown, IconLayoutGrid, IconLayoutList,
  IconPlus, IconSearch, IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { PurchaserItem } from "@/lib/api-client"

// ── Reusable filter dropdown ───────────────────────────────────────────────────
interface FilterDropdownOption { id: number; label: string }
interface FilterDropdownProps {
  label: string
  active: boolean
  width: string
  allLabel: string
  options: FilterDropdownOption[]
  selected: number | null
  onSelect: (v: number | null) => void
}

function FilterDropdown({
  label, active, width, allLabel, options, selected, onSelect,
}: Readonly<FilterDropdownProps>) {
  const activeClass = "border-[#009640] bg-[#009640]/10 text-[#009640]"
  const inactiveClass = "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
  const itemBase = "w-full text-left px-3 py-1.5 rounded text-xs hover:bg-muted transition-colors"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-medium transition-all",
          active ? activeClass : inactiveClass
        )}>
          {label}
          <IconChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(width, "p-1")} align="start">
        <button
          onClick={() => onSelect(null)}
          className={cn(itemBase, selected === null && "font-semibold text-[#009640]")}
        >{allLabel}</button>
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={cn(itemBase, selected === opt.id && "font-semibold text-[#009640]")}
          >{opt.label}</button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

// ── Build date chip label without nested ternary ───────────────────────────────
function buildDateLabel(dateFrom: string, dateTo: string): string {
  if (dateFrom && dateTo) return `${dateFrom} → ${dateTo}`
  if (dateFrom) return `From ${dateFrom}`
  return `To ${dateTo}`
}

// ── Build active chips list outside component (reduces cognitive complexity) ────
interface ChipItem { label: string; onRemove: () => void }

interface BuildChipsOptions {
  purchasers: PurchaserItem[]; buyerFilter: number | null; setBuyerFilter: (v: number | null) => void
  dateFrom: string; dateTo: string; setDateFrom: (v: string) => void; setDateTo: (v: string) => void
}

function buildActiveChips(opts: BuildChipsOptions): ChipItem[] {
  const { purchasers, buyerFilter, setBuyerFilter, dateFrom, dateTo, setDateFrom, setDateTo } = opts
  const chips: ChipItem[] = []
  if (buyerFilter !== null) {
    chips.push({ label: purchasers.find(p => p.p_id === buyerFilter)?.p_name ?? "Buyer", onRemove: () => setBuyerFilter(null) })
  }
  if (dateFrom || dateTo) {
    chips.push({ label: buildDateLabel(dateFrom, dateTo), onRemove: () => { setDateFrom(""); setDateTo("") } })
  }
  return chips
}

// ── Main component ─────────────────────────────────────────────────────────────
interface FilterBarProps {
  className?: string
  searchClassName?: string
  view: "list" | "grid"
  setView: (v: "list" | "grid") => void
  searchInput: string
  setSearchInput: (v: string) => void
  onAdd: () => void
  purchasers: PurchaserItem[]
  buyerFilter: number | null
  setBuyerFilter: (v: number | null) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
}

export function FilterBar({
  className, searchClassName,
  view, setView,
  searchInput, setSearchInput,
  onAdd,
  purchasers,
  buyerFilter, setBuyerFilter,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
}: Readonly<FilterBarProps>) {

  const activeChips = buildActiveChips({
    purchasers, buyerFilter, setBuyerFilter,
    dateFrom, dateTo, setDateFrom, setDateTo,
  })
  const hasFilters = activeChips.length > 0
  const clearAll = () => { setBuyerFilter(null); setDateFrom(""); setDateTo("") }
  const clearDates = () => { setDateFrom(""); setDateTo("") }

  return (
    <div className={cn("flex-col gap-2", className)}>
      {/* ── Main toolbar row ── */}
      <div className="flex flex-wrap items-center gap-2">

        {/* View toggle */}
        <div className="flex items-center rounded-full border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200",
              view === "list" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutList className="size-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200",
              view === "grid" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
        </div>

        {/* Buyer */}
        <FilterDropdown
          label="Buyer"
          active={buyerFilter !== null}
          width="w-48"
          allLabel="All Buyers"
          options={purchasers.map(p => ({ id: p.p_id, label: p.p_name }))}
          selected={buyerFilter}
          onSelect={setBuyerFilter}
        />


        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-medium transition-all",
              (dateFrom || dateTo)
                ? "border-[#009640] bg-[#009640]/10 text-[#009640]"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}>
              <IconCalendar className="size-3.5" />
              Date
              <IconChevronDown className="size-3" />
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
                  className="w-full h-8 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-[#009640] focus:border-[#009640] transition-all"
                />
              </div>
              <div>
                <label htmlFor="filter-date-to" className="text-[11px] text-muted-foreground mb-1 block">To</label>
                <input
                  id="filter-date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-transparent px-2 text-xs outline-none focus:ring-1 focus:ring-[#009640] focus:border-[#009640] transition-all"
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

        <div className="flex-1" />

        {/* Search */}
        <div className={cn(
          "relative flex items-center h-9 rounded-full border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all",
          searchClassName
        )}>
          <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
          <input
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400"
            placeholder="Search invoice, vendor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
          )}
        </div>

        {/* Add */}
        <Button
          onClick={onAdd}
          className="shrink-0 rounded-full h-9 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-3.5" />
          Add
        </Button>
      </div>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#009640]/10 border border-[#009640]/30 text-[#009640] text-[11px] font-medium"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-[#007a34] transition-colors">
                <IconX className="size-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
