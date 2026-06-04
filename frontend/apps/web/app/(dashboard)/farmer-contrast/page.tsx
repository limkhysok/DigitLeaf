"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, FarmerContrastItem } from "@/lib/api-client"
import { IconLoader2, IconClipboardList } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
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
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"

const PAGE_SIZE = 20

export default function FarmerContrastPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  const [searchInput, setSearchInput] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"sapling" | "yield" | "purchased" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [selectedYear, setSelectedYear] = React.useState(2026)
  const [columnVisibility, setColumnVisibility] = React.useState({
    code: true,
    sapling: true,
    expected: true,
    purchased: true,
    year: true,
  })

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["farmer-contrasts", selectedYear],
    queryFn: ({ pageParam }) =>
      apiClient.getFarmerContrasts(tokens!.access_token, {
        year: selectedYear,
        skip: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, p) => sum + p.items.length, 0)
      return totalFetched < lastPage.total ? totalFetched : undefined
    },
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const allRecords = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Client-side search + sort on loaded records
  const filteredRecords = React.useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return allRecords
    return allRecords.filter(
      (rec) =>
        rec.name.toLowerCase().includes(term) ||
        rec.mf_code.toLowerCase().includes(term)
    )
  }, [allRecords, searchInput])

  const sortedRecords = React.useMemo(() => {
    if (!sortBy) return filteredRecords
    const getSortVal = (rec: FarmerContrastItem) => {
      if (sortBy === "sapling") return rec.tobac_num ?? 0
      if (sortBy === "purchased") return rec.purchased_weight ?? 0
      return rec.expected_yield ?? 0
    }
    return [...filteredRecords].sort((a, b) => {
      const diff = getSortVal(a) - getSortVal(b)
      return sortOrder === "asc" ? diff : -diff
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
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
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
                  {columnVisibility.code && <TableHead>ID Card</TableHead>}
                  {columnVisibility.sapling && <TableHead>{t.farmerContrast.saplingKg}</TableHead>}
                  {columnVisibility.expected && <TableHead>{t.farmerContrast.expectedYieldKg}</TableHead>}
                  {columnVisibility.purchased && <TableHead>{t.farmerContrast.purchasedWeightKg}</TableHead>}
                  {columnVisibility.year && <TableHead className="text-center w-24">{t.farmerContrast.year}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.map((rec, idx) => (
                  <TableRow key={rec.mf_con_id} className={cn("group/row", rec.purchased_weight != null && rec.expected_yield != null && rec.purchased_weight > rec.expected_yield && "bg-red-100 hover:bg-red-100")}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-semibold">{rec.name}</TableCell>
                    {columnVisibility.code && <TableCell className="text-sm">{rec.mf_code}</TableCell>}
                    {columnVisibility.sapling && (
                      <TableCell className="text-sm">
                        {rec.tobac_num !== undefined && rec.tobac_num !== null
                          ? rec.tobac_num.toLocaleString()
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.expected && (
                      <TableCell className="text-sm">
                        {rec.expected_yield !== undefined && rec.expected_yield !== null
                          ? `${rec.expected_yield.toLocaleString()} kg`
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.purchased && (
                      <TableCell className="text-sm">
                        {rec.purchased_weight !== undefined && rec.purchased_weight !== null
                          ? `${rec.purchased_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.year && (
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
                          {rec.year}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Infinite scroll sentinel ── */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
