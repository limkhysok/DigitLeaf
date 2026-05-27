"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  TobaccoPurchase,
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2, IconPlus } from "@tabler/icons-react"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { MobileView } from "./_components/mobile-view"
import { TabletView } from "./_components/tablet-view"
import { DataTableToolbar } from "./_components/data-table-toolbar"
import { DataTable } from "./_components/data-table"
import { getColumns } from "./_components/columns"
import { getCoreRowModel, VisibilityState } from "@tanstack/react-table"
import { useReactTable } from "@/lib/table-utils"
import { Button } from "@workspace/ui/components/button"
import { printInvoice } from "./_components/invoice-print"
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

const PAGE_SIZE = 100

type SortDir = "asc" | "desc" | null





export default function TobaccoPurchasePage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const [records, setRecords] = React.useState<TobaccoPurchase[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<TobaccoPurchase | null>(null)
  const [isViewOnly, setIsViewOnly] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [view, setView] = React.useState<"list" | "grid">("list")

  // ── Search ──────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [buyerFilter, setBuyerFilter] = React.useState<number | null>(null)

  const [sortGrandTotal, setSortGrandTotal] = React.useState<SortDir>(null)
  const [sortNetWeight, setSortNetWeight] = React.useState<SortDir>(null)

  // ── Infinite Scroll ─────────────────────────────────────────────────────────
  const [skip, setSkip] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // ── Lookup data ─────────────────────────────────────────────────────────────
  const [purchasers, setPurchasers] = React.useState<PurchaserItem[]>([])
  const [regions, setRegions] = React.useState<RegionItem[]>([])
  const [ovens, setOvens] = React.useState<OvenItem[]>([])
  const [tobaccoTypes, setTobaccoTypes] = React.useState<TobaccoItem[]>([])
  const lookupsLoaded = React.useRef(false)

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    setIsLoading(true)
    try {
      const promises: Promise<unknown>[] = [
        apiClient.getTobaccoPurchases(tokens.access_token, {
          skip: 0,
          limit: PAGE_SIZE,
          search: search || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          buyer: buyerFilter ?? undefined,
          sort_grand_total: sortGrandTotal ?? undefined,
          sort_net_weight: sortNetWeight ?? undefined,
        }),
      ]

      if (!lookupsLoaded.current) {
        promises.push(
          apiClient.getPurchasers(tokens.access_token),
          apiClient.getRegions(tokens.access_token),
          apiClient.getOvens(tokens.access_token),
          apiClient.getTobaccoTypes(tokens.access_token),
        )
      }

      const results = await Promise.all(promises)
      const recData = results[0] as Awaited<ReturnType<typeof apiClient.getTobaccoPurchases>>
      setRecords(recData.items)
      setSkip(recData.items.length)
      setHasMore(recData.items.length < recData.total)

      if (!lookupsLoaded.current) {
        setPurchasers(results[1] as PurchaserItem[])
        setRegions(results[2] as RegionItem[])
        setOvens(results[3] as OvenItem[])
        setTobaccoTypes(results[4] as TobaccoItem[])
        lookupsLoaded.current = true
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens, search, dateFrom, dateTo, buyerFilter, sortGrandTotal, sortNetWeight])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    const timer = setTimeout(() => { fetchRecords() }, 0)
    return () => clearTimeout(timer)
  }, [isAuthLoading, tokens, fetchRecords])

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (!tokens?.access_token || !hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    const currentSkip = skip
    try {
      const recData = await apiClient.getTobaccoPurchases(tokens.access_token, {
        skip: currentSkip,
        limit: PAGE_SIZE,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        buyer: buyerFilter ?? undefined,
        sort_grand_total: sortGrandTotal ?? undefined,
        sort_net_weight: sortNetWeight ?? undefined,
      })
      setRecords(prev => [...prev, ...recData.items])
      setSkip(currentSkip + recData.items.length)
      setHasMore(currentSkip + recData.items.length < recData.total)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoadingMore(false)
    }
  }, [tokens, hasMore, isLoadingMore, isLoading, skip, search, dateFrom, dateTo, buyerFilter, sortGrandTotal, sortNetWeight])

  // ── IntersectionObserver ──────────────────────────────────────────────────
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const openRecord = React.useCallback(async (record: TobaccoPurchase, viewOnly: boolean) => {
    if (!tokens?.access_token) return
    try {
      const full = await apiClient.getTobaccoPurchase(tokens.access_token, record.tp_id)
      setSelectedRecord(full)
      setIsViewOnly(viewOnly)
      setDialogOpen(true)
    } catch {
      toast.error("Failed to load purchase details")
    }
  }, [tokens])

  const handleEdit = React.useCallback((record: TobaccoPurchase) => openRecord(record, false), [openRecord])
  const handleView = React.useCallback((record: TobaccoPurchase) => openRecord(record, true), [openRecord])

  const handleDelete = async () => {
    if (!deleteId || !tokens?.access_token) return
    setIsDeleting(true)
    try {
      await apiClient.deleteTobaccoPurchase(tokens.access_token, deleteId)
      toast.success("Record deleted successfully")
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleAddNew = () => {
    setSelectedRecord(null)
    setIsViewOnly(false)
    setDialogOpen(true)
  }

  const handlePrint = React.useCallback(async (record: TobaccoPurchase) => {
    if (!tokens?.access_token) return
    try {
      // Fetch full record with details if not already loaded
      const full = record.details && record.details.length > 0
        ? record
        : await apiClient.getTobaccoPurchase(tokens.access_token, record.tp_id)

      let mfCode: string | undefined = undefined;
      if (full.buyer && full.vendor) {
        try {
          const vendorsList = await apiClient.getVendorsByBuyer(tokens.access_token, full.buyer);
          const vItem = vendorsList.find(v => v.name === full.vendor);
          if (vItem) mfCode = vItem.mf_code;
        } catch {
          // ignore
        }
      }

      await printInvoice({
        record: full,
        purchasers,
        regions,
        ovens,
        tobaccoTypes,
        mfCode,
      })
    } catch {
      toast.error("Failed to load purchase details for printing")
    }
  }, [tokens, purchasers, regions, ovens, tobaccoTypes])

  // ── Derived state ─────────────────────────────────────────────────────────────
  const filteredRecords = records
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const columns = React.useMemo(() => getColumns({
    purchasers,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: (id: number) => setDeleteId(id),
    onPrint: handlePrint,
  }), [purchasers, handleView, handleEdit, handlePrint])

  const sorting = React.useMemo(() => {
    if (sortGrandTotal) return [{ id: "grand_total", desc: sortGrandTotal === "desc" }]
    if (sortNetWeight) return [{ id: "net_weight", desc: sortNetWeight === "desc" }]
    return []
  }, [sortGrandTotal, sortNetWeight])

  const setSorting = React.useCallback((updater: React.SetStateAction<import("@tanstack/react-table").SortingState>) => {
    const newVal = typeof updater === "function" ? updater(sorting) : updater
    if (newVal.length === 0) {
      setSortGrandTotal(null)
      setSortNetWeight(null)
    } else {
      const col = newVal[0]
      if (!col) return
      if (col.id === "grand_total") {
        setSortGrandTotal(col.desc ? "desc" : "asc")
        setSortNetWeight(null)
      } else if (col.id === "net_weight") {
        setSortNetWeight(col.desc ? "desc" : "asc")
        setSortGrandTotal(null)
      }
    }
  }, [sorting])

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: {
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
  })

  const actionNode = (
    <Button onClick={handleAddNew} className="shrink-0 rounded-md h-8 px-4 text-xs font-semibold gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all">
      <IconPlus className="size-3.5" />
      <span className="hidden sm:inline">Add</span>
    </Button>
  )

  if (!mounted) return null

  // ── Shared props ──────────────────────────────────────────────────────────────
  const sharedFilterProps = {
    purchasers,
    buyerFilter, setBuyerFilter: (v: number | null) => { setBuyerFilter(v) },
    dateFrom, setDateFrom: (v: string) => { setDateFrom(v) },
    dateTo, setDateTo: (v: string) => { setDateTo(v) },
  }

  const sharedCardProps = {
    records: filteredRecords,
    purchasers,
    ovens,
    onEdit: handleEdit,
    onDelete: (id: number) => setDeleteId(id),
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-semibold tracking-tight md:text-xl lg:text-2xl">Tobacco Purchase</h1>
          <p className="text-muted-foreground text-sm sm:text-base sm:text-balance md:max-w-[100%]">
            Manage tobacco purchase records and details.
          </p>
        </div>
      </div>


      {/* ── Mobile & Tablet filter bar (<lg) ── */}
      <MobileFilterBar
        className="flex lg:hidden"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
        {...sharedFilterProps}
      />

      {/* ── Desktop filter bar (≥lg) ── */}
      <div className="hidden lg:block">
        <DataTableToolbar
          table={table}
          action={actionNode}
          view={view}
          setView={setView}
          purchasers={purchasers}
          buyerFilter={buyerFilter}
          setBuyerFilter={setBuyerFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && filteredRecords.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No records match your filters.
        </div>
      )}

      {/* ── Mobile view (<md) ── */}
      {!isLoading && filteredRecords.length > 0 && (
        <MobileView {...sharedCardProps} />
      )}

      {/* ── Tablet view (md→lg) ── */}
      {!isLoading && filteredRecords.length > 0 && (
        <TabletView {...sharedCardProps} />
      )}

      {/* ── Desktop view (≥lg) ── */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="hidden lg:block">
          <DataTable table={table} />
        </div>
      )}

      {/* ── Infinite scroll sentinel ─────────────────────────────────────── */}
      <div ref={sentinelRef} className="h-1" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Dialogs ── */}
      <AddPurchaseDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setSelectedRecord(null)
        }}
        onSuccess={fetchRecords}
        onPrint={handlePrint}
        accessToken={tokens?.access_token || ""}
        initialData={selectedRecord}
        isReadOnly={isViewOnly}
        purchasers={purchasers}
        regions={regions}
        ovens={ovens}
        tobaccoTypes={tobaccoTypes}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase record
              and all its associated details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
