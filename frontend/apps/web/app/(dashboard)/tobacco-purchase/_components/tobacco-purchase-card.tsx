"use client"

import * as React from "react"
import {
  IconCalendar,
  IconPackage,
  IconTrash,
  IconUser,
  IconBuildingStore,
  IconFileText,
  IconFlame
} from "@tabler/icons-react"
import { TobaccoPurchase, PurchaserItem, OvenItem } from "@/lib/api-client"
import { formatPurchaseDate } from "./utils"

interface TobaccoPurchaseCardProps {
  rec: TobaccoPurchase
  index: number
  purchaser?: PurchaserItem
  oven?: OvenItem
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export const TobaccoPurchaseCard = React.memo(({
  rec, index, purchaser, oven, onEdit, onDelete
}: TobaccoPurchaseCardProps) => {
  return (
    <div className="group relative flex flex-col justify-between rounded-md bg-white border border-slate-200/80 hover:border-slate-350 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-200 overflow-hidden p-4">

      {/* Top Header section */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Index Badge */}
            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded shrink-0">
              #{index + 1}
            </span>
            {/* Invoice ID */}
            <div className="flex items-center gap-1 min-w-0">
              <IconFileText className="size-4 text-slate-400 shrink-0" stroke={1.8} />
              <span className="font-mono text-[13px] font-semibold text-slate-800 tracking-tight truncate">
                {rec.invoice_num}
              </span>
            </div>
          </div>
          {/* Date display aligned under index and invoice */}
          <div className="flex items-center gap-1 text-slate-400 pl-1.5">
            <IconCalendar className="size-3 shrink-0" stroke={1.5} />
            <span className="text-[10px] font-medium tracking-wide">
              {formatPurchaseDate(rec.tp_date, rec.do_date)}
            </span>
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(rec.tp_id)
          }}
          className="relative z-10 p-1.5 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700 md:opacity-0 group-hover:opacity-100 transition-all duration-150 mt-0.5 shrink-0"
          aria-label="Delete purchase"
        >
          <IconTrash className="size-3.8" stroke={1.5} />
        </button>
      </div>

      {/* Optimized Content Body: 2 Columns Side-by-Side to reduce height */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-b border-slate-100 py-2.5 mb-3">

        {/* Left Column: Buyer & Vendor */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <IconUser className="size-4 text-slate-400 mt-0.5 shrink-0" stroke={1.8} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Buyer</span>
              <span className="text-xs font-semibold text-slate-855 truncate block mt-0.5">
                {purchaser?.p_name || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <IconBuildingStore className="size-4 text-slate-400 mt-0.5 shrink-0" stroke={1.8} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Vendor</span>
              <span className="text-xs font-medium text-slate-700 truncate block mt-0.5">
                {rec.vendor || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Items & Oven */}
        <div className="space-y-2 min-w-0 border-l border-slate-100 pl-4">
          <div className="flex items-start gap-2 min-w-0">
            <IconPackage className="size-4 text-slate-400 mt-0.5 shrink-0" stroke={1.8} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Items</span>
              <span className="text-xs font-semibold text-slate-855 block mt-0.5">
                {rec.tobacco_item_count ?? 0} Items
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <IconFlame className="size-4 text-slate-400 mt-0.5 shrink-0" stroke={1.8} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Oven</span>
              <span className="text-xs font-medium text-slate-700 truncate block mt-0.5">
                {oven?.name_en || "—"}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Metrics Row */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Weight</span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-sm font-bold text-slate-800 tabular-nums">
              {rec.total_net_weight?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "0.0"}
            </span>
            <span className="text-[10px] font-medium text-slate-400 ml-0.5">kg</span>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Grand Total</span>
          <div className="flex items-baseline gap-0.5 mt-0.5 text-emerald-600">
            <span className="text-xs font-bold">៛</span>
            <span className="text-sm font-bold tabular-nums">
              {Math.round(rec.grand_total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Invisible overlay for edit trigger */}
      <button
        onClick={() => onEdit(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-350 focus-visible:ring-inset"
        aria-label={`Edit ${rec.invoice_num}`}
      />
    </div>
  )
})

TobaccoPurchaseCard.displayName = "TobaccoPurchaseCard"
