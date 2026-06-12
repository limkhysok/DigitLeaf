"use client"

import * as React from "react"
import { IconCirclePlus, IconPlus, IconSearch, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import type { PurchaserItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"


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
  const { t } = useLanguage()
  const activeCount = [buyerFilter !== null].filter(Boolean).length
  const clearAll = () => setBuyerFilter(null)

  return (
    <div className={cn("flex flex-col gap-2", className || "flex lg:hidden")}>
      {/* Main row */}
      <div className="flex items-center gap-2">

        {/* Filter popover
            Mobile : icon-only, round pill border
            Tablet : dashed-outline with label + badge (matches sack-registration DataTableFacetedFilter style) */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              suppressHydrationWarning
              variant="outline"
              size="sm"
              className={cn(
                "shrink-0 transition-all",
                // mobile: compact icon-only round pill
                "h-9 w-9 p-0 rounded-full border",
                // tablet: dashed outline button with text (sack-registration style)
                "md:h-8 md:w-auto md:px-3 md:rounded-md md:border-dashed",
                activeCount > 0
                  ? "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10"
                  : "border-border bg-background hover:bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              <IconCirclePlus className="size-4 shrink-0" />
              <span className="hidden md:inline ml-1.5">{t.tobaccoPurchase.table.buyer}</span>
              {activeCount > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4 hidden md:block" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {activeCount}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-semibold">{t.tobaccoPurchase.table.buyer}</h3>
                {activeCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-destructive hover:text-destructive/80 underline underline-offset-2 transition-colors"
                  >
                    {t.common.reset}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pb-2">
                <PillButton active={buyerFilter === null} onClick={() => setBuyerFilter(null)}>All</PillButton>
                {purchasers.map(p => (
                  <PillButton key={p.p_id} active={buyerFilter === p.p_id} onClick={() => setBuyerFilter(p.p_id)}>
                    {p.p_name}
                  </PillButton>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset button — only when active
            Mobile : icon-only ghost
            Tablet : ghost with label + icon (matches sack-registration reset button) */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-2 shrink-0"
          >
            <span className="hidden md:inline">{t.common.reset}</span>
            <IconX className="h-4 w-4 md:ml-2" />
          </Button>
        )}

        {/* Search input
            Mobile : custom rounded-full (compact)
            Tablet : shadcn Input with rounded-sm (matches sack-registration toolbar) */}
        <div className="flex-1">
          <div className="relative flex items-center h-9 rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all md:hidden">
            <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder={t.tobaccoPurchase.filters.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <IconX className="size-3" />
              </button>
            )}
          </div>
          <Input
            placeholder={t.tobaccoPurchase.filters.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="hidden md:flex rounded-sm! h-8 w-full text-xs md:text-sm placeholder:text-sm"
          />
        </div>

        {/* Add button */}
        <Button
          onClick={onAdd}
          className="shrink-0 h-9 w-9 p-0 rounded-sm md:h-8 md:w-auto md:px-3 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-4" />
          <span className="hidden md:inline ml-1.5 text-xs font-semibold">{t.tobaccoPurchase.filters.add}</span>
        </Button>
      </div>

      {/* Active filter chips — mobile only (tablet shows count badge in filter button) */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 md:hidden">
          {buyerFilter !== null && (
            <Chip
              label={purchasers.find(p => p.p_id === buyerFilter)?.p_name ?? t.tobaccoPurchase.table.buyer}
              onRemove={() => setBuyerFilter(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: Readonly<{ label: string; onRemove: () => void }>) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-primary/70 transition-colors">
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
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-foreground/30"
      )}
    >{children}</button>
  )
}
