import { useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@workspace/ui/components/chart"
import type { PurchaseByTobaccoTypeItem } from "@/types"
import type { Fmt } from "./types"

let measureCanvas: HTMLCanvasElement | null = null

function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 7
  measureCanvas ??= document.createElement("canvas")
  const ctx = measureCanvas.getContext("2d")
  if (!ctx) return text.length * 7
  ctx.font = font
  return ctx.measureText(text).width
}

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

  // Each category band needs enough height for its tick label and a substantial
  // bar (not a squashed sliver), or the topmost label's text can poke above the
  // chart's plot area and get clipped — embedded <svg> elements are `overflow:
  // hidden` by default, unlike the HTML tooltip.
  const chartHeight = Math.max(260, chartData.length * 30 + 22)

  // recharts' YAxis width only accepts a pixel number, so to keep the name column
  // responsive we measure the chart's rendered width via ResizeObserver, then size
  // the column to fit the longest label (measured with canvas) instead of a flat
  // percentage — a flat percentage either wastes space or wraps long labels onto a
  // second line, which recharts' tick text does automatically when it's too narrow.
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [tickFont, setTickFont] = useState("12px sans-serif")

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setTickFont(`12px ${getComputedStyle(el).fontFamily}`)
    // Debounced so the sidebar's width-transition doesn't trigger a full chart
    // re-layout on every intermediate frame, only once the resize settles.
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (!width) return
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setContainerWidth(width), 150)
    })
    observer.observe(el)
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  const longestLabelWidth = useMemo(
    () => chartData.reduce((max, item) => Math.max(max, measureTextWidth(item.name, tickFont)), 0),
    [chartData, tickFont]
  )

  const yAxisWidth =
    containerWidth > 0
      ? Math.min(Math.round(containerWidth * 0.6), Math.max(80, Math.round(longestLabelWidth) + 16))
      : 120

  if (isLoading || !items) {
    return <Skeleton className="h-75 w-full rounded-xl" />
  }

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{noDataLabel}</p>
  }

  return (
    <>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-xl font-semibold">{fmtKg(total)} kg</span>
        <span className="text-sm text-muted-foreground">{totalLabel}</span>
      </div>
      <div ref={containerRef} className="w-full">
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 16, right: 4, bottom: 8, left: 8 }}
            barCategoryGap="30%"
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={8} width={yAxisWidth} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="weight_kg" fill="var(--color-weight_kg)" radius={4} barSize={24} />
          </BarChart>
        </ChartContainer>
      </div>
    </>
  )
}
