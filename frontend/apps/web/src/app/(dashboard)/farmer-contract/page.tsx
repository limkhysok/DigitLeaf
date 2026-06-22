"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, FarmerContractItem } from "@/services/api-client"
import { IconLoader2, IconClipboardList } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { FarmerContractCard } from "./_components/farmer-contract-card"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { CreateFarmerContractDialog } from "./_components/create-farmer-contract-dialog"
import { EditFarmerContractDialog } from "./_components/edit-farmer-contract-dialog"
import { DataTable } from "./_components/data-table"
import { getColumns } from "./_components/columns"
import { getCoreRowModel, RowSelectionState, VisibilityState } from "@tanstack/react-table"
import { useReactTable } from "@/utils/table-utils"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { toast } from "sonner"

const PAGE_SIZE = 20

export default function FarmerContractPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"land" | "sapling" | "yield" | "purchased" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [selectedYear, setSelectedYear] = React.useState(2026)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    code: true,
    land: true,
    sapling: true,
    expected: true,
    purchased: true,
    year: true,
  })
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<FarmerContractItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<FarmerContractItem | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["farmer-contracts", selectedYear],
    queryFn: ({ pageParam }) =>
      apiClient.getFarmerContracts(tokens!.access_token, {
        year: selectedYear,
        page: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const { mutate: deleteContract, isPending: isDeleting } = useMutation({
    mutationFn: (mfConId: number) =>
      apiClient.deleteFarmerContract(tokens!.access_token, mfConId),
    onSuccess: () => {
      toast.success("Farmer contract deleted")
      queryClient.invalidateQueries({ queryKey: ["farmer-contracts"] })
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete farmer contract")
    },
  })

  const allRecords = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !searchInput.trim()) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, searchInput])

  const handleColumnSort = React.useCallback((field: "land" | "sapling" | "yield" | "purchased") => {
    if (sortBy === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }, [sortBy])

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
    const getSortVal = (rec: FarmerContractItem) => {
      if (sortBy === "land") return rec.land ?? 0
      if (sortBy === "sapling") return rec.tobac_num ?? 0
      if (sortBy === "purchased") return rec.purchased_weight ?? 0
      return rec.expected_yield ?? 0
    }
    return [...filteredRecords].sort((a, b) => {
      const diff = getSortVal(a) - getSortVal(b)
      return sortOrder === "asc" ? diff : -diff
    })
  }, [filteredRecords, sortBy, sortOrder])

  const columns = React.useMemo(() => getColumns({
    t,
    sortBy,
    sortOrder,
    onSort: handleColumnSort,
    onEdit: setEditTarget,
    onDelete: setDeleteTarget,
  }), [t, sortBy, sortOrder, handleColumnSort])

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
    getRowId: (row) => String(row.mf_con_id),
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualSorting: true,
  })

  if (!mounted) return null

  const pageTitle = t.sidebar.farmerContract || "Farmer Contract"

  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{pageTitle}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">            {t.farmerContract.subtitle}
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
        onAddClick={() => setAddDialogOpen(true)}
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
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        onAddClick={() => setAddDialogOpen(true)}
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
          <span>{t.farmerContract.noRecordsFound}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {sortedRecords.map((rec, idx) => (
            <FarmerContractCard key={rec.mf_con_id} rec={rec} index={idx + 1} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {sortedRecords.map((rec, idx) => (
            <FarmerContractCard key={rec.mf_con_id} rec={rec} index={idx + 1} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && sortedRecords.length > 0 && (
        <div className="hidden lg:block">
          <DataTable
            table={table}
            noRecordsText={t.farmerContract.noRecordsFound}
            getRowClassName={(rec) =>
              rec.purchased_weight != null && rec.expected_yield != null && rec.purchased_weight > rec.expected_yield
                ? "bg-red-100 hover:bg-red-100"
                : undefined
            }
          />
        </div>
      )}

      {/* ── Infinite scroll sentinel ── */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && !searchInput.trim() && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <CreateFarmerContractDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <EditFarmerContractDialog
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        contract={editTarget}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete farmer contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contract for{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>
              {" "}({deleteTarget?.mf_code}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteTarget && deleteContract(deleteTarget.mf_con_id)}
            >
              {isDeleting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
