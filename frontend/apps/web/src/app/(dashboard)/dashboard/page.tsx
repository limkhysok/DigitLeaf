"use client"

import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { type ChartConfig } from "@workspace/ui/components/chart"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient } from "@/services/api-client"
import type { TrendPreset } from "@/types"
import { KpiCards } from "./_components/kpi-cards"
import { TrendChartCard } from "./_components/trend-chart-card"
import { PurchaseByBuyerChart } from "./_components/purchase-by-buyer-chart"
import { PurchaseByTobaccoTypeChart } from "./_components/purchase-by-tobacco-type-chart"
import { RepayByTobaccoTypeChart } from "./_components/repay-by-tobacco-type-chart"
import { toISODate } from "./_components/utils"
import type { Fmt } from "./_components/types"

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

  const { data: tobaccoTypeStats, isLoading: isTobaccoTypeStatsLoading } = useQuery({
    queryKey: ["dashboard-purchase-by-tobacco-type"],
    queryFn: () => apiClient.getPurchaseByTobaccoType(tokens!.access_token),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const { data: repayTobaccoTypeStats, isLoading: isRepayTobaccoTypeStatsLoading } = useQuery({
    queryKey: ["dashboard-repay-by-tobacco-type"],
    queryFn: () => apiClient.getRepayByTobaccoType(tokens!.access_token),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const fmtKg: Fmt = (n) => localizeNumber(n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  const fmtRiel: Fmt = (n) => `៛${localizeNumber(Math.round(n).toLocaleString())}`
  const fmtInt: Fmt = (n) => localizeNumber(n.toLocaleString())
  const fmtPct: Fmt = (n) => localizeNumber(Math.abs(n).toFixed(1))

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
        <KpiCards data={data} isLoading={isLoading} t={t} fmtKg={fmtKg} fmtRiel={fmtRiel} fmtInt={fmtInt} fmtPct={fmtPct} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrendChartCard
          t={t}
          preset={preset}
          setPreset={setPreset}
          customRange={customRange}
          pendingRange={pendingRange}
          setPendingRange={setPendingRange}
          rangeOpen={rangeOpen}
          setRangeOpen={setRangeOpen}
          customRangeLabel={customRangeLabel}
          onApplyCustomRange={handleApplyCustomRange}
          chartConfig={chartConfig}
          chartData={chartData}
          isTrendLoading={isTrendLoading}
          hasTrend={!!trend}
        />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold whitespace-nowrap">{t.dashboard.purchaseByTobaccoType.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseByTobaccoTypeChart
              items={tobaccoTypeStats?.items}
              isLoading={isTobaccoTypeStatsLoading}
              weightLabel={t.dashboard.purchaseByTobaccoType.weightLabel}
              noDataLabel={t.dashboard.purchaseByTobaccoType.noData}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold whitespace-nowrap">
              {t.dashboard.repayByTobaccoType.title}
              {repayTobaccoTypeStats ? ` (${repayTobaccoTypeStats.year})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RepayByTobaccoTypeChart
              items={repayTobaccoTypeStats?.items}
              isLoading={isRepayTobaccoTypeStatsLoading}
              weightLabel={t.dashboard.repayByTobaccoType.weightLabel}
              noDataLabel={t.dashboard.repayByTobaccoType.noData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
