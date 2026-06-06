"use client"

import * as React from "react"
import { IconDownload, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Label } from "@workspace/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Input } from "@workspace/ui/components/input"
import { useLanguage } from "@/hooks/use-language"
import { apiClient } from "@/services/api-client"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

export function ExportButton() {
  const { tokens } = useAuth()
  const accessToken = tokens?.access_token
  const { t } = useLanguage()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<string>("all")
  const [dateRange, setDateRange] = React.useState<string>("today")
  const [customFrom, setCustomFrom] = React.useState("")
  const [customTo, setCustomTo] = React.useState("")
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    if (!accessToken) return
    setIsExporting(true)
    
    try {
      let date_from: string | undefined = undefined
      let date_to: string | undefined = undefined

      const today = new Date()
      const formatDate = (d: Date) => {
        // Output YYYY-MM-DD in local time
        const offset = d.getTimezoneOffset()
        const local = new Date(d.getTime() - (offset*60*1000))
        return local.toISOString().split('T')[0]
      }

      if (dateRange === "today") {
        date_from = formatDate(today)
        date_to = formatDate(today)
      } else if (dateRange === "last7") {
        const past = new Date(today)
        past.setDate(today.getDate() - 7)
        date_from = formatDate(past)
        date_to = formatDate(today)
      } else if (dateRange === "last30") {
        const past = new Date(today)
        past.setDate(today.getDate() - 30)
        date_from = formatDate(past)
        date_to = formatDate(today)
      } else if (dateRange === "last90") {
        const past = new Date(today)
        past.setDate(today.getDate() - 90)
        date_from = formatDate(past)
        date_to = formatDate(today)
      } else if (dateRange === "custom") {
        if (customFrom) date_from = customFrom
        if (customTo) date_to = customTo
      }

      const statusParam = status === "all" ? undefined : Number.parseInt(status, 10)

      const blob = await apiClient.exportSackRegistrations(accessToken, {
        status: statusParam,
        date_from,
        date_to
      })

      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sack_registrations_export_${formatDate(today)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      globalThis.URL.revokeObjectURL(url)
      
      toast.success("Exported successfully")
      setOpen(false)
    } catch (err: unknown) {
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
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Export Data</h4>
            <p className="text-sm font-regular text-muted-foreground">
              Select filters for your Excel export.
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="w-full h-8">
                <SelectValue placeholder="Select status" className="text-sm font-regular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="0">{t.sackRegistration.filters.statusPending}</SelectItem>
                <SelectItem value="1">{t.sackRegistration.filters.statusConfirmed}</SelectItem>
                <SelectItem value="2">{t.sackRegistration.filters.statusRejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateRange" className="text-sm font-medium">
              Date Range
            </Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger id="dateRange" className="w-full h-8">
                <SelectValue placeholder="Select date range" className="text-sm font-regular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="customFrom" className="text-xs">From</Label>
                <Input
                  id="customFrom"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="customTo" className="text-xs">To</Label>
                <Input
                  id="customTo"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <Button 
            className="w-full mt-2" 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? <IconLoader2 className="h-4 w-4 animate-spin mr-2" /> : <IconDownload className="h-4 w-4 mr-2" />}
            Download .xlsx
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
