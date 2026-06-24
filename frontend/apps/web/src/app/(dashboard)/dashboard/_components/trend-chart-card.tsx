import { IconCalendar } from "@tabler/icons-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import type { PurchaseTrendPoint, TrendPreset } from "@/types"
import type { TranslationType } from "@/utils/dictionary"
import { trendPresetLabel } from "./utils"

export const TREND_PRESETS = ["7d", "30d", "3m", "9m", "12m"] as const satisfies readonly TrendPreset[]

export function TrendChartCard({
  t,
  preset,
  setPreset,
  customRange,
  pendingRange,
  setPendingRange,
  rangeOpen,
  setRangeOpen,
  customRangeLabel,
  onApplyCustomRange,
  chartConfig,
  chartData,
  isTrendLoading,
  hasTrend,
}: Readonly<{
  t: TranslationType
  preset: TrendPreset
  setPreset: (p: TrendPreset) => void
  customRange: DateRange | undefined
  pendingRange: DateRange | undefined
  setPendingRange: (r: DateRange | undefined) => void
  rangeOpen: boolean
  setRangeOpen: (open: boolean) => void
  customRangeLabel: string
  onApplyCustomRange: () => void
  chartConfig: ChartConfig
  chartData: Array<PurchaseTrendPoint & { label: string }>
  isTrendLoading: boolean
  hasTrend: boolean
}>) {
  return (
    <Card className="lg:col-span-2 shadow-sm border-border/50">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">{t.dashboard.trend.title}</CardTitle>
          <CardDescription>{t.dashboard.trend.subtitle}</CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={preset === "custom" ? "" : preset} onValueChange={(v) => setPreset(v as TrendPreset)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder={t.dashboard.trend.filters.last7Days} />
            </SelectTrigger>
            <SelectContent>
              {TREND_PRESETS.map((p) => (
                <SelectItem key={p} value={p}>
                  {trendPresetLabel(p, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover
            open={rangeOpen}
            onOpenChange={(open) => {
              setRangeOpen(open)
              if (open) setPendingRange(customRange)
            }}
          >
            <PopoverTrigger asChild>
              <Button variant={preset === "custom" ? "default" : "outline"} size="sm" className="h-8 text-xs gap-1.5">
                <IconCalendar className="size-3.5" />
                {customRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={pendingRange}
                onSelect={setPendingRange}
                defaultMonth={pendingRange?.from ?? customRange?.from}
              />
              <div className="flex justify-end gap-2 p-3">
                <Button size="sm" variant="ghost" onClick={() => setRangeOpen(false)}>
                  {t.common.cancel}
                </Button>
                <Button size="sm" onClick={onApplyCustomRange} disabled={!pendingRange?.from || !pendingRange?.to}>
                  {t.dashboard.trend.filters.apply}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {isTrendLoading || !hasTrend ? (
          <Skeleton className="h-75 w-full rounded-xl" />
        ) : (
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fill-net_weight_kg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-net_weight_kg)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-net_weight_kg)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fill-repay_weight_kg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-repay_weight_kg)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-repay_weight_kg)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="net_weight_kg"
                type="monotone"
                stroke="var(--color-net_weight_kg)"
                strokeWidth={2}
                fill="url(#fill-net_weight_kg)"
                dot={false}
              />
              <Area
                dataKey="repay_weight_kg"
                type="monotone"
                stroke="var(--color-repay_weight_kg)"
                strokeWidth={2}
                fill="url(#fill-repay_weight_kg)"
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
