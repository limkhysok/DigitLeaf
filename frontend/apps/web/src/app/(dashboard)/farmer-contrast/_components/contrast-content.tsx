"use client"

import * as React from "react"
import { FarmerContrastItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"
import {
  IconLoader2,
  IconClipboardList,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { FarmerContrastCard } from "./farmer-contrast-card"

export interface ContrastContentProps {
  readonly isLoading: boolean
  readonly records: FarmerContrastItem[]
  readonly view: "list" | "grid"
  readonly sortBy: "sapling" | "yield" | null
  readonly sortOrder: "asc" | "desc"
  readonly onSort: (field: "sapling" | "yield") => void
}

export function ContrastContent({
  isLoading,
  records,
  view,
  sortBy,
  sortOrder,
  onSort,
}: ContrastContentProps) {
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <IconLoader2 className="h-7 w-7 animate-spin text-[#009640]" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <IconClipboardList className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{t.farmerContrast.noRecordsFound}</span>
        </CardContent>
      </Card>
    )
  }

  // Mobile list view
  const mobileList = (
    <div className="grid md:hidden grid-cols-1 gap-3">
      {records.map((rec, idx) => (
        <FarmerContrastCard
          key={rec.mf_con_id}
          rec={rec}
          index={idx + 1}
        />
      ))}
    </div>
  )

  // Tablet list view (below lg screen, showing 2 columns)
  const tabletList = (
    <div className="hidden md:grid lg:hidden grid-cols-3 gap-4">
      {records.map((rec, idx) => (
        <FarmerContrastCard
          key={rec.mf_con_id}
          rec={rec}
          index={idx + 1}
        />
      ))}
    </div>
  )

  // Desktop list or grid view
  const desktopContent = (
    <div className="hidden lg:block">
      {view === "list" ? (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#F9FAFB] border-gray-200">
                    <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-12">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                      {t.farmerContrast.farmerName}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                      onClick={() => onSort("sapling")}
                    >
                      <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                        {t.farmerContrast.saplingKg}
                        {sortBy === "sapling" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                        {sortBy === "sapling" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                        {sortBy !== "sapling" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                      onClick={() => onSort("yield")}
                    >
                      <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                        {t.farmerContrast.expectedYieldKg}
                        {sortBy === "yield" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                        {sortBy === "yield" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                        {sortBy !== "yield" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                      {t.farmerContrast.purchasedWeightKg}
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-24">
                      {t.farmerContrast.year}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr
                      key={rec.mf_con_id}
                      className={cn(
                        "group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors",
                        idx % 2 === 1 && "bg-[#F9FAFB]/60"
                      )}
                    >
                      <td className="px-4 py-3.5 text-[#9CA3AF] text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 text-[#111827] font-semibold">
                        {rec.name}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                        {rec.tobac_num !== undefined && rec.tobac_num !== null ? rec.tobac_num.toLocaleString() : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                        {rec.expected_yield !== undefined && rec.expected_yield !== null ? `${rec.expected_yield.toLocaleString()} kg` : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                        {rec.purchased_weight !== undefined && rec.purchased_weight !== null
                          ? `${rec.purchased_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                          : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
                          {rec.year}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
          {records.map((rec, idx) => (
            <FarmerContrastCard
              key={rec.mf_con_id}
              rec={rec}
              index={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {mobileList}
      {tabletList}
      {desktopContent}
    </>
  )
}
