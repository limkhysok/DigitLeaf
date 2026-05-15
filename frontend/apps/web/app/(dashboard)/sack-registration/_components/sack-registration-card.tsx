"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
import { IconClock, IconEye, IconPencil, IconTrash, IconUsers } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { STATUS_MAP } from "./constants"

export const SackRegistrationCard = React.memo(({
  rec, index, onView, onEdit, onDelete
}: {
  rec: SackRegistrationItem
  index: number
  onView: (rec: SackRegistrationItem) => void
  onEdit: (rec: SackRegistrationItem) => void
  onDelete: (rec: SackRegistrationItem) => void
}) => {
  const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-sm border border-gray-200 bg-white transition-all duration-200 hover:shadow-md hover:border-[#009640]/30">

      <div className="flex items-start gap-3 px-3 pt-3 pb-2.5">
        <div className="shrink-0 flex items-center justify-center size-6 rounded-md bg-[#009640] text-white text-[10px] font-bold mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold text-[#111827] leading-tight line-clamp-1">
              {rec.member_farmer_name}
            </p>
            <span className={cn(
              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
              status.className
            )}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <IconUsers className="size-3 text-[#9CA3AF] shrink-0" stroke={1.5} />
            <p className="text-[11px] text-[#6B7280] line-clamp-1">{rec.represent_name}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <IconClock className="size-3 text-[#D1D5DB]" stroke={1.5} />
            <span className="text-[10px] text-[#9CA3AF] tabular-nums">
              {new Date(rec.registered_at).toLocaleDateString()}
            </span>
          </div>
          <span className="text-[#E5E7EB]">·</span>
          <span className="text-[10px] text-[#9CA3AF] truncate max-w-24">{rec.dl_user_name}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onView(rec) }} className="p-1 rounded hover:bg-[#F0FDF4] text-[#C4C9D4] hover:text-[#009640] transition-colors">
            <IconEye className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(rec) }} className="p-1 rounded hover:bg-[#F0FDF4] text-[#C4C9D4] hover:text-[#009640] transition-colors">
            <IconPencil className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(rec) }} className="p-1 rounded hover:bg-rose-50 text-[#C4C9D4] hover:text-rose-500 transition-colors">
            <IconTrash className="size-3.5" stroke={1.5} />
          </button>
        </div>
      </div>

      <button
        onClick={() => onView(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
        aria-label={`View ${rec.member_farmer_name}`}
      />
    </div>
  )
})

SackRegistrationCard.displayName = "SackRegistrationCard"
