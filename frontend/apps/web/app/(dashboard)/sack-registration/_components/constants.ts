"use client"

import { format, subDays } from "date-fns"
import { RepresentItem, SackRegistrationListParams } from "@/lib/api-client"

export const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
  1: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  2: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200" },
}

export const STATUS_FILTER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: 0 },
  { label: "Approved", value: 1 },
  { label: "Rejected", value: 2 },
]

export const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Last 30 Days", value: "last30" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "12 Months", value: "12m" },
  { label: "All", value: "all" },
]


export function getDateRange(preset: string): { date_from?: string; date_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, "yyyy-MM-dd")
  switch (preset) {
    case "today": return { date_from: fmt(today), date_to: fmt(today) }
    case "week": return { date_from: fmt(subDays(today, 6)), date_to: fmt(today) }
    case "last30": return { date_from: fmt(subDays(today, 29)), date_to: fmt(today) }
    case "3m": return { date_from: fmt(subDays(today, 89)), date_to: fmt(today) }
    case "6m": return { date_from: fmt(subDays(today, 179)), date_to: fmt(today) }
    case "12m": return { date_from: fmt(subDays(today, 364)), date_to: fmt(today) }
    default: return {}
  }
}

export function filterRepresents(represents: readonly RepresentItem[], query: string): readonly RepresentItem[] {
  if (!query.trim()) return represents
  const q = query.toLowerCase()
  return represents.filter((r) => r.represent_name.toLowerCase().includes(q))
}

export function buildFetchParams(
  skip: number,
  search: string,
  statusFilter: number | null,
  datePreset: string
): SackRegistrationListParams {
  const params: SackRegistrationListParams = { skip, limit: 200 }
  if (search.trim()) params.search = search.trim()
  if (statusFilter !== null) params.status = statusFilter
  return { ...params, ...getDateRange(datePreset) }
}

