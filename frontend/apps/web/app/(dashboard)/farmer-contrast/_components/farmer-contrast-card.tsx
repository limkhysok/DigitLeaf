"use client"

import * as React from "react"
import { FarmerContrastItem } from "@/lib/api-client"
import { Card, CardContent } from "@workspace/ui/components/card"
import { useLanguage } from "@/hooks/use-language"

export interface FarmerContrastCardProps {
  readonly rec: FarmerContrastItem
  readonly index: number
}

export function FarmerContrastCard({ rec, index }: FarmerContrastCardProps) {
  const { t } = useLanguage()

  return (
    <Card className="border-gray-200 shadow-sm bg-white hover:border-[#009640]/50 hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">No. {index}</span>
          <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold border border-[#009640]/20">
            {rec.year}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-[#009640] transition-colors">{rec.name}</h3>
          <span className="text-xs text-muted-foreground font-mono">{rec.mf_code}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {t.farmerContrast.saplingKg}
            </span>
            <span className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
              {rec.tobac_num !== undefined && rec.tobac_num !== null ? rec.tobac_num.toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {t.farmerContrast.expectedYield}
            </span>
            <span className="text-xs font-bold text-[#009640] mt-0.5 tabular-nums">
              {rec.expected_yield !== undefined && rec.expected_yield !== null ? `${rec.expected_yield.toLocaleString()} kg` : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
