import type { ReactNode } from "react"
import Link from "next/link"
import { IconChevronRight, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import type { DashboardSummary } from "@/types"
import type { TranslationType } from "@/utils/dictionary"
import { KPI_SKELETON_KEYS, type Fmt, type Formatters } from "./types"
import { farmerStatusLabel } from "./utils"

function TrendIcon({ positive }: Readonly<{ positive: boolean }>) {
  return positive ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />
}

function KpiChangeBadge({ positive, children }: Readonly<{ positive: boolean; children: ReactNode }>) {
  return (
    <Badge variant="outline" className="absolute right-4 top-4 gap-1 text-foreground">
      <TrendIcon positive={positive} />
      {children}
    </Badge>
  )
}

function KpiChangeText({
  pct,
  upLabel,
  downLabel,
  suffixLabel,
  fmtPct,
}: Readonly<{
  pct: number
  upLabel: string
  downLabel: string
  suffixLabel: string
  fmtPct: Fmt
}>) {
  const positive = pct >= 0
  return (
    <span
      className={`mt-1 flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-600"}`}
    >
      <TrendIcon positive={positive} />
      {positive ? upLabel : downLabel}{" "}
      {fmtPct(pct)}% {suffixLabel}
    </span>
  )
}

function KpiCardFooter({ label }: Readonly<{ label: string }>) {
  return (
    <div className="mt-3 flex items-center justify-between pt-3 text-sm font-medium">
      <span>{label}</span>
      <IconChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </div>
  )
}

function FarmerContractsCard({
  data,
  t,
  fmtInt,
  fmtPct,
}: Readonly<{ data: DashboardSummary; t: TranslationType; fmtInt: Fmt; fmtPct: Fmt }>) {
  const pct = data.farmer_contracts.yoy_change_pct
  return (
    <Link href="/farmer-contract" className="block group">
      <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
        <CardContent className="relative p-6">
          <p className="text-sm font-medium text-muted-foreground">
            {t.dashboard.farmerContracts.title} ({data.farmer_contracts.year})
          </p>
          <KpiChangeBadge positive={pct >= 0}>{fmtPct(pct)}%</KpiChangeBadge>
          <span className="mt-4 block text-2xl font-semibold tabular-nums">
            {fmtInt(data.farmer_contracts.count)} {t.dashboard.farmerContracts.count}
          </span>
          <KpiChangeText
            pct={pct}
            upLabel={t.dashboard.farmerContracts.trendUp}
            downLabel={t.dashboard.farmerContracts.trendDown}
            suffixLabel={t.dashboard.farmerContracts.thisYear}
            fmtPct={fmtPct}
          />
          <KpiCardFooter label={farmerStatusLabel(pct, t)} />
        </CardContent>
      </Card>
    </Link>
  )
}

function SackRegistrationCard({
  data,
  t,
  fmtKg,
  fmtInt,
  fmtPct,
}: Readonly<{ data: DashboardSummary; t: TranslationType; fmtKg: Fmt; fmtInt: Fmt; fmtPct: Fmt }>) {
  const pct = data.sack_registration.change_pct
  return (
    <Link href="/sack-registration" className="block group">
      <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
        <CardContent className="relative p-6">
          <p className="text-sm font-medium text-muted-foreground">{t.dashboard.sackRegistration.title}</p>
          <Badge variant="outline" className="absolute right-4 top-4 gap-1 text-foreground">
            <IconTrendingUp className="size-3" />+{fmtKg(data.sack_registration.sack_weight_kg.today)} kg
          </Badge>
          <span className="mt-4 block text-2xl font-semibold tabular-nums">
            {fmtKg(data.sack_registration.sack_weight_kg.total)} kg
          </span>
          <KpiChangeText
            pct={pct}
            upLabel={t.dashboard.sackRegistration.trendUp}
            downLabel={t.dashboard.sackRegistration.trendDown}
            suffixLabel={t.dashboard.sackRegistration.vsYesterday}
            fmtPct={fmtPct}
          />
          <KpiCardFooter
            label={`${t.dashboard.sackRegistration.today}: ${fmtInt(data.sack_registration.registration_counts.today)} ${t.dashboard.sackRegistration.count}`}
          />
        </CardContent>
      </Card>
    </Link>
  )
}

function TodayPurchasesCard({
  data,
  t,
  fmtKg,
  fmtRiel,
  fmtInt,
  fmtPct,
}: Readonly<{ data: DashboardSummary; t: TranslationType; fmtKg: Fmt; fmtRiel: Fmt; fmtInt: Fmt; fmtPct: Fmt }>) {
  const pct = data.today_purchases.change_pct
  return (
    <Link href="/tobacco-purchase" className="block group">
      <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
        <CardContent className="relative p-6">
          <p className="text-sm font-medium text-muted-foreground">{t.dashboard.todayPurchases.title}</p>
          <KpiChangeBadge positive={pct >= 0}>
            {fmtInt(data.today_purchases.count)} {t.dashboard.todayPurchases.count}
          </KpiChangeBadge>
          <span className="mt-4 block text-2xl font-semibold tabular-nums">
            {fmtKg(data.today_purchases.net_weight_kg)} kg
          </span>
          <KpiChangeText
            pct={pct}
            upLabel={t.dashboard.todayPurchases.trendUp}
            downLabel={t.dashboard.todayPurchases.trendDown}
            suffixLabel={t.dashboard.todayPurchases.vsYesterday}
            fmtPct={fmtPct}
          />
          <KpiCardFooter label={`${t.dashboard.todayPurchases.value}: ${fmtRiel(data.today_purchases.grand_total)}`} />
        </CardContent>
      </Card>
    </Link>
  )
}

function OutstandingRepayCard({
  data,
  t,
  fmtKg,
  fmtPct,
}: Readonly<{ data: DashboardSummary; t: TranslationType; fmtKg: Fmt; fmtPct: Fmt }>) {
  const pct = data.outstanding_repay.repay_change_pct
  return (
    <Link href="/tobacco-repay" className="block group">
      <Card className="h-full shadow-sm border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
        <CardContent className="relative p-6">
          <p className="text-sm font-medium text-muted-foreground">
            {t.dashboard.outstandingRepay.title} ({data.outstanding_repay.year})
          </p>
          <KpiChangeBadge positive={pct >= 0}>
            {t.dashboard.outstandingRepay.today}: {fmtPct(data.outstanding_repay.today_repay_pct)}%
          </KpiChangeBadge>
          <span className="mt-4 block text-2xl font-semibold tabular-nums">
            {fmtKg(data.outstanding_repay.total_contracted)} kg
          </span>
          <KpiChangeText
            pct={pct}
            upLabel={t.dashboard.outstandingRepay.trendUp}
            downLabel={t.dashboard.outstandingRepay.trendDown}
            suffixLabel={t.dashboard.outstandingRepay.vsYesterday}
            fmtPct={fmtPct}
          />
          <KpiCardFooter
            label={`${t.dashboard.outstandingRepay.repaid}: ${fmtKg(data.outstanding_repay.total_repaid)} kg`}
          />
        </CardContent>
      </Card>
    </Link>
  )
}

function KpiCardsSkeleton() {
  return (
    <>
      {KPI_SKELETON_KEYS.map((key) => (
        <Card key={key} className="shadow-sm border-border/50">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

export function KpiCards({
  data,
  isLoading,
  t,
  fmtKg,
  fmtRiel,
  fmtInt,
  fmtPct,
}: Readonly<{ data: DashboardSummary | undefined; isLoading: boolean; t: TranslationType } & Formatters>) {
  if (isLoading || !data) {
    return <KpiCardsSkeleton />
  }

  return (
    <>
      <FarmerContractsCard data={data} t={t} fmtInt={fmtInt} fmtPct={fmtPct} />
      <SackRegistrationCard data={data} t={t} fmtKg={fmtKg} fmtInt={fmtInt} fmtPct={fmtPct} />
      <TodayPurchasesCard data={data} t={t} fmtKg={fmtKg} fmtRiel={fmtRiel} fmtInt={fmtInt} fmtPct={fmtPct} />
      <OutstandingRepayCard data={data} t={t} fmtKg={fmtKg} fmtPct={fmtPct} />
    </>
  )
}
