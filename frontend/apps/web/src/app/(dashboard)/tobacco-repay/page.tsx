"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, TobaccoRepayItem } from "@/services/api-client"
import { toast } from "sonner"
import { IconCash, IconLoader2 } from "@tabler/icons-react"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { TobaccoRepayCard } from "./_components/tobacco-repay-card"
import { CreateRepayDialog } from "./_components/create-repay-dialog"
import { DataTable } from "./_components/data-table"
import { getSummaryColumns } from "./_components/summary-columns"
import { getCoreRowModel, RowSelectionState, VisibilityState } from "@tanstack/react-table"
import { useReactTable } from "@/utils/table-utils"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "use-debounce"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { TobaccoRepayHistory } from "./_components/tobacco-repay-history"
import { ContractDetailDialog } from "./_components/contract-detail-dialog"

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
  const [search] = useDebounce(searchInput, 400)
  const [sortBy, setSortBy] = React.useState<"Quantity" | "total_repaid" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    contractNo: true,
    contractor: true,
    representative: true,
    tobaccoType: true,
    year: true,
    qty: true,
    totalReturned: true,
    status: true,
  })
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const [viewConId, setViewConId] = React.useState<number | null>(null)
  const handleViewSummary = React.useCallback((rec: TobaccoRepayItem) => {
    setViewConId(rec.id)
  }, [])

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
    queryKey: ["tobacco-repays", effectiveYear, search],
    queryFn: ({ pageParam }) =>
      apiClient.getTobaccoRepays(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        year: effectiveYear,
        search: search || undefined,
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

  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => toast.error(t.tobaccoRepay.loadMoreError))
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, t])

  // Client-side sort on loaded records (search is server-side)
  const sortedRecords = React.useMemo(() => {
    if (!sortBy) return allRecords
    const getSortVal = (rec: TobaccoRepayItem) => {
      if (sortBy === "Quantity") return rec.Quantity ?? 0
      if (sortBy === "total_repaid") return rec.total_repaid ?? 0
      return 0
    }
    return [...allRecords].sort((a, b) => {
      const diff = getSortVal(a) - getSortVal(b)
      return sortOrder === "asc" ? diff : -diff
    })
  }, [allRecords, sortBy, sortOrder])

  const handleColumnSort = React.useCallback((field: "Quantity" | "total_repaid") => {
    if (sortBy === field) {
      setSortOrder((order) => (order === "desc" ? "asc" : "desc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }, [sortBy])

  const columns = React.useMemo(() => getSummaryColumns({
    t,
    sortBy,
    sortOrder,
    onSort: handleColumnSort,
    onView: handleViewSummary,
  }), [t, sortBy, sortOrder, handleColumnSort, handleViewSummary])

  const table = useReactTable({
    data: sortedRecords,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row, index) => row.id == null ? String(index) : String(row.id),
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualSorting: true,
  })

  if (!mounted) return null

  const pageTitle = t.sidebar?.tobaccoRepay || "Tobacco Repay"

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{pageTitle}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
            {t.tobaccoRepay.subtitle
              .replace("{from}", currentYearMinusOne)
              .replace("{to}", String(new Date().getFullYear()))}
          </p>
        </div>
      </div>

      <CreateRepayDialog
        open={createOpen}
        onOpenChange={(v) => { if (!v) { setSelectedRecord(null) } setCreateOpen(v) }}
        token={tokens?.access_token ?? ""}
        record={selectedRecord}
        selectedYear={effectiveYear}
      />

      <ContractDetailDialog
        open={viewConId !== null}
        onOpenChange={(v) => { if (!v) setViewConId(null) }}
        token={tokens?.access_token ?? ""}
        conId={viewConId}
      />

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4 bg-white/60">
          <TabsTrigger value="summary">{t.tobaccoRepay.tabs.summary}</TabsTrigger>
          <TabsTrigger value="history">{t.tobaccoRepay.tabs.history}</TabsTrigger>
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
            <h3 className="text-xl font-medium text-gray-900">{t.tobaccoRepay.empty.summaryTitle}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              {t.tobaccoRepay.empty.summaryDesc.replace("{year}", selectedYear)}
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
        <div className="hidden lg:block">
          <DataTable table={table} noRecordsText={t.tobaccoRepay.noResults} />
        </div>
      )}

      {/* ── Infinite scroll sentinel ── */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
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
