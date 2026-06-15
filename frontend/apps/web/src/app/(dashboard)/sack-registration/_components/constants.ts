"use client"

import { format, subDays } from "date-fns"
import { SackRegistrationListParams } from "@/services/api-client"

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


export function buildFetchParams(
  page: number,
  search: string,
  datePreset: string,
  sortSackInKg: string | null = null,
  limit: number = 20
): SackRegistrationListParams {
  const params: SackRegistrationListParams = { page, limit }
  if (search.trim()) params.search = search.trim()
  if (sortSackInKg) params.sort_sack_in_kg = sortSackInKg
  return { ...params, ...getDateRange(datePreset) }
}
