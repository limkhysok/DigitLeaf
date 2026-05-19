"use client"

import * as React from "react"
import {
  IconFlame, IconMapPin, IconTrash, IconUser,
} from "@tabler/icons-react"
import { TobaccoPurchase, PurchaserItem, RegionItem, OvenItem } from "@/lib/api-client"

interface TobaccoPurchaseCardProps {
  rec: TobaccoPurchase
  index: number
  purchaser?: PurchaserItem
  region?: RegionItem
  oven?: OvenItem
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export const TobaccoPurchaseCard = React.memo(({
  rec, index, purchaser, region, oven, onEdit, onDelete
}: TobaccoPurchaseCardProps) => {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-sm border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:border-[#009640]/30">

      {/* Card header: index + invoice + date */}
      <div className="flex items-start gap-3 px-3 pt-3 pb-2.5">
        <div className="shrink-0 flex items-center justify-center size-6 rounded-md bg-[#009640] text-white text-[10px] font-bold mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-mono text-[12px] font-bold text-[#111827] leading-tight line-clamp-1">
              {rec.invoice_num}
            </p>
            <span className="shrink-0 text-[10px] text-[#9CA3AF] whitespace-nowrap">{rec.tp_date || "-"}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <IconUser className="size-3 text-[#9CA3AF] shrink-0" stroke={1.5} />
            <p className="text-[11px] text-[#6B7280] line-clamp-1">{purchaser?.p_name || "Direct Sale"}</p>
          </div>
        </div>
      </div>

      {/* Card body: metadata */}
      <div className="px-3 pb-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <IconUser className="size-3 text-[#D1D5DB] shrink-0" stroke={1.5} />
          <span className="text-[11px] text-[#6B7280] truncate">{rec.vendor || "Farmer"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <IconMapPin className="size-3 text-[#D1D5DB] shrink-0" stroke={1.5} />
            <span className="text-[11px] text-[#6B7280] truncate">{region?.reg_name || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconFlame className="size-3 text-[#D1D5DB] shrink-0" stroke={1.5} />
            <span className="text-[11px] text-[#6B7280] truncate">{oven?.name_en || "-"}</span>
          </div>
        </div>
      </div>

      {/* Card footer: totals + actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex flex-col gap-0">
          <span className="text-[9px] font-black uppercase text-[#9CA3AF] tracking-wider">Net weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[13px] font-bold text-[#111827] tabular-nums">
              {rec.total_net_weight?.toLocaleString(undefined, { minimumFractionDigits: 1 }) || "0.0"}
            </span>
            <span className="text-[9px] font-bold text-[#9CA3AF]">KG</span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 relative z-10 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(rec.tp_id) }}
            className="p-1 rounded hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
            aria-label="Delete record"
          >
            <IconTrash className="size-4" stroke={1.5} />
          </button>
        </div>

        <div className="flex flex-col items-end gap-0">
          <span className="text-[9px] font-black uppercase text-[#009640]/70 tracking-wider">Grand total</span>
          <div className="flex items-baseline gap-0.5 text-[#009640]">
            <span className="text-[10px] font-bold">៛</span>
            <span className="text-[13px] font-black tabular-nums">
              {Math.round(rec.grand_total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Click overlay */}
      <button
        onClick={() => onEdit(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
        aria-label={`Edit ${rec.invoice_num}`}
      />
    </div>
  )
})

TobaccoPurchaseCard.displayName = "TobaccoPurchaseCard"
