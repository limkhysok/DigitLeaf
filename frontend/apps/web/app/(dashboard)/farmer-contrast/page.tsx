"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, FarmerContrastItem } from "@/lib/api-client"
import { toast } from "sonner"
import {
  IconLoader2,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconClipboardList,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { FarmerContrastCard } from "./_components/farmer-contrast-card"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"

export default function FarmerContrastPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  // --- State ---
  const [records, setRecords] = React.useState<FarmerContrastItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [view, setView] = React.useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = React.useState<"sapling" | "yield" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [selectedYear, setSelectedYear] = React.useState(2026)

  // --- Fetch Data ---
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setIsLoading(true)
      apiClient.getFarmerContrasts(tokens.access_token, selectedYear)
        .then((data) => { if (active) setRecords(data) })
        .catch((err) => toast.error((err as Error).message || "Failed to fetch farmer contrasts"))
        .finally(() => { if (active) setIsLoading(false) })
    })
    return () => { active = false }
  }, [isAuthLoading, tokens, selectedYear])

  // --- Filtered records ---
  const filteredRecords = React.useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return records
    return records.filter(
      (rec) =>
        rec.name.toLowerCase().includes(term) ||
        rec.mf_code.toLowerCase().includes(term)
    )
  }, [records, searchInput])

  // --- Sorted records ---
  const sortedRecords = React.useMemo(() => {
    if (!sortBy) return filteredRecords
    return [...filteredRecords].sort((a, b) => {
      const valA = sortBy === "sapling" ? (a.tobac_num ?? 0) : (a.expected_yield ?? 0)
      const valB = sortBy === "sapling" ? (b.tobac_num ?? 0) : (b.expected_yield ?? 0)
      return sortOrder === "asc" ? valA - valB : valB - valA
    })
  }, [filteredRecords, sortBy, sortOrder])

  if (!mounted) return null

  const pageTitle = t.sidebar.farmerContrast || "Farmer Contrast"

  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            {t.farmerContrast.subtitle}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE & TABLET FILTER BAR — (< 1024px / below lg)
      ════════════════════════════════════════════════════════════════════ */}
      <MobileFilterBar
        className="flex lg:hidden"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP FILTER BAR — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      <FilterBar
        className="hidden lg:flex"
        searchClassName="min-w-40 max-w-xs"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        view={view}
        setView={setView}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
      />

      {/* ════════════════════════════════════════════════════════════════════
          LOADING / EMPTY STATES
      ════════════════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && sortedRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
          <IconClipboardList className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{t.farmerContrast.noRecordsFound}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {sortedRecords.map((rec, idx) => (
            <FarmerContrastCard key={rec.mf_con_id} rec={rec} index={idx + 1} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {sortedRecords.map((rec, idx) => (
            <FarmerContrastCard key={rec.mf_con_id} rec={rec} index={idx + 1} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden lg:block">
          {view === "list" ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-[#F9FAFB] border-gray-200">
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-12">No.</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                          {t.farmerContrast.farmerName}
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                          Code
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                          onClick={() => {
                            if (sortBy !== "sapling") { setSortBy("sapling"); setSortOrder("desc") }
                            else if (sortOrder === "desc") setSortOrder("asc")
                            else setSortBy(null)
                          }}
                        >
                          <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                            {t.farmerContrast.saplingKg}
                            {sortBy === "sapling" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                            {sortBy === "sapling" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                            {sortBy !== "sapling" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                          onClick={() => {
                            if (sortBy !== "yield") { setSortBy("yield"); setSortOrder("desc") }
                            else if (sortOrder === "desc") setSortOrder("asc")
                            else setSortBy(null)
                          }}
                        >
                          <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                            {t.farmerContrast.expectedYieldKg}
                            {sortBy === "yield" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                            {sortBy === "yield" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                            {sortBy !== "yield" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                          {t.farmerContrast.purchasedWeightKg}
                        </th>
                        <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-24">
                          {t.farmerContrast.year}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map((rec, idx) => (
                        <tr
                          key={rec.mf_con_id}
                          className={cn(
                            "group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors",
                            idx % 2 === 1 && "bg-[#F9FAFB]/60"
                          )}
                        >
                          <td className="px-4 py-3.5 text-[#9CA3AF] text-xs">{idx + 1}</td>
                          <td className="px-4 py-3.5 text-[#111827] font-semibold">{rec.name}</td>
                          <td className="px-4 py-3.5 text-[#6B7280] text-xs font-mono">{rec.mf_code}</td>
                          <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                            {rec.tobac_num !== undefined && rec.tobac_num !== null
                              ? rec.tobac_num.toLocaleString()
                              : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                            {rec.expected_yield !== undefined && rec.expected_yield !== null
                              ? `${rec.expected_yield.toLocaleString()} kg`
                              : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                            {rec.purchased_weight !== undefined && rec.purchased_weight !== null
                              ? `${rec.purchased_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                              : <span className="text-[#D1D5DB]">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
                              {rec.year}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedRecords.map((rec, idx) => (
                <FarmerContrastCard key={rec.mf_con_id} rec={rec} index={idx + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
