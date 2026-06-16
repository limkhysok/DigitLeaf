"use client"

import * as React from "react"
import { TobaccoRepayItem } from "@/services/api-client"
import { IconCash, IconUser, IconUsers, IconLeaf, IconPackage, IconReceipt } from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

export const TobaccoRepayCard = React.memo(({
  rec,
  index,
}: {
  rec: TobaccoRepayItem
  index: number
}) => {
  return (
    <Card className="group flex flex-col overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-lg shadow-sm">
      {/* ROW 1: Header (Index, Year badge) */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2.5 px-3">
        <span className="text-sm font-semibold text-foreground bg-muted/60 px-1.5 rounded-sm border border-border/50">
          #{index}
        </span>
        {rec.contract_year != null && (
          <Badge
            variant="outline"
            className="px-1.5 py-0.5 text-sm font-semibold rounded-sm bg-[#009640]/10 text-[#009640] border-[#009640]/20"
          >
            {rec.contract_year}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pb-3 px-3">
        {/* ROW 2: Icon area */}
        <div className="w-full h-20 bg-muted/20 rounded-md border border-border/50 flex flex-col items-center justify-center text-muted-foreground group-hover:bg-muted/40 transition-colors overflow-hidden">
          <IconCash className="h-10 w-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" stroke={1.5} />
        </div>

        {/* ROW 3: Details */}
        <div className="flex flex-col gap-0.5">
          {/* Contract No */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconReceipt className="h-3.5 w-3.5" />
              Contract No
            </span>
            <span className="text-sm font-semibold truncate text-right text-foreground">
              {rec.contract_number || "—"}
            </span>
          </div>

          {/* Contractor */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconUser className="h-3.5 w-3.5" />
              Contractor
            </span>
            <span className="text-sm font-medium truncate text-right text-foreground" title={rec.contract_contractor_name ?? undefined}>
              {rec.contract_contractor_name || "—"}
            </span>
          </div>

          {/* Representative */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconUsers className="h-3.5 w-3.5" />
              Representative
            </span>
            <span className="text-sm font-medium truncate text-right text-foreground" title={rec.representative ?? undefined}>
              {rec.representative || "—"}
            </span>
          </div>

          {/* Tobacco Type */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconLeaf className="h-3.5 w-3.5" />
              Tobacco Type
            </span>
            <span className="text-sm font-medium text-right text-foreground">
              {rec.tobacco_type || "—"}
            </span>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconPackage className="h-3.5 w-3.5" />
              Quantity
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              {rec.Quantity == null ? "—" : `${rec.Quantity.toLocaleString()} kg`}
            </span>
          </div>

          {/* Total Repaid */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconCash className="h-3.5 w-3.5" />
              Total Repaid
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-[#009640]">
              {rec.total_repaid == null ? "—" : `${rec.total_repaid.toLocaleString()} kg`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

TobaccoRepayCard.displayName = "TobaccoRepayCard"
