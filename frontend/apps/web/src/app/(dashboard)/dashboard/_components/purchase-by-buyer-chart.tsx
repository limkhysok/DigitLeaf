import { useCallback, useMemo } from "react"
import { Label, Pie, PieChart } from "recharts"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@workspace/ui/components/chart"
import type { PurchaseByBuyerItem } from "@/types"
import { BUYER_PIE_COLORS, type BuyerSlice } from "./types"
import { pieSliceLabel } from "./utils"

function BuyerTooltip({
  active,
  payload,
  vendorLabel,
}: Readonly<{
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: BuyerSlice }>
  vendorLabel: string
}>) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct = item?.payload?.pct

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs/relaxed shadow-xl">
      <div className="flex w-full items-center gap-2">
        <div className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: item?.color }} />
        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
          <span className="text-muted-foreground">{item?.name}</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {item?.value} {vendorLabel}
            {pct == null ? "" : ` (${pct.toFixed(1)}%)`}
          </span>
        </div>
      </div>
    </div>
  )
}

function BuyerPieCenterLabel({
  viewBox,
  total,
  vendorLabel,
}: Readonly<{
  viewBox?: object
  total: number
  vendorLabel: string
}>) {
  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
  const { cx, cy } = viewBox as { cx?: number; cy?: number }
  if (cx == null || cy == null) return null
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} y={cy} className="fill-foreground text-2xl font-bold">
        {total.toLocaleString()}
      </tspan>
      <tspan x={cx} y={cy + 20} className="fill-muted-foreground text-xs">
        {vendorLabel}
      </tspan>
    </text>
  )
}

export function PurchaseByBuyerChart({
  items,
  isLoading,
  vendorLabel,
  noDataLabel,
}: Readonly<{
  items: PurchaseByBuyerItem[] | undefined
  isLoading: boolean
  vendorLabel: string
  noDataLabel: string
}>) {
  const colorFor = (index: number) => BUYER_PIE_COLORS[index % BUYER_PIE_COLORS.length] ?? BUYER_PIE_COLORS[0]!

  const chartConfig: ChartConfig = useMemo(
    () => Object.fromEntries((items ?? []).map((item, index) => [item.buyer_name, { label: item.buyer_name, color: colorFor(index) }])),
    [items]
  )
  const total = useMemo(() => (items ?? []).reduce((sum, item) => sum + item.vendor_count, 0), [items])
  const chartData: BuyerSlice[] = useMemo(
    () =>
      (items ?? []).map((item, index) => ({
        key: item.buyer_id,
        name: item.buyer_name,
        value: item.vendor_count,
        pct: total > 0 ? (item.vendor_count / total) * 100 : 0,
        fill: colorFor(index),
      })),
    [items, total]
  )
  const renderCenterLabel = useCallback(
    (props: { viewBox?: object }) => (
      <BuyerPieCenterLabel viewBox={props.viewBox} total={total} vendorLabel={vendorLabel} />
    ),
    [total, vendorLabel]
  )

  if (isLoading || !items) {
    return <Skeleton className="h-75 w-full rounded-xl" />
  }

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{noDataLabel}</p>
  }

  return (
    <>
      <ChartContainer config={chartConfig} className="h-75 w-full">
        <PieChart>
          <ChartTooltip content={<BuyerTooltip vendorLabel={vendorLabel} />} />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            strokeWidth={2}
            labelLine={false}
            label={pieSliceLabel}
          >
            <Label content={renderCenterLabel} />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
        {chartData.map((entry) => (
          <div key={entry.key} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </>
  )
}
