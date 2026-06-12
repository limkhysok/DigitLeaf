"use client"

import * as React from "react"
import { IconCirclePlus, IconCirclePlusFilled, IconX } from "@tabler/icons-react"
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
    <div className={cn("flex items-center gap-2", className || "flex lg:hidden")}>

      {/* Filter popover — dashed-outline with label + badge (sack-registration style) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            suppressHydrationWarning
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-3 rounded-md border-dashed shrink-0 transition-all",
              activeCount > 0
                ? "border-primary/60 bg-primary/5 text-primary hover:bg-primary/10"
                : "border-border bg-background hover:bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            <IconCirclePlus className="size-4 shrink-0" />
            <span className="ml-1.5">{t.tobaccoPurchase.table.buyer}</span>
            {activeCount > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
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

      {/* Reset button — visible when a filter is active */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-8 px-2 shrink-0"
        >
          {t.common.reset}
          <IconX className="ml-2 h-4 w-4" />
        </Button>
      )}

      {/* Search input — shadcn Input (sack-registration style) */}
      <Input
        placeholder={t.tobaccoPurchase.filters.searchPlaceholder}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="rounded-sm! h-8 flex-1 text-sm placeholder:text-sm"
      />

      {/* Add button */}
      <Button
        size="sm"
        onClick={onAdd}
        className="h-8 px-2 flex gap-1.5 rounded-sm shrink-0"
      >
        <IconCirclePlusFilled className="h-4 w-4" />
        <span>{t.tobaccoPurchase.filters.add}</span>
      </Button>
    </div>
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
