"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, TobaccoReturnItem } from "@/services/api-client"
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
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"

const PAGE_SIZE = 30

export default function TobaccoReturnPage() {
  const [mounted, setMounted] = React.useState(false)

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  const currentYearMinusOne = (new Date().getFullYear() - 1).toString()
  const [selectedYear, setSelectedYear] = React.useState(currentYearMinusOne)
  const [availableYears, setAvailableYears] = React.useState<string[]>([
    currentYearMinusOne,
    new Date().getFullYear().toString(),
    (new Date().getFullYear() - 2).toString(),
  ])

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
    queryKey: ["tobacco-return-years"],
    queryFn: () => apiClient.getAvailableYears(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  React.useEffect(() => {
    if (yearsData && yearsData.length > 0) {
      setAvailableYears(yearsData)
      setSelectedYear((prev) => (yearsData.includes(prev) ? prev : (yearsData[0] ?? currentYearMinusOne)))
    }
  }, [yearsData, currentYearMinusOne])

  // Infinite query — resets when selectedYear changes
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["tobacco-returns", selectedYear],
    queryFn: ({ pageParam }) =>
      apiClient.getTobaccoReturns(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        year: selectedYear,
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
      fetchNextPage().catch(() => toast.error("Failed to load more records"))
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

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
    const getSortVal = (rec: TobaccoReturnItem) => {
      if (sortBy === "Quantity") return rec.Quantity ?? 0
      if (sortBy === "total_repaid") return rec.total_repaid ?? 0
      return 0
    }
    return [...filteredRecords].sort((a, b) => {
      const diff = getSortVal(a) - getSortVal(b)
      return sortOrder === "asc" ? diff : -diff
    })
  }, [filteredRecords, sortBy, sortOrder])

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
            Manage and track tobacco return records from {currentYearMinusOne} - {new Date().getFullYear()}.
          </p>
        </div>
      </div>

      {/* ── Mobile Filter Bar ── */}
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
        availableYears={availableYears}
      />

      {/* ── Desktop Filter Bar ── */}
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
        availableYears={availableYears}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
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
            <h3 className="text-xl font-medium text-gray-900">No Return Records</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no tobacco return records for {selectedYear} currently.
            </p>
          </div>
        </div>
      )}

      {/* ── Data Table ── */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="rounded-md border bg-white">
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
                  {columnVisibility.qty && <TableHead className="text-right">Qty</TableHead>}
                  {columnVisibility.totalReturned && <TableHead className="text-right">Total Returned</TableHead>}
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
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
