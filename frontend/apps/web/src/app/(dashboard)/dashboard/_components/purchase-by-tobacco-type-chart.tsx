import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@workspace/ui/components/chart"
import type { PurchaseByTobaccoTypeItem } from "@/types"
import type { Fmt } from "./types"

export function PurchaseByTobaccoTypeChart({
  items,
  isLoading,
  weightLabel,
  totalLabel,
  noDataLabel,
  fmtKg,
}: Readonly<{
  items: PurchaseByTobaccoTypeItem[] | undefined
  isLoading: boolean
  weightLabel: string
  totalLabel: string
  noDataLabel: string
  fmtKg: Fmt
}>) {
  const chartConfig: ChartConfig = useMemo(
    () => ({
      weight_kg: {
        label: weightLabel,
        color: "var(--primary)",
      },
    }),
    [weightLabel]
  )

  const chartData = useMemo(
    () => (items ?? []).map((item) => ({ name: item.tobacco_name, weight_kg: item.weight_kg })),
    [items]
  )

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.weight_kg, 0), [chartData])

  // Each category band needs enough height for its tick label, or the topmost
  // label's text can poke above the chart's plot area and get clipped — embedded
  // <svg> elements are `overflow: hidden` by default, unlike the HTML tooltip.
  const chartHeight = Math.max(240, chartData.length * 32 + 24)

  // recharts' YAxis width only accepts a pixel number, so to keep the name column a
  // proportion of the card's actual rendered width (responsive across breakpoints),
  // we measure the chart container and recompute the pixel width from a percentage.
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setContainerWidth(width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const yAxisWidth = containerWidth > 0 ? Math.round(containerWidth * 0.3) : 110

  if (isLoading || !items) {
    return <Skeleton className="h-75 w-full rounded-xl" />
  }

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{noDataLabel}</p>
  }

  return (
    <>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{fmtKg(total)} kg</span>
        <span className="text-sm text-muted-foreground">{totalLabel}</span>
      </div>
      <div ref={containerRef} className="w-full">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 16, right: 4, bottom: 8, left: 8 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={yAxisWidth} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="weight_kg" fill="var(--color-weight_kg)" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    </>
  )
}
