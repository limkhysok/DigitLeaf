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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
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
          <h1 className="scroll-m-24 text-lg font-semibold tracking-tight md:text-xl lg:text-2xl">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm sm:text-sm sm:text-balance md:max-w-full">
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
          <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>{t.farmerContrast.farmerName}</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead
                      className="cursor-pointer select-none group"
                      onClick={() => {
                        if (sortBy !== "sapling") { setSortBy("sapling"); setSortOrder("desc") }
                        else if (sortOrder === "desc") setSortOrder("asc")
                        else setSortBy(null)
                      }}
                    >
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {t.farmerContrast.saplingKg}
                        {sortBy === "sapling" && sortOrder === "asc" && <IconSortAscending className="size-3.5" />}
                        {sortBy === "sapling" && sortOrder === "desc" && <IconSortDescending className="size-3.5" />}
                        {sortBy !== "sapling" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none group"
                      onClick={() => {
                        if (sortBy !== "yield") { setSortBy("yield"); setSortOrder("desc") }
                        else if (sortOrder === "desc") setSortOrder("asc")
                        else setSortBy(null)
                      }}
                    >
                      <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {t.farmerContrast.expectedYieldKg}
                        {sortBy === "yield" && sortOrder === "asc" && <IconSortAscending className="size-3.5" />}
                        {sortBy === "yield" && sortOrder === "desc" && <IconSortDescending className="size-3.5" />}
                        {sortBy !== "yield" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </TableHead>
                    <TableHead>{t.farmerContrast.purchasedWeightKg}</TableHead>
                    <TableHead className="text-center w-24">{t.farmerContrast.year}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((rec, idx) => (
                    <TableRow key={rec.mf_con_id} className="group/row">
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{rec.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{rec.mf_code}</TableCell>
                      <TableCell className="text-sm">
                        {rec.tobac_num !== undefined && rec.tobac_num !== null
                          ? rec.tobac_num.toLocaleString()
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.expected_yield !== undefined && rec.expected_yield !== null
                          ? `${rec.expected_yield.toLocaleString()} kg`
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.purchased_weight !== undefined && rec.purchased_weight !== null
                          ? `${rec.purchased_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
                          {rec.year}
                        </span>
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
