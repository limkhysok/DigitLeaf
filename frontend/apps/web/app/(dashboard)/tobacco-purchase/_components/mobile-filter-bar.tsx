"use client"

import * as React from "react"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

interface MobileFilterBarProps {
  searchInput: string
  setSearchInput: (v: string) => void
  onAdd: () => void
}

export function MobileFilterBar({
  searchInput, setSearchInput, onAdd,
}: Readonly<MobileFilterBarProps>) {
  return (
    <div className="flex md:hidden items-center gap-2">
      <div className="relative flex-1 flex items-center h-9 rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
        <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          placeholder="Search invoice, vendor, buyer..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput && (
          <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
        )}
      </div>

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
  )
}
