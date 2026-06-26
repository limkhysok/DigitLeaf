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
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, subDays, subMonths, subYears } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"

type DatePreset = "7d" | "30d" | "3m" | "6m" | "1y" | "custom"

const ALL_REPRESENTATIVES = "all"

function toLocalYMD(d: Date) {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().split("T")[0] ?? ""
}

function presetToRange(preset: DatePreset, today: Date): { from: Date; to: Date } | null {
  switch (preset) {
    case "7d": return { from: subDays(today, 7), to: today }
    case "30d": return { from: subDays(today, 30), to: today }
    case "3m": return { from: subMonths(today, 3), to: today }
    case "6m": return { from: subMonths(today, 6), to: today }
    case "1y": return { from: subYears(today, 1), to: today }
    default: return null
  }
}

interface RepayExportButtonProps {
  token: string
}

export function RepayExportButton({ token }: Readonly<RepayExportButtonProps>) {
  const { t } = useLanguage()
  const eb = t.tobaccoRepay.exportButton
  const PRESET_LABELS: Record<DatePreset, string> = {
    "7d": eb.last7Days,
    "30d": eb.last30Days,
    "3m": eb.last3Months,
    "6m": eb.last6Months,
    "1y": eb.lastYear,
    custom: eb.customRange,
  }
  const today = new Date()

  const [open, setOpen] = React.useState(false)
  const [representId, setRepresentId] = React.useState<string>(ALL_REPRESENTATIVES)
  const [preset, setPreset] = React.useState<DatePreset>("30d")
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(undefined)
  const [customTo, setCustomTo] = React.useState<Date | undefined>(today)
  const [fromCalendarOpen, setFromCalendarOpen] = React.useState(false)
  const [toCalendarOpen, setToCalendarOpen] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)

  const { data: represents = [] } = useQuery({
    queryKey: ["represents"],
    queryFn: () => apiClient.getRepresents(token),
    enabled: !!token,
  })

  const customRange = customFrom && customTo ? { from: customFrom, to: customTo } : null
  const range = preset === "custom" ? customRange : presetToRange(preset, today)

  const handleExport = async () => {
    if (!token || !range) return
    setIsExporting(true)
    try {
      const fromYMD = toLocalYMD(range.from)
      const toYMD = toLocalYMD(range.to)
      const blob = await apiClient.exportTobaccoRepayHistory(token, {
        representativeId: representId === ALL_REPRESENTATIVES ? undefined : Number(representId),
        dateFrom: fromYMD,
        dateTo: toYMD,
      })

      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tobacco_repay_history_${fromYMD}_${toYMD}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      globalThis.URL.revokeObjectURL(url)

      toast.success(eb.toastSuccess)
      setOpen(false)
    } catch (err) {
      toast.error((err as Error).message || eb.toastError)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 gap-1.5 flex rounded-sm bg-white">
          <IconDownload className="h-4 w-4" />
          <span className="hidden sm:inline">{eb.export}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{eb.title}</h4>
            <p className="text-xs text-muted-foreground">{eb.description}</p>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">{eb.representative}</Label>
            <Select value={representId} onValueChange={setRepresentId}>
              <SelectTrigger className="h-8 text-sm w-full">
                <SelectValue placeholder={eb.selectRepresentativePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_REPRESENTATIVES}>{eb.allRepresentatives}</SelectItem>
                {represents.map((r) => (
                  <SelectItem key={r.represent_id} value={String(r.represent_id)}>{r.represent_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">{eb.dateRange}</Label>
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
                <Label className="text-xs font-medium text-muted-foreground">{eb.from}</Label>
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
                      {customFrom ? format(customFrom, "PP") : eb.pickDate}
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
                <Label className="text-xs font-medium text-muted-foreground">{eb.to}</Label>
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
                      {customTo ? format(customTo, "PP") : eb.pickDate}
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
            disabled={isExporting || !range}
          >
            {isExporting
              ? <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              : <IconDownload className="h-4 w-4 mr-2" />
            }
            {eb.downloadXlsx}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
