"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, TobaccoRepayItem } from "@/services/api-client"
import { toast } from "sonner"
import { IconCash, IconLoader2, IconSortAscending, IconSortDescending, IconArrowsSort } from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { TobaccoRepayCard } from "./_components/tobacco-repay-card"
import { CreateRepayDialog } from "./_components/create-repay-dialog"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { TobaccoRepayHistory } from "./_components/tobacco-repay-history"

const PAGE_SIZE = 20

export default function TobaccoRepayPage() {
  const [mounted, setMounted] = React.useState(false)

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  const currentYearMinusOne = (new Date().getFullYear() - 1).toString()
  const [selectedYear, setSelectedYear] = React.useState(currentYearMinusOne)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<TobaccoRepayItem | null>(null)
  const [searchInput, setSearchInput] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"Quantity" | "total_repaid" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [columnVisibility, setColumnVisibility] = React.useState({
    contractNo: true,
    contractor: true,
    representative: true,
    tobaccoType: true,
    year: true,
    qty: true,
    totalReturned: true,
  })

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Fetch available years
  const { data: yearsData } = useQuery({
    queryKey: ["tobacco-repay-years"],
    queryFn: () => apiClient.getAvailableYears(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const availableYears = (yearsData && yearsData.length > 0)
    ? yearsData
    : [currentYearMinusOne, new Date().getFullYear().toString(), (new Date().getFullYear() - 2).toString()]

  const effectiveYear = availableYears.includes(selectedYear) ? selectedYear : (availableYears[0] ?? currentYearMinusOne)

  // Infinite query — resets when effectiveYear changes
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["tobacco-repays", effectiveYear],
    queryFn: ({ pageParam }) =>
      apiClient.getTobaccoRepays(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        year: effectiveYear,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const allRecords = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  const hasActiveSearch = searchInput.trim() !== ""

  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !hasActiveSearch) {
      fetchNextPage().catch(() => toast.error("Failed to load more records"))
    }
  }, [inView, hasNextPage, isFetchingNextPage, hasActiveSearch, fetchNextPage])

  // Client-side search + sort on loaded records
  const filteredRecords = React.useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return allRecords
    return allRecords.filter(
      (rec) =>
        rec.contract_number?.toLowerCase().includes(term) ||
        rec.contract_contractor_name?.toLowerCase().includes(term) ||
        rec.representative?.toLowerCase().includes(term)
    )
  }, [allRecords, searchInput])

  const sortedRecords = React.useMemo(() => {
    if (!sortBy) return filteredRecords
    const getSortVal = (rec: TobaccoRepayItem) => {
      if (sortBy === "Quantity") return rec.Quantity ?? 0
      if (sortBy === "total_repaid") return rec.total_repaid ?? 0
      return 0
    }
    return [...filteredRecords].sort((a, b) => {
      const diff = getSortVal(a) - getSortVal(b)
      return sortOrder === "asc" ? diff : -diff
    })
  }, [filteredRecords, sortBy, sortOrder])

  const toggleQuantitySort = () => {
    if (sortBy === "Quantity") {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortBy("Quantity")
      setSortOrder("desc")
    }
  }

  if (!mounted) return null

  const pageTitle = t.sidebar?.tobaccoRepay || "Tobacco Repay"

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-semibold tracking-tight md:text-xl lg:text-2xl">{pageTitle}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">Manage and track tobacco repay records from {currentYearMinusOne} - {new Date().getFullYear()}.</p>
        </div>
      </div>

      <CreateRepayDialog
        open={createOpen}
        onOpenChange={(v) => { if (!v) { setSelectedRecord(null) } setCreateOpen(v) }}
        token={tokens?.access_token ?? ""}
        record={selectedRecord}
        selectedYear={effectiveYear}
      />

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4 bg-white/60">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0 space-y-4">
          {/* ── Mobile Filter Bar ── */}
          <MobileFilterBar
        className="flex lg:hidden"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedYear={effectiveYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        onAdd={() => { setSelectedRecord(null); setCreateOpen(true) }}
      />

      {/* ── Desktop Filter Bar ── */}
      <FilterBar
        className="hidden lg:flex"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedYear={effectiveYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onAdd={() => { setSelectedRecord(null); setCreateOpen(true) }}
      />

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex items-center justify-center h-40 mt-4">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && sortedRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="bg-[#009640]/10 p-4 rounded-full ring-8 ring-[#009640]/5">
            <IconCash className="h-10 w-10 text-[#009640] stroke-[1.5]" />
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h3 className="text-xl font-medium text-gray-900">No Repay Records</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no tobacco repay records for {selectedYear} currently.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {sortedRecords.map((rec, idx) => (
            <TobaccoRepayCard
              key={`${rec.id}-${idx}`}
              rec={rec}
              index={idx + 1}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {sortedRecords.map((rec, idx) => (
            <TobaccoRepayCard
              key={`${rec.id}-${idx}`}
              rec={rec}
              index={idx + 1}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden lg:block rounded-md border bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  {columnVisibility.contractNo && <TableHead>Contract No</TableHead>}
                  {columnVisibility.contractor && <TableHead>Contractor</TableHead>}
                  {columnVisibility.representative && <TableHead>Representative</TableHead>}
                  {columnVisibility.tobaccoType && <TableHead>Tobacco Type</TableHead>}
                  {columnVisibility.year && <TableHead className="text-center">Year</TableHead>}
                  {columnVisibility.qty && (
                    <TableHead className="text-right">
                      <button
                        onClick={toggleQuantitySort}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Quantity
                        {(() => {
                          if (sortBy !== "Quantity") {
                            return <IconArrowsSort className="size-3.5 text-muted-foreground/50" />
                          }
                          return sortOrder === "asc"
                            ? <IconSortAscending className="size-3.5" />
                            : <IconSortDescending className="size-3.5" />
                        })()}
                      </button>
                    </TableHead>
                  )}
                  {columnVisibility.totalReturned && <TableHead className="text-right">Total Repaid</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {sortedRecords.map((rec, idx) => (
                  <TableRow key={`${rec.id}-${idx}`}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    {columnVisibility.contractNo && <TableCell className="font-medium">{rec.contract_number || "—"}</TableCell>}
                    {columnVisibility.contractor && <TableCell>{rec.contract_contractor_name || "—"}</TableCell>}
                    {columnVisibility.representative && <TableCell>{rec.representative || "—"}</TableCell>}
                    {columnVisibility.tobaccoType && (
                      <TableCell>{rec.tobacco_type || "—"}</TableCell>
                    )}
                    {columnVisibility.year && (
                      <TableCell className="text-center font-medium">
                        {rec.contract_year || "—"}
                      </TableCell>
                    )}
                    {columnVisibility.qty && (
                      <TableCell className="text-right">
                        {rec.Quantity !== null && rec.Quantity !== undefined
                          ? `${rec.Quantity.toLocaleString()} kg`
                          : "—"}
                      </TableCell>
                    )}
                    {columnVisibility.totalReturned && (
                      <TableCell className="text-right font-medium">
                        {rec.total_repaid !== null && rec.total_repaid !== undefined
                          ? `${rec.total_repaid.toLocaleString()} kg`
                          : "—"}
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
      {!hasActiveSearch && isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <TobaccoRepayHistory
            token={tokens?.access_token ?? ""}
            selectedYear={effectiveYear}
            setSelectedYear={setSelectedYear}
            availableYears={availableYears}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
