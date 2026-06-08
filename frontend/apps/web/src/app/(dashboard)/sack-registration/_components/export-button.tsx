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

function toLocalYMD(d: Date) {
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().split("T")[0] ?? ""
}
export function ExportButton() {
  const { tokens } = useAuth()
  const accessToken = tokens?.access_token
  const { t } = useLanguage()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<string>("all")
  const todayYMD = toLocalYMD(new Date())
  const [selectedDate, setSelectedDate] = React.useState(todayYMD)
  const [isExporting, setIsExporting] = React.useState(false)

  const handleExport = async () => {
    if (!accessToken) return
    setIsExporting(true)
    try {
      const statusParam = status === "all" ? undefined : Number.parseInt(status, 10)
      const blob = await apiClient.exportSackRegistrations(accessToken, {
        status: statusParam,
        date_from: selectedDate,
        date_to: selectedDate,
      })

      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sack_registrations_${selectedDate}.xlsx`
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
      <PopoverContent className="w-72 p-4" align="start">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Export Data</h4>
            <p className="text-xs text-muted-foreground">Choose a date and status to export.</p>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="export-date" className="text-sm font-medium">Date</Label>
            </div>
            <Input
              id="export-date"
              type="date"
              value={selectedDate}
              max={todayYMD}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="export-status" className="text-sm font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="export-status" className="w-full h-8">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="0">{t.sackRegistration.filters.statusPending}</SelectItem>
                <SelectItem value="1">{t.sackRegistration.filters.statusConfirmed}</SelectItem>
                <SelectItem value="2">{t.sackRegistration.filters.statusRejected}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
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
