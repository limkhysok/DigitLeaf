"use client"

import * as React from "react"
import { FarmerContrastItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"
import { IconSeedling, IconUser, IconBook2, IconId, IconScale, IconLeaf } from "@tabler/icons-react"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface FarmerContrastCardProps {
  readonly rec: FarmerContrastItem
  readonly index: number
}

export function FarmerContrastCard({ rec, index }: FarmerContrastCardProps) {
  const { t } = useLanguage()

  const isOverYield =
    rec.purchased_weight != null &&
    rec.expected_yield != null &&
    rec.purchased_weight > rec.expected_yield

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-lg shadow-sm",
        isOverYield && "border-red-300/60 hover:border-red-400/70"
      )}
    >
      {/* ROW 1: Header (Index, Year badge) */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2.5 px-3">
        <span className="text-sm font-semibold text-foreground bg-muted/60 px-1.5 rounded-sm border border-border/50">
          #{index}
        </span>
        <Badge
          variant="outline"
          className="px-1.5 py-0.5 text-sm font-semibold rounded-sm bg-[#009640]/10 text-[#009640] border-[#009640]/20"
        >
          {rec.year}
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pb-3 px-3">
        {/* ROW 2: Icon area */}
        <div className="w-full h-20 bg-muted/20 rounded-md border border-border/50 flex flex-col items-center justify-center text-muted-foreground group-hover:bg-muted/40 transition-colors overflow-hidden">
          <IconBook2 className="h-10 w-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" stroke={1.5} />
        </div>

        {/* ROW 3: Details */}
        <div className="flex flex-col gap-0.5">
          {/* Farmer Name */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconUser className="h-3.5 w-3.5" />
              {t.farmerContrast.farmerName}
            </span>
            <span className="text-sm font-semibold truncate text-right text-foreground" title={rec.name}>
              {rec.name}
            </span>
          </div>

          {/* ID Code */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconId className="h-3.5 w-3.5" />
              {t.farmerContrast.idCard}
            </span>
            <span className="text-sm font-mono text-right text-foreground">
              {rec.mf_code}
            </span>
          </div>

          {/* Sapling */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconLeaf className="h-3.5 w-3.5" />
              {t.farmerContrast.saplingKg}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              {rec.tobac_num !== undefined && rec.tobac_num !== null
                ? rec.tobac_num.toLocaleString()
                : <span className="text-muted-foreground/40">—</span>}
            </span>
          </div>

          {/* Expected Yield */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconSeedling className="h-3.5 w-3.5" />
              {t.farmerContrast.expectedYieldKg}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-[#2c2c2c]">
              {rec.expected_yield !== undefined && rec.expected_yield !== null
                ? `${rec.expected_yield.toLocaleString()} kg`
                : <span className="text-muted-foreground/40">—</span>}
            </span>
          </div>

          {/* Purchased Weight */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
              <IconScale className="h-3.5 w-3.5" />
              {t.farmerContrast.purchasedWeightKg}
            </span>
            <span className={cn(
              "text-sm font-semibold tabular-nums text-right text-foreground"
            )}>
              {rec.purchased_weight !== undefined && rec.purchased_weight !== null
                ? `${rec.purchased_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                : <span className="text-muted-foreground/40">—</span>}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
