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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
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
import { apiClient, RecentActivityItem } from "@/services/api-client"
import type { TrendPreset } from "@/types"

const KPI_SKELETON_KEYS = ["kpi-1", "kpi-2", "kpi-3", "kpi-4"] as const
const ACTIVITY_SKELETON_KEYS = ["activity-1", "activity-2", "activity-3", "activity-4"] as const
const TREND_PRESETS = ["7d", "30d", "3m", "9m", "12m"] as const satisfies readonly TrendPreset[]

const toISODate = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
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

  const { data: activity, isLoading: isActivityLoading } = useQuery({
    queryKey: ["dashboard-recent-activity"],
    queryFn: () => apiClient.getRecentActivity(tokens!.access_token, 10),
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

  const activityLabel = (item: RecentActivityItem) =>
    item.type === "purchase" ? t.dashboard.activity.purchase : t.dashboard.activity.repay

  let activityContent: React.ReactNode
  if (isActivityLoading || !activity) {
    activityContent = (
      <div className="space-y-6">
        {ACTIVITY_SKELETON_KEYS.map((key) => (
          <div key={key} className="flex gap-3">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  } else if (activity.items.length === 0) {
    activityContent = <p className="text-sm text-muted-foreground text-center py-8">{t.dashboard.activity.noActivity}</p>
  } else {
    activityContent = (
      <ScrollArea className="h-75">
        <div className="space-y-5 pr-3">
          {activity.items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback
                  className={item.type === "purchase" ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-600"}
                >
                  {item.type === "purchase" ? <IconShoppingBag className="size-4" /> : <IconReceiptRefund className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {activityLabel(item)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.reference} &middot; {fmtKg(item.qty_kg)} kg
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {localizeDateString(new Date(item.date).toLocaleString())}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
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
            <CardTitle className="text-lg font-semibold">{t.dashboard.activity.title}</CardTitle>
            <CardDescription>{t.dashboard.activity.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>{activityContent}</CardContent>
        </Card>
      </div>
    </div>
  )
}
