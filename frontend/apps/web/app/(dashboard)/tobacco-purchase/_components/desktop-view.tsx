"use client"

import * as React from "react"
import {
  IconChevronDown, IconChevronUp,
  IconEdit, IconEye, IconTrash,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { TobaccoPurchase, PurchaserItem, OvenItem } from "@/lib/api-client"
import { TobaccoPurchaseCard } from "./tobacco-purchase-card"

type SortDir = "asc" | "desc" | null

interface SortIconProps { dir: SortDir }
function SortIcon({ dir }: Readonly<SortIconProps>) {
  if (dir === "asc") return <IconChevronUp className="size-3 ml-0.5" />
  if (dir === "desc") return <IconChevronDown className="size-3 ml-0.5" />
  return (
    <span className="size-3 ml-0.5 opacity-0 group-hover/th:opacity-40">
      <IconChevronDown className="size-3" />
    </span>
  )
}

const PAGE_SIZE = 50

interface DesktopViewProps {
  records: TobaccoPurchase[]
  purchasers: PurchaserItem[]
  ovens: OvenItem[]
  view: "list" | "grid"
  page: number
  sortGrandTotal: SortDir
  sortNetWeight: SortDir
  onToggleSort: (col: "grand_total" | "net_weight") => void
  onEdit: (rec: TobaccoPurchase) => void
  onView: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export function DesktopView({
  records, purchasers, ovens,
  view, page,
  sortGrandTotal, sortNetWeight, onToggleSort,
  onEdit, onView, onDelete,
}: Readonly<DesktopViewProps>) {
  if (view === "grid") {
    return (
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-3">
        {records.map((rec, index) => (
          <TobaccoPurchaseCard
            key={rec.tp_id}
            rec={rec}
            index={index}
            purchaser={purchasers.find(p => p.p_id === rec.buyer)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="hidden lg:block">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#F9FAFB] border-gray-200">
                  <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-10">No.</th>
                  <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Invoice No</th>
                  <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Buyer</th>
                  <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider whitespace-nowrap">Purchase Date</th>
                  <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider whitespace-nowrap">Item Count</th>
                  <th
                    className="px-4 py-3 text-right font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer select-none group/th whitespace-nowrap"
                    onClick={() => onToggleSort("net_weight")}
                  >
                    <span className="inline-flex items-center justify-end gap-0.5">
                      Total Weight
                      <SortIcon dir={sortNetWeight} />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-right font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer select-none group/th whitespace-nowrap"
                    onClick={() => onToggleSort("grand_total")}
                  >
                    <span className="inline-flex items-center justify-end gap-0.5">
                      Grand Total
                      <SortIcon dir={sortGrandTotal} />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, index) => {
                  const purchaser = purchasers.find(p => p.p_id === rec.buyer)
                  return (
                    <tr
                      key={rec.tp_id}
                      className={cn(
                        "group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors",
                        index % 2 === 1 && "bg-[#F9FAFB]/60"
                      )}
                    >
                      <td className="px-4 py-3 text-center text-[#9CA3AF] text-xs">{page * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 font-mono text-[13px] font-semibold text-[#111827]">{rec.invoice_num}</td>
                      <td className="px-4 py-3 text-[#111827] font-semibold">{purchaser?.p_name || "-"}</td>
                      <td className="px-4 py-3 text-[#374151]">{rec.vendor || "-"}</td>
                      <td className="px-4 py-3 text-[13px] text-[#9CA3AF] whitespace-nowrap">{rec.tp_date ? String(rec.tp_date) : "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {rec.tobacco_item_count == null ? (
                          <span className="text-[#9CA3AF] text-xs">-</span>
                        ) : (
                          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#F3F4F6] text-[#374151] text-[11px] font-bold">
                            {rec.tobacco_item_count}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-[#111827] tabular-nums">
                        {rec.total_net_weight == null
                          ? "-"
                          : rec.total_net_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-black text-[#009640] tabular-nums">
                        {rec.grand_total == null ? "-" : `៛${Math.round(rec.grand_total).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                          <button
                            onClick={() => onView(rec)}
                            className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                          >
                            <IconEye className="size-4" stroke={1.5} />
                          </button>
                          <button
                            onClick={() => onEdit(rec)}
                            className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                          >
                            <IconEdit className="size-4" stroke={1.5} />
                          </button>
                          <button
                            onClick={() => onDelete(rec.tp_id)}
                            className="p-1 rounded-md hover:bg-rose-50 text-[#9CA3AF] hover:text-rose-600 transition-colors"
                          >
                            <IconTrash className="size-4" stroke={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
