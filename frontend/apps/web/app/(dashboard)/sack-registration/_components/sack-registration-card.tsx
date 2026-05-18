"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
import { IconClock, IconEye, IconPencil, IconTrash, IconUsers, IconPackage } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { STATUS_MAP } from "./constants"
import { useLanguage } from "@/hooks/use-language"

// Brand dot colors corresponding to status types for indicators
const STATUS_DOT_COLORS: Record<number, string> = {
  0: "bg-amber-500",  // Pending
  1: "bg-[#009640]",  // Approved
  2: "bg-rose-500",   // Rejected
}

// Brand gradient lines corresponding to status types for left highlights
const STATUS_GRADIENTS: Record<number, string> = {
  0: "bg-gradient-to-b from-amber-400 to-amber-600",  // Pending
  1: "bg-gradient-to-b from-[#009640] to-emerald-600", // Approved
  2: "bg-gradient-to-b from-rose-400 to-rose-600",    // Rejected
}

// Brand ping colors corresponding to status types for live pulsating pings
const STATUS_PING_COLORS: Record<number, string> = {
  0: "bg-amber-400",
  1: "bg-emerald-400",
  2: "bg-rose-400",
}

export const SackRegistrationCard = React.memo(({
  rec, index, onView, onEdit, onDelete
}: {
  rec: SackRegistrationItem
  index: number
  onView: (rec: SackRegistrationItem) => void
  onEdit: (rec: SackRegistrationItem) => void
  onDelete: (rec: SackRegistrationItem) => void
}) => {
  const { t } = useLanguage()
  const status = STATUS_MAP[rec.status] ?? { className: "bg-gray-100 text-gray-800" }
  const getStatusLabel = (statusVal: number) => {
    switch (statusVal) {
      case 0: return t.sackRegistration.filters.statusPending
      case 1: return t.sackRegistration.filters.statusApproved
      case 2: return t.sackRegistration.filters.statusRejected
      default: return String(statusVal)
    }
  }
  const statusLabel = getStatusLabel(rec.status)

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/60 transition-all duration-200 hover:border-[#009640]/40 hover:shadow-[0_6px_20px_-4px_rgba(0,150,64,0.1)] hover:-translate-y-0.5 min-h-[110px]">

      {/* 1. Dynamic Left-Aligned Vertical Status Gradient Highlight Line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-200 group-hover:w-[3.5px] z-20",
        STATUS_GRADIENTS[rec.status] ?? "bg-gradient-to-b from-slate-400 to-slate-500"
      )} />

      {/* 2. Header: Farmer Name, Serial Tag & Dual Pulsating Live Dot */}
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2.5 relative z-10 pl-4.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Monospace physical ticket stamped serial tag */}
          <span className="font-mono text-[12px] font-bold text-slate-500 bg-slate-100 border border-slate-250/50 px-1 py-0.5 rounded-sm shrink-0 select-none">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <p className="text-[13px] font-extrabold text-slate-900 leading-tight truncate group-hover:translate-x-0.5 group-hover:text-[#009640] transition-all" title={rec.member_farmer_name}>
            {rec.member_farmer_name}
          </p>
        </div>

        {/* Dynamic status badge with surrounding live network ping ring */}
        <span className={cn(
          "shrink-0 inline-flex items-center rounded-sm px-1.5 py-0.5 text-[12px] font-bold border gap-1.5 shadow-2xs",
          status.className
        )}>
          <span className="relative flex size-1.5 shrink-0">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              STATUS_PING_COLORS[rec.status] ?? "bg-slate-400"
            )} />
            <span className={cn(
              "relative inline-flex rounded-full size-1.5",
              STATUS_DOT_COLORS[rec.status] ?? "bg-slate-400"
            )} />
          </span>
          {statusLabel}
        </span>
      </div>

      {/* 3. Body: Split-Panel Pristine Details Table Grid (Smooth Background) */}
      <div className="grid grid-cols-2 gap-0 border-y border-slate-100 bg-slate-50/30 divide-x divide-slate-100 relative z-10">
        {/* Left Column: Representative details */}
        <div className="flex flex-col gap-0.5 pl-4.5 pr-3 py-2 min-w-0">
          <span className="text-slate-400 font-semibold text-[12px] uppercase tracking-wider flex items-center gap-0.5">
            <IconUsers className="size-2.5 text-slate-400 shrink-0" stroke={2} />
            {t.sackRegistration.table.representative}
          </span>
          <span className="text-slate-700 font-bold text-[12px] truncate" title={rec.represent_name}>
            {rec.represent_name}
          </span>
        </div>

        {/* Right Column: Sack Weight with inline Progress Scale */}
        <div className="flex flex-col gap-0.5 px-3 py-2 min-w-0">
          <span className="text-slate-400 font-semibold text-[12px] uppercase tracking-wider flex items-center gap-0.5">
            <IconPackage className="size-2.5 text-slate-400 shrink-0" stroke={2} />
            {t.sackRegistration.table.sackWeight}
          </span>
          <div className="flex flex-col justify-center">
            <span className="text-slate-700 font-bold text-[12px]">
              {rec.sack_in_kg !== null && rec.sack_in_kg !== undefined ? (
                <span className="text-[#009640] font-extrabold tabular-nums">
                  {rec.sack_in_kg} kg
                </span>
              ) : (
                <span className="text-slate-350 font-normal">—</span>
              )}
            </span>

            {/* Visual mini-progress weight scale bar (Max standard capacity: 60kg) */}
            {rec.sack_in_kg !== null && rec.sack_in_kg !== undefined && (
              <div className="w-full bg-slate-200/50 rounded-full h-[3px] mt-1 overflow-hidden border border-slate-200/10">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-[#009640] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((rec.sack_in_kg / 60) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Footer: Clock, Author & Sliding Micro-Actions */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/15 mt-auto relative z-10 pl-4.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] min-w-0">
          <IconClock className="size-3 shrink-0 text-slate-350" stroke={1.5} />
          <span className="font-bold font-[12px] tabular-nums shrink-0">
            {new Date(rec.registered_at).toLocaleDateString()}
          </span>
          <span className="text-slate-200 shrink-0 select-none">|</span>
          <span className="font-bold text-[12px] truncate max-w-20 text-slate-500 shrink-0" title={rec.dl_user_name}>
            {rec.dl_user_name}
          </span>
        </div>

        {/* Sliding & Fading Actions Control Deck Toolbar */}
        <div className="flex items-center gap-0.5 opacity-60 md:opacity-0 md:translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onView(rec) }}
            className="p-1 rounded-sm border border-slate-200 bg-white hover:border-[#009640]/30 hover:bg-emerald-50 text-slate-400 hover:text-[#009640] shadow-2xs transition-colors"
            title="View Details"
          >
            <IconEye className="size-3.5" stroke={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(rec) }}
            className="p-1 rounded-sm border border-slate-200 bg-white hover:border-[#009640]/30 hover:bg-emerald-50 text-slate-400 hover:text-[#009640] shadow-2xs transition-colors"
            title="Edit"
          >
            <IconPencil className="size-3.5" stroke={1.5} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(rec) }}
            className="p-1 rounded-sm border border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-2xs transition-colors"
            title="Delete"
          >
            <IconTrash className="size-3.5" stroke={1.5} />
          </button>
        </div>
      </div>

      {/* 5. Delicate Biological Leaf Watermark Background Graphic (Beautiful Brand Identity Backdrop) */}
      <div className="absolute right-0 bottom-0 pointer-events-none select-none opacity-[0.065] text-[#009640] translate-x-4 translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 group-hover:scale-105 transition-all duration-300 z-0">
        <svg
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 22C2 22 3.5 15.5 9 10C14.5 4.5 22 2 22 2C22 2 19.5 9.5 14 15C8.5 20.5 2 22 2 22Z" fill="currentColor" fillOpacity="0.08" />
          <path d="M2 22C6.5 17.5 11 13 15 9" />
          <path d="M6 18C7.5 17.5 9.5 17.5 11 18" />
          <path d="M10 14C11.5 13.5 13.5 13.5 15 14" />
          <path d="M14 10C15.5 9.5 17.5 9.5 19 10" />
        </svg>
      </div>

      {/* Full card absolute click interceptor to trigger view details */}
      <button
        onClick={() => onView(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
        aria-label={`View ${rec.member_farmer_name}`}
      />
    </div>
  )
})

SackRegistrationCard.displayName = "SackRegistrationCard"
