"use client"

import * as React from "react"
import {
  IconClock,
  IconPencil,
  IconTrash,
  IconUser,
  IconBuildingStore,
  IconPackage,
  IconDots,
  IconLeaf,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { format } from "date-fns"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { TobaccoPurchase, PurchaserItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"

interface TobaccoPurchaseCardProps {
  rec: TobaccoPurchase
  index: number
  purchaser?: PurchaserItem
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export const TobaccoPurchaseCard = React.memo(({
  rec, index, purchaser, onEdit, onDelete
}: TobaccoPurchaseCardProps) => {
  const { t, localizeNumber } = useLanguage()

  return (
    <Card
      className="group flex flex-col overflow-hidden cursor-pointer border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-lg shadow-sm"
      onClick={() => onEdit(rec)}
    >
      {/* ROW 1: Header (Number, Invoice, Menu) */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground bg-muted/60 px-1.5 rounded-sm border border-border/50">
            #{localizeNumber(index)}
          </span>
          <Badge variant="outline" className="px-1.5 py-0.5 text-xs font-mono font-semibold rounded-sm border-opacity-50 truncate max-w-30">
            {rec.invoice_num}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:bg-muted shrink-0 -mr-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(rec)}>
              <IconPencil className="mr-2 h-4 w-4" />
              {t.sackRegistration.dialog.edit}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(rec.tp_id)} className="text-destructive focus:text-destructive">
              <IconTrash className="mr-2 h-4 w-4 text-destructive" />
              {t.sackRegistration.dialog.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pb-3 px-3">
        {/* ROW 2: Leaf Icon */}
        <div className="w-full h-20 bg-muted/20 rounded-md border border-border/50 flex flex-col items-center justify-center text-muted-foreground group-hover:bg-muted/40 transition-colors overflow-hidden">
          <IconLeaf className="h-10 w-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" stroke={1.5} />
        </div>

        {/* ROW 3: Details */}
        <div className="flex flex-col gap-0.5">
          {/* Representative */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconUser className="h-3.5 w-3.5" />
              {t.tobaccoPurchase.table.buyer}
            </span>
            <span className="text-sm font-semibold truncate text-right text-foreground" title={purchaser?.p_name_kh || purchaser?.p_name}>
              {purchaser?.p_name_kh || purchaser?.p_name || "—"}
            </span>
          </div>
          {/* Farmer */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconBuildingStore className="h-3.5 w-3.5" />
              {t.tobaccoPurchase.table.vendor}
            </span>
            <span className="text-sm font-medium truncate text-right text-foreground" title={rec.vendor_name ?? undefined}>
              {rec.vendor_name || "—"}
            </span>
          </div>
          {/* Net Weight */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconPackage className="h-3.5 w-3.5" />
              {t.tobaccoPurchase.table.netWeight}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              {rec.total_net_weight == null
                ? "—"
                : `${localizeNumber(rec.total_net_weight.toFixed(1))} kg`}
            </span>
          </div>
          {/* Grand Total */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconCurrencyDollar className="h-3.5 w-3.5" />
              {t.tobaccoPurchase.table.grandTotal}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              ៛{localizeNumber(Math.round(rec.grand_total || 0).toLocaleString())}
            </span>
          </div>
          {/* Date */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconClock className="h-3.5 w-3.5" />
              {t.tobaccoPurchase.table.date}
            </span>
            <span className="text-sm font-medium tabular-nums text-right text-foreground">
              {localizeNumber(format(new Date(rec.tp_date), "dd/MM/yyyy"))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

TobaccoPurchaseCard.displayName = "TobaccoPurchaseCard"
