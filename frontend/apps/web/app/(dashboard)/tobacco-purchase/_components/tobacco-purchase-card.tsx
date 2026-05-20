"use client"

import * as React from "react"
import {
  IconCalendar,
  IconPackage,
  IconTrash,
  IconUser,
  IconBuildingStore,
  IconFileText
} from "@tabler/icons-react"
import { TobaccoPurchase, PurchaserItem } from "@/lib/api-client"

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
  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden p-4">
      
      {/* Top Header section */}
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Invoice ID */}
        <div className="flex items-center gap-1.5 min-w-0">
          <IconFileText className="size-4.5 text-emerald-600 shrink-0" stroke={2} />
          <span className="font-mono text-sm font-bold text-slate-800 truncate">
            {rec.invoice_num}
          </span>
        </div>
        {/* Index and Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            #{index + 1}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(rec.tp_id)
            }}
            className="relative z-10 p-1.5 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150"
            aria-label="Delete purchase"
          >
            <IconTrash className="size-4" stroke={1.5} />
          </button>
        </div>
      </div>

      {/* Optimized Content Body: 2 Columns Side-by-Side to reduce height */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-b border-slate-100 py-3 mb-3">
        
        {/* Left Column: Buyer & Vendor */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconUser className="size-4 text-slate-400 shrink-0" stroke={2.5} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Buyer</span>
              <span className="text-[13px] font-semibold text-slate-800 truncate block mt-0.5">
                {purchaser?.p_name || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <IconBuildingStore className="size-4 text-slate-400 shrink-0" stroke={2.5} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Vendor</span>
              <span className="text-xs font-medium text-slate-700 truncate block mt-0.5">
                {rec.vendor || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Date & Items */}
        <div className="space-y-2 min-w-0 border-l border-slate-100 pl-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <IconCalendar className="size-4 text-blue-500 shrink-0" stroke={2} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Date</span>
              <span className="text-xs font-medium text-slate-755 truncate block mt-0.5">
                {rec.tp_date ? String(rec.tp_date) : "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <IconPackage className="size-4 text-emerald-500 shrink-0" stroke={2} />
            <div className="min-w-0">
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Items</span>
              <span className="text-xs font-bold text-slate-755 block mt-0.5">
                {rec.tobacco_item_count ?? 0} Items
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Metrics Row */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 mt-auto flex items-center justify-between">
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Weight</span>
          <div className="flex items-baseline gap-0.5 mt-1">
            <span className="text-sm font-extrabold text-slate-800 tabular-nums">
              {rec.total_net_weight?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "0.0"}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 ml-0.5">kg</span>
          </div>
        </div>

        <div className="text-right">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Grand Total</span>
          <div className="flex items-baseline gap-0.5 mt-0.5 text-emerald-600">
            <span className="text-xs font-bold">៛</span>
            <span className="text-base font-black tabular-nums">
              {Math.round(rec.grand_total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Invisible overlay for edit trigger */}
      <button
        onClick={() => onEdit(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
        aria-label={`Edit ${rec.invoice_num}`}
      />
    </div>
  )
})

TobaccoPurchaseCard.displayName = "TobaccoPurchaseCard"
