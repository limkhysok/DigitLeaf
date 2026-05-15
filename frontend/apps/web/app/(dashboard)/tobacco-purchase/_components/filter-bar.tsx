"use client"

import * as React from "react"
import {
  IconLayoutGrid, IconLayoutList, IconPlus, IconSearch,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface FilterBarProps {
  className?: string
  searchClassName?: string
  view: "list" | "grid"
  setView: (v: "list" | "grid") => void
  searchInput: string
  setSearchInput: (v: string) => void
  onAdd: () => void
}

export function FilterBar({
  className,
  searchClassName,
  view, setView,
  searchInput, setSearchInput,
  onAdd,
}: Readonly<FilterBarProps>) {
  return (
    <div className={cn("flex-wrap items-center gap-2", className)}>
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

      <div className="flex-1" />

      {/* Search */}
      <div className={cn(
        "relative flex items-center h-9 rounded-full border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all",
        searchClassName
      )}>
        <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
        <input
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400"
          placeholder="Search invoice, vendor, buyer..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
        )}
      </div>

      {/* Add button */}
      <Button
        onClick={onAdd}
        className="shrink-0 rounded-full h-9 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
      >
        <IconPlus className="size-3.5" />
        Add
      </Button>
    </div>
  )
}
