"use client"

import * as React from "react"
import { FarmerContrastItem } from "@/lib/api-client"
import { useLanguage } from "@/hooks/use-language"
import { IconSeedling, IconUser, IconBook2 } from "@tabler/icons-react"

export interface FarmerContrastCardProps {
  readonly rec: FarmerContrastItem
  readonly index: number
}

export function FarmerContrastCard({ rec, index }: FarmerContrastCardProps) {
  const { t } = useLanguage()

  return (
    <div className="group relative flex flex-col justify-between rounded-sm bg-white border border-slate-200/70 hover:border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(16,185,129,0.06)] transition-all duration-300 overflow-hidden p-4">

      {/* Left bar accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#009640] group-hover:bg-emerald-500 transition-colors duration-300" />

      {/* Book icon watermark */}
      <div className="absolute -bottom-4 -right-4 z-0 text-[#009640]/[0.08] group-hover:text-[#009640]/[0.16] group-hover:-translate-y-1 transition-all duration-500 pointer-events-none">
        <IconBook2 size={120} stroke={1} />
      </div>

      {/* Header: index + year badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded shrink-0">
          #{index}
        </span>
        <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold border border-[#009640]/20">
          {rec.year}
        </span>
      </div>

      {/* Farmer name & code */}
      <div className="flex flex-col gap-0.5 mb-3 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <IconUser className="size-3.5 text-slate-400 shrink-0" stroke={1.8} />
          <h3 className="text-sm font-semibold text-slate-800 group-hover:text-[#009640] transition-colors truncate">
            {rec.name}
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono pl-5">{rec.mf_code}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold leading-none">
            {t.farmerContrast.saplingKg}
          </span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-sm font-bold text-slate-800 tabular-nums">
              {rec.tobac_num !== undefined && rec.tobac_num !== null
                ? rec.tobac_num.toLocaleString()
                : <span className="text-slate-300">—</span>}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 border-l border-slate-100 pl-3">
          <div className="flex items-center gap-1">
            <IconSeedling className="size-3 text-[#009640] shrink-0" stroke={1.8} />
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold leading-none">
              {t.farmerContrast.expectedYield}
            </span>
          </div>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className="text-sm font-bold text-[#009640] tabular-nums">
              {rec.expected_yield !== undefined && rec.expected_yield !== null
                ? rec.expected_yield.toLocaleString()
                : <span className="text-slate-300">—</span>}
            </span>
            {rec.expected_yield !== undefined && rec.expected_yield !== null && (
              <span className="text-[10px] font-medium text-slate-400 ml-0.5">kg</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
