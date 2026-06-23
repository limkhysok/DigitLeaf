"use client"

import { useState } from "react"
import Link from "next/link"
import {
  IconShoppingBag,
  IconReceiptRefund,
  IconChevronRight,
  IconCalendar,
  IconTrendingUp,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart } from "recharts"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
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
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient } from "@/services/api-client"
import type { PurchaseByBuyerItem, TrendPreset } from "@/types"

const KPI_SKELETON_KEYS = ["kpi-1", "kpi-2", "kpi-3", "kpi-4"] as const
const TREND_PRESETS = ["7d", "30d", "3m", "9m", "12m"] as const satisfies readonly TrendPreset[]
const BUYER_PIE_COLORS = ["#0ea5e9", "#d97706", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04", "#be185d"]

const toISODate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

type BuyerSlice = {
  key: number
  name: string
  value: number
  pct: number
  fill: string
}

function pieSliceLabel(props: unknown) {
  const pct = (props as { pct?: number }).pct
  return pct == null ? "" : `${pct.toFixed(0)}%`
}

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

function PurchaseByBuyerChart({
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
  if (isLoading || !items) {
    return <Skeleton className="h-75 w-full rounded-xl" />
  }

  const total = items.reduce((sum, item) => sum + item.vendor_count, 0)
  const colorFor = (index: number) => BUYER_PIE_COLORS[index % BUYER_PIE_COLORS.length] ?? BUYER_PIE_COLORS[0]!
  const chartConfig: ChartConfig = Object.fromEntries(
    items.map((item, index) => [item.buyer_name, { label: item.buyer_name, color: colorFor(index) }])
  )
  const chartData: BuyerSlice[] = items.map((item, index) => ({
    key: item.buyer_id,
    name: item.buyer_name,
    value: item.vendor_count,
    pct: total > 0 ? (item.vendor_count / total) * 100 : 0,
    fill: colorFor(index),
  }))

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
          />
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

export default function DashboardPage() {
  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, localizeNumber, localizeDateString } = useLanguage()
  const enabled = !!tokens?.access_token && !isAuthLoading

  const [preset, setPreset] = useState<TrendPreset>("7d")
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(undefined)
  const [rangeOpen, setRangeOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.getDashboardSummary(tokens!.access_token),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const hasCustomRange = preset === "custom" && !!customRange?.from && !!customRange?.to
  const trendQueryEnabled = enabled && (preset !== "custom" || hasCustomRange)

  const { data: trend, isLoading: isTrendLoading } = useQuery({
    queryKey: [
      "dashboard-purchase-trend",
      preset,
      hasCustomRange ? toISODate(customRange.from!) : null,
      hasCustomRange ? toISODate(customRange.to!) : null,
    ],
    queryFn: () =>
      apiClient.getPurchaseTrend(tokens!.access_token, {
        preset,
        startDate: hasCustomRange ? toISODate(customRange.from!) : undefined,
        endDate: hasCustomRange ? toISODate(customRange.to!) : undefined,
      }),
    enabled: trendQueryEnabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const { data: buyerStats, isLoading: isBuyerStatsLoading } = useQuery({
    queryKey: ["dashboard-purchase-by-buyer"],
    queryFn: () => apiClient.getPurchaseByBuyer(tokens!.access_token),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const fmtKg = (n: number) => localizeNumber(n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  const fmtRiel = (n: number) => `៛${localizeNumber(Math.round(n).toLocaleString())}`
  const fmtInt = (n: number) => localizeNumber(n.toLocaleString())
  const fmtPct = (n: number) => localizeNumber(Math.abs(n).toFixed(1))

  const chartConfig: ChartConfig = {
    net_weight_kg: {
      label: t.dashboard.trend.purchaseLabel,
      color: "var(--primary)",
    },
    repay_weight_kg: {
      label: t.dashboard.trend.repayLabel,
      color: "#d97706",
    },
  }

  const chartData =
    trend?.points.map((p) => ({
      ...p,
      label: trend.granularity === "monthly" ? p.date.slice(0, 7) : p.date.slice(5),
    })) ?? []

  const customRangeLabel =
    hasCustomRange && customRange?.from && customRange?.to
      ? `${localizeDateString(customRange.from.toLocaleDateString())} - ${localizeDateString(customRange.to.toLocaleDateString())}`
      : t.dashboard.trend.filters.custom

  const handleApplyCustomRange = () => {
    if (pendingRange?.from && pendingRange?.to) {
      setCustomRange(pendingRange)
      setPreset("custom")
      setRangeOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.dashboard.title}</h1>
        <p className="text-muted-foreground font-medium">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !data
          ? KPI_SKELETON_KEYS.map((key) => (
              <Card key={key} className="shadow-sm border-border/50">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-32" />
                </CardContent>
              </Card>
            ))
          : [
              <Link key="farmer-contracts" href="/farmer-contract" className="block group">
                <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="relative p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.dashboard.farmerContracts.title} ({data.farmer_contracts.year})
                    </p>
                    <Badge
                      variant="outline"
                      className={`absolute right-4 top-4 gap-1 ${
                        data.farmer_contracts.yoy_change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {data.farmer_contracts.yoy_change_pct >= 0 ? (
                        <IconArrowUp className="size-3" />
                      ) : (
                        <IconArrowDown className="size-3" />
                      )}
                      {fmtPct(data.farmer_contracts.yoy_change_pct)}%
                    </Badge>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums">
                      {fmtInt(data.farmer_contracts.count)} {t.dashboard.farmerContracts.count}
                    </span>
                    <div className="mt-3 flex items-center justify-between pt-3 text-sm font-medium">
                      <span
                        className={`flex items-center gap-1 ${
                          data.farmer_contracts.yoy_change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {data.farmer_contracts.yoy_change_pct >= 0 ? (
                          <IconArrowUp className="size-3.5" />
                        ) : (
                          <IconArrowDown className="size-3.5" />
                        )}
                        {data.farmer_contracts.yoy_change_pct >= 0
                          ? t.dashboard.farmerContracts.trendUp
                          : t.dashboard.farmerContracts.trendDown}{" "}
                        {fmtPct(data.farmer_contracts.yoy_change_pct)}% {t.dashboard.farmerContracts.thisYear}
                      </span>
                      <IconChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>,
              <Link key="sack-registration" href="/sack-registration" className="block group">
                <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="relative p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.dashboard.sackRegistration.title}
                    </p>
                    <Badge variant="outline" className="absolute right-4 top-4 gap-1 text-foreground">
                      <IconTrendingUp className="size-3" />+{fmtKg(data.sack_registration.sack_weight_kg.today)} kg
                    </Badge>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums">
                      {fmtKg(data.sack_registration.sack_weight_kg.total)} kg
                    </span>
                    <span
                      className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                        data.sack_registration.change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {data.sack_registration.change_pct >= 0 ? (
                        <IconArrowUp className="size-3" />
                      ) : (
                        <IconArrowDown className="size-3" />
                      )}
                      {data.sack_registration.change_pct >= 0
                        ? t.dashboard.sackRegistration.trendUp
                        : t.dashboard.sackRegistration.trendDown}{" "}
                      {fmtPct(data.sack_registration.change_pct)}% {t.dashboard.sackRegistration.vsYesterday}
                    </span>
                    <div className="mt-3 flex items-center justify-between pt-3 text-sm font-medium">
                      <span>
                        {t.dashboard.sackRegistration.today}: {fmtInt(data.sack_registration.registration_counts.today)}{" "}
                        {t.dashboard.sackRegistration.count}
                      </span>
                      <IconChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>,
              <Link key="today-purchases" href="/tobacco-purchase" className="block group">
                <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="relative p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.dashboard.todayPurchases.title}
                    </p>
                    <Badge variant="outline" className="absolute right-4 top-4 gap-1 text-foreground">
                      <IconShoppingBag className="size-3" />
                      {fmtInt(data.today_purchases.count)} {t.dashboard.todayPurchases.count}
                    </Badge>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums">
                      {fmtKg(data.today_purchases.net_weight_kg)} kg
                    </span>
                    <span
                      className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                        data.today_purchases.change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {data.today_purchases.change_pct >= 0 ? (
                        <IconArrowUp className="size-3" />
                      ) : (
                        <IconArrowDown className="size-3" />
                      )}
                      {data.today_purchases.change_pct >= 0
                        ? t.dashboard.todayPurchases.trendUp
                        : t.dashboard.todayPurchases.trendDown}{" "}
                      {fmtPct(data.today_purchases.change_pct)}% {t.dashboard.todayPurchases.vsYesterday}
                    </span>
                    <div className="mt-3 flex items-center justify-between pt-3 text-sm font-medium">
                      <span>
                        {t.dashboard.todayPurchases.value}: {fmtRiel(data.today_purchases.grand_total)}
                      </span>
                      <IconChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>,
              <Link key="outstanding-repay" href="/tobacco-repay" className="block group">
                <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="relative p-6">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t.dashboard.outstandingRepay.title} ({data.outstanding_repay.year})
                    </p>
                    <Badge variant="outline" className="absolute right-4 top-4 gap-1 text-foreground">
                      <IconReceiptRefund className="size-3" />
                      {t.dashboard.outstandingRepay.today}: {fmtPct(data.outstanding_repay.today_repay_pct)}%
                    </Badge>
                    <span className="mt-4 block text-2xl font-semibold tabular-nums">
                      {fmtKg(data.outstanding_repay.total_contracted)} kg
                    </span>
                    <span
                      className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                        data.outstanding_repay.repay_change_pct >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {data.outstanding_repay.repay_change_pct >= 0 ? (
                        <IconArrowUp className="size-3" />
                      ) : (
                        <IconArrowDown className="size-3" />
                      )}
                      {data.outstanding_repay.repay_change_pct >= 0
                        ? t.dashboard.outstandingRepay.trendUp
                        : t.dashboard.outstandingRepay.trendDown}{" "}
                      {fmtPct(data.outstanding_repay.repay_change_pct)}% {t.dashboard.outstandingRepay.vsYesterday}
                    </span>
                    <div className="mt-3 flex items-center justify-between pt-3 text-sm font-medium">
                      <span>
                        {t.dashboard.outstandingRepay.repaid}: {fmtKg(data.outstanding_repay.total_repaid)} kg
                      </span>
                      <IconChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>,
            ]}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{t.dashboard.trend.title}</CardTitle>
              <CardDescription>{t.dashboard.trend.subtitle}</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={preset === "custom" ? "" : preset}
                onValueChange={(v) => setPreset(v as TrendPreset)}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder={t.dashboard.trend.filters.last7Days} />
                </SelectTrigger>
                <SelectContent>
                  {TREND_PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {
                        {
                          "7d": t.dashboard.trend.filters.last7Days,
                          "30d": t.dashboard.trend.filters.last30Days,
                          "3m": t.dashboard.trend.filters.last3Months,
                          "9m": t.dashboard.trend.filters.last9Months,
                          "12m": t.dashboard.trend.filters.last12Months,
                        }[p]
                      }
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
                  <Button
                    variant={preset === "custom" ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
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
                    <Button
                      size="sm"
                      onClick={handleApplyCustomRange}
                      disabled={!pendingRange?.from || !pendingRange?.to}
                    >
                      {t.dashboard.trend.filters.apply}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {isTrendLoading || !trend ? (
              <Skeleton className="h-75 w-full rounded-xl" />
            ) : (
              <ChartContainer config={chartConfig} className="h-75 w-full">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="net_weight_kg" fill="var(--color-net_weight_kg)" radius={4} />
                  <Bar dataKey="repay_weight_kg" fill="var(--color-repay_weight_kg)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t.dashboard.purchaseByBuyer.title}</CardTitle>
            <CardDescription>{t.dashboard.purchaseByBuyer.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseByBuyerChart
              items={buyerStats?.items}
              isLoading={isBuyerStatsLoading}
              vendorLabel={t.dashboard.purchaseByBuyer.vendorLabel}
              noDataLabel={t.dashboard.purchaseByBuyer.noData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
