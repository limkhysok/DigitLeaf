import type { TrendPreset } from "@/types"
import type { TranslationType } from "@/utils/dictionary"

export const toISODate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function farmerStatusLabel(pct: number, t: TranslationType): string {
  if (pct < 0) return t.dashboard.farmerContracts.actionRequired
  if (pct >= 5) return t.dashboard.farmerContracts.goodPerformance
  return ""
}

export function trendPresetLabel(preset: TrendPreset, t: TranslationType): string {
  const labels: Record<string, string> = {
    "7d": t.dashboard.trend.filters.last7Days,
    "30d": t.dashboard.trend.filters.last30Days,
    "3m": t.dashboard.trend.filters.last3Months,
    "9m": t.dashboard.trend.filters.last9Months,
    "12m": t.dashboard.trend.filters.last12Months,
  }
  return labels[preset] ?? ""
}

export function pieSliceLabel(props: unknown) {
  const pct = (props as { pct?: number }).pct
  return pct == null ? "" : `${pct.toFixed(0)}%`
}

let measureCanvas: HTMLCanvasElement | null = null

export function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 7
  measureCanvas ??= document.createElement("canvas")
  const ctx = measureCanvas.getContext("2d")
  if (!ctx) return text.length * 7
  ctx.font = font
  return ctx.measureText(text).width
}
