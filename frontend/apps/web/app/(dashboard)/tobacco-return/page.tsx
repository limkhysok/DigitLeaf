"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, TobaccoReturnItem } from "@/lib/api-client"
import { toast } from "sonner"
import { IconCash, IconLoader2 } from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

export default function TobaccoReturnPage() {
  const [mounted, setMounted] = React.useState(false)

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, language } = useLanguage()

  const [records, setRecords] = React.useState<TobaccoReturnItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedYear, setSelectedYear] = React.useState("2026")
  const [availableYears, setAvailableYears] = React.useState<string[]>(["2026", "2025", "2024"])

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let active = true

    apiClient.getAvailableYears(tokens.access_token)
      .then((years) => {
        if (active && years.length > 0) {
          setAvailableYears(years)
          setSelectedYear(prev => years.includes(prev) ? prev : (years[0] || "2026"))
        }
      })
      .catch(console.error)

    return () => { active = false }
  }, [isAuthLoading, tokens])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let active = true

    queueMicrotask(() => {
      if (!active) return
      setIsLoading(true)

      apiClient.getTobaccoReturns(tokens.access_token, selectedYear)
        .then((data) => {
          if (active) setRecords(data)
        })
        .catch((err) => {
          toast.error((err as Error).message || "Failed to fetch tobacco returns")
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    })

    return () => { active = false }
  }, [isAuthLoading, tokens, selectedYear])

  if (!mounted) return null

  const pageTitle = t.sidebar?.tobaccoReturn || "Tobacco Return"

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-semibold tracking-tight md:text-xl lg:text-2xl">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-sm sm:text-balance md:max-w-full">
            Manage and track tobacco return records.
          </p>
        </div>
        <div className="flex items-center">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] bg-white border-gray-200">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex items-center justify-center h-40 mt-4">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && records.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 mt-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="bg-[#009640]/10 p-4 rounded-full ring-8 ring-[#009640]/5">
            <IconCash className="h-10 w-10 text-[#009640] stroke-[1.5]" />
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h3 className="text-xl font-medium text-gray-900">No Return Records</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no tobacco return records for {selectedYear} currently.
            </p>
          </div>
        </div>
      )}

      {/* ── Data Table ── */}
      {!isLoading && records.length > 0 && (
        <div className="rounded-md border bg-white mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Contract No</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Tobacco Type</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total Returned</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {records.map((rec, idx) => (
                  <TableRow key={`${rec.con_id}-${idx}`}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{rec.con_num || "—"}</TableCell>
                    <TableCell>{rec.contractor || "—"}</TableCell>
                    <TableCell>{rec.represent || "—"}</TableCell>
                    <TableCell>
                      {language === "kh" ? (rec.t_name_kh || rec.t_name || "—") : (rec.t_name || "—")}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {rec.note || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {rec.qty !== null && rec.qty !== undefined ? `${rec.qty.toLocaleString()} kg` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {rec.total_returned !== null && rec.total_returned !== undefined ? `${rec.total_returned.toLocaleString()} kg` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {rec.price !== null && rec.price !== undefined ? `៛${rec.price.toLocaleString()}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
