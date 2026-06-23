"use client"

import Link from "next/link"
import {
  IconPackage,
  IconShoppingBag,
  IconReceiptRefund,
  IconFileDescription,
  IconChevronRight,
} from "@tabler/icons-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, RecentActivityItem } from "@/services/api-client"

const KPI_SKELETON_KEYS = ["kpi-1", "kpi-2", "kpi-3", "kpi-4"] as const
const ACTIVITY_SKELETON_KEYS = ["activity-1", "activity-2", "activity-3", "activity-4"] as const

export default function DashboardPage() {
  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, localizeNumber, localizeDateString } = useLanguage()
  const enabled = !!tokens?.access_token && !isAuthLoading

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiClient.getDashboardSummary(tokens!.access_token),
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const { data: trend, isLoading: isTrendLoading } = useQuery({
    queryKey: ["dashboard-purchase-trend"],
    queryFn: () => apiClient.getPurchaseTrend(tokens!.access_token, 30),
    enabled,
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

  const cards = data
    ? [
        {
          title: t.dashboard.todayPurchases.title,
          href: "/tobacco-purchase",
          icon: IconShoppingBag,
          color: "text-primary",
          bg: "bg-primary/10",
          rows: [
            { label: t.dashboard.todayPurchases.weight, value: `${fmtKg(data.today_purchases.net_weight_kg)} kg` },
            { label: t.dashboard.todayPurchases.value, value: fmtRiel(data.today_purchases.grand_total) },
            { label: t.dashboard.todayPurchases.count, value: fmtInt(data.today_purchases.count) },
          ],
        },
        {
          title: t.dashboard.sackRegistration.title,
          href: "/sack-registration",
          icon: IconPackage,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          rows: [
            { label: t.dashboard.sackRegistration.total, value: `${fmtKg(data.sack_registration.sack_weight_kg.total)} kg` },
            { label: t.dashboard.sackRegistration.today, value: `${fmtKg(data.sack_registration.sack_weight_kg.today)} kg` },
          ],
        },
        {
          title: t.dashboard.outstandingRepay.title,
          href: "/tobacco-repay",
          icon: IconReceiptRefund,
          color: "text-amber-600",
          bg: "bg-amber-50",
          rows: [
            { label: t.dashboard.outstandingRepay.contracted, value: `${fmtKg(data.outstanding_repay.total_contracted)} kg` },
            { label: t.dashboard.outstandingRepay.repaid, value: `${fmtKg(data.outstanding_repay.total_repaid)} kg` },
            { label: t.dashboard.outstandingRepay.outstanding, value: `${fmtKg(data.outstanding_repay.outstanding)} kg` },
          ],
        },
        {
          title: `${t.dashboard.farmerContracts.title} (${data.farmer_contracts.year})`,
          href: "/farmer-contract",
          icon: IconFileDescription,
          color: "text-blue-600",
          bg: "bg-blue-50",
          rows: [
            { label: t.dashboard.farmerContracts.land, value: `${fmtKg(data.farmer_contracts.total_land)} ha` },
            { label: t.dashboard.farmerContracts.plants, value: fmtInt(data.farmer_contracts.total_tobac_num) },
          ],
        },
      ]
    : []

  const chartConfig: ChartConfig = {
    net_weight_kg: {
      label: t.dashboard.trend.weightLabel,
      color: "var(--primary)",
    },
  }

  const chartData = trend?.points.map((p) => ({ ...p, label: p.date.slice(5) })) ?? []

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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          : cards.map((card) => (
              <Link key={card.title} href={card.href} className="block group">
                <Card className="shadow-sm border-border/50 h-full hover:border-primary/20 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={card.bg + " p-2.5 rounded-lg w-fit"}>
                        <card.icon className={card.color + " size-5"} stroke={2} />
                      </div>
                      <IconChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.title}</p>
                      {card.rows.map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between gap-2">
                          <span className="text-xs text-muted-foreground">{row.label}</span>
                          <span className="text-sm font-bold tracking-tight">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t.dashboard.trend.title}</CardTitle>
            <CardDescription>{t.dashboard.trend.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {isTrendLoading || !trend ? (
              <Skeleton className="h-75 w-full rounded-xl" />
            ) : (
              <ChartContainer config={chartConfig} className="h-75 w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                  <ChartTooltip content={<ChartTooltipContent labelKey="net_weight_kg" />} />
                  <Line
                    dataKey="net_weight_kg"
                    type="monotone"
                    stroke="var(--color-net_weight_kg)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">{t.dashboard.activity.title}</CardTitle>
            <CardDescription>{t.dashboard.activity.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>{activityContent}</CardContent>
        </Card>
      </div>
    </div>
  )
}
