export const KPI_SKELETON_KEYS = ["kpi-1", "kpi-2", "kpi-3", "kpi-4"] as const
export const BUYER_PIE_COLORS = ["#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"]

export type Fmt = (n: number) => string

export type Formatters = {
  fmtKg: Fmt
  fmtRiel: Fmt
  fmtInt: Fmt
  fmtPct: Fmt
}

export type BuyerSlice = {
  key: number
  name: string
  value: number
  pct: number
  fill: string
}
