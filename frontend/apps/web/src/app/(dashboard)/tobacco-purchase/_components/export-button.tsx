"use client"

import * as React from "react"
import { IconDownload, IconLoader2, IconCalendar } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Label } from "@workspace/ui/components/label"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { apiClient } from "@/services/api-client"
import type { PurchaserItem } from "@/services/api-client"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { format, subDays, subMonths, subYears } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"

type DatePreset = "today" | "7d" | "30d" | "3m" | "6m" | "1y" | "custom"

const PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "1y": "Last year",
  custom: "Custom range",
}

function toLocalYMD(d: Date) {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().split("T")[0] ?? ""
}

function presetToRange(preset: DatePreset, today: Date): { from: Date; to: Date } | null {
  switch (preset) {
    case "today": return { from: today, to: today }
    case "7d": return { from: subDays(today, 7), to: today }
    case "30d": return { from: subDays(today, 30), to: today }
    case "3m": return { from: subMonths(today, 3), to: today }
    case "6m": return { from: subMonths(today, 6), to: today }
    case "1y": return { from: subYears(today, 1), to: today }
    default: return null
  }
}

interface ExportButtonProps {
  purchasers: PurchaserItem[]
}

export function ExportButton({ purchasers }: Readonly<ExportButtonProps>) {
  const { tokens } = useAuth()
  const accessToken = tokens?.access_token
  const today = new Date()

  const [open, setOpen] = React.useState(false)
  const [buyerId, setBuyerId] = React.useState<number | null>(null)
  const [preset, setPreset] = React.useState<DatePreset>("today")
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(undefined)
  const [customTo, setCustomTo] = React.useState<Date | undefined>(today)
  const [fromCalendarOpen, setFromCalendarOpen] = React.useState(false)
  const [toCalendarOpen, setToCalendarOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  let range: { from: Date; to: Date } | null
  if (preset === "custom") {
    range = customFrom && customTo ? { from: customFrom, to: customTo } : null
  } else {
    range = presetToRange(preset, today)
  }

  const handleExport = async () => {
    if (!accessToken || !buyerId || !range) return
    setIsExporting(true)
    try {
      const fromYMD = toLocalYMD(range.from)
      const toYMD = toLocalYMD(range.to)
      const blob = await apiClient.exportTobaccoPurchaseTemplate(accessToken, buyerId, fromYMD, toYMD)

      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tobacco_purchase_template_${fromYMD}_${toYMD}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      globalThis.URL.revokeObjectURL(url)

      toast.success("Exported successfully")
      setOpen(false)
    } catch (err) {
      toast.error((err as Error).message || "Failed to export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 flex shrink-0">
          <IconDownload className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Export Settlement Report</h4>
            <p className="text-xs text-muted-foreground">Choose a representative and date range to export.</p>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Representative</Label>
            <Select
              value={buyerId === null ? undefined : String(buyerId)}
              onValueChange={(v) => setBuyerId(Number(v))}
            >
              <SelectTrigger className="h-8 text-sm w-full">
                <SelectValue placeholder="Select representative" />
              </SelectTrigger>
              <SelectContent>
                {purchasers.map((p) => (
                  <SelectItem key={p.p_id} value={String(p.p_id)}>{p.p_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Date range</Label>
            <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
              <SelectTrigger className="h-8 text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESET_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-muted-foreground">From</Label>
                <Popover open={fromCalendarOpen} onOpenChange={setFromCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full justify-start text-left text-xs font-normal",
                        !customFrom && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-1.5 h-3.5 w-3.5" />
                      {customFrom ? format(customFrom, "PP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customFrom}
                      onSelect={(date) => {
                        setCustomFrom(date)
                        setFromCalendarOpen(false)
                      }}
                      disabled={(date) => date > today || (customTo ? date > customTo : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs font-medium text-muted-foreground">To</Label>
                <Popover open={toCalendarOpen} onOpenChange={setToCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full justify-start text-left text-xs font-normal",
                        !customTo && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-1.5 h-3.5 w-3.5" />
                      {customTo ? format(customTo, "PP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customTo}
                      onSelect={(date) => {
                        setCustomTo(date)
                        setToCalendarOpen(false)
                      }}
                      disabled={(date) => date > today || (customFrom ? date < customFrom : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleExport}
            disabled={isExporting || !buyerId || !range}
          >
            {isExporting
              ? <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              : <IconDownload className="h-4 w-4 mr-2" />
            }
            Download .xlsx
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
