"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import {
  apiClient,
  TobaccoPurchase,
} from "@/services/api-client"
import { toast } from "sonner"
import { IconCirclePlusFilled, IconLoader2 } from "@tabler/icons-react"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { MobileView } from "./_components/mobile-view"
import { TabletView } from "./_components/tablet-view"
import { DataTableToolbar } from "./_components/data-table-toolbar"
import { DataTable } from "./_components/data-table"
import { getColumns } from "./_components/columns"
import { getCoreRowModel, VisibilityState } from "@tanstack/react-table"
import { useReactTable } from "@/utils/table-utils"
import { Button } from "@workspace/ui/components/button"
import { printInvoice, downloadInvoicePdf, InvoiceData } from "./_components/invoice-print"
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

// ── NEW IMPORTS ──
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { useQueryState, parseAsInteger, parseAsString } from "nuqs"
import { useDebounce } from "use-debounce"
import { useInView } from "react-intersection-observer"
import { Skeleton } from "@workspace/ui/components/skeleton"

const PAGE_SIZE = 20

type SortDir = "asc" | "desc" | null

export default function TobaccoPurchasePage() {


  const { tokens } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<TobaccoPurchase | null>(null)
  const [isViewOnly, setIsViewOnly] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // ── Search & Filters (nuqs + use-debounce) ──
  const [searchInput, setSearchInput] = useQueryState("search", parseAsString.withDefault(""))
  const [search] = useDebounce(searchInput, 400)

  const [buyerFilter, setBuyerFilter] = useQueryState("buyer", parseAsInteger)
  const [regionFilter, setRegionFilter] = useQueryState("region", parseAsInteger)
  const [sortGrandTotal, setSortGrandTotal] = useQueryState("sort_grand_total", parseAsString)
  const [sortNetWeight, setSortNetWeight] = useQueryState("sort_net_weight", parseAsString)

  // ── Lookup Data (React Query) ──
  const { data: metadata } = useQuery({
    queryKey: ["tobacco-purchase-metadata"],
    queryFn: () => apiClient.getFormMetadata(tokens!.access_token),
    enabled: !!tokens?.access_token,
  })

  // Safe fallbacks
  const purchasers = React.useMemo(() => metadata?.purchasers ?? [], [metadata])
  const regions = React.useMemo(() => metadata?.regions ?? [], [metadata])
  const ovens = React.useMemo(() => metadata?.ovens ?? [], [metadata])
  const tobaccoTypes = React.useMemo(() => metadata?.tobacco_types ?? [], [metadata])

  // ── Infinite Query (React Query) ──
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["tobacco-purchases", search, buyerFilter, regionFilter, sortGrandTotal, sortNetWeight],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.getTobaccoPurchases(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        search: search || undefined,
        buyer: buyerFilter ?? undefined,
        region: regionFilter ?? undefined,
        sort_grand_total: (sortGrandTotal as SortDir) ?? undefined,
        sort_net_weight: (sortNetWeight as SortDir) ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!tokens?.access_token,
  })

  const records = React.useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

  // ── IntersectionObserver (react-intersection-observer) ──
  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ── Actions ──
  const openRecord = React.useCallback(async (record: TobaccoPurchase, viewOnly: boolean) => {
    if (!tokens?.access_token) return
    try {
      const full = await apiClient.getTobaccoPurchase(tokens.access_token, record.tp_id)
      setSelectedRecord(full)
      setIsViewOnly(viewOnly)
      setDialogOpen(true)
    } catch {
      toast.error(t.tobaccoPurchase.list.toastLoadDetailsError)
    }
  }, [tokens, t])

  const handleEdit = React.useCallback((record: TobaccoPurchase) => openRecord(record, false), [openRecord])
  const handleView = React.useCallback((record: TobaccoPurchase) => openRecord(record, true), [openRecord])

  const handleDelete = async () => {
    if (!deleteId || !tokens?.access_token) return
    setIsDeleting(true)
    try {
      await apiClient.deleteTobaccoPurchase(tokens.access_token, deleteId)
      toast.success(t.tobaccoPurchase.list.toastDeleteSuccess)
      queryClient.invalidateQueries({ queryKey: ["tobacco-purchases"] })
      queryClient.invalidateQueries({ queryKey: ["farmer-contracts"] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays"] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-years"] })
      queryClient.resetQueries({ queryKey: ["sack-registrations"] })
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

  const loadInvoiceData = React.useCallback(async (record: TobaccoPurchase): Promise<InvoiceData | null> => {
    if (!tokens?.access_token) return null
    const accessToken = tokens.access_token

    const fullPromise = record.details && record.details.length > 0
      ? Promise.resolve(record)
      : apiClient.getTobaccoPurchase(accessToken, record.tp_id)

    // Cached per buyer — this list rarely changes, so repeat downloads/prints
    // for the same buyer skip the network round-trip entirely.
    const vendorsPromise = record.buyer && record.vendor_id
      ? queryClient.fetchQuery({
          queryKey: ["vendors-by-buyer", record.buyer],
          queryFn: () => apiClient.getVendorsByBuyer(accessToken, record.buyer!),
          staleTime: 5 * 60 * 1000,
        }).catch(() => [])
      : Promise.resolve([])

    const [full, vendorsList] = await Promise.all([fullPromise, vendorsPromise])

    const vItem = vendorsList.find((v) => String(v.mf_id) === String(record.vendor_id))
    const mfCode = vItem?.mf_code

    return { record: full, purchasers, regions, ovens, tobaccoTypes, mfCode }
  }, [tokens, purchasers, regions, ovens, tobaccoTypes, queryClient])

  const handlePrint = React.useCallback(async (record: TobaccoPurchase) => {
    try {
      const data = await loadInvoiceData(record)
      if (!data) return
      await printInvoice(data)
    } catch {
      toast.error(t.tobaccoPurchase.list.toastLoadPrintError)
    }
  }, [loadInvoiceData, t])

  const handleDownloadPdf = React.useCallback(async (record: TobaccoPurchase) => {
    const toastId = toast.loading(t.tobaccoPurchase.list.toastGeneratingPdf)
    try {
      const data = await loadInvoiceData(record)
      if (!data) {
        toast.dismiss(toastId)
        return
      }
      await downloadInvoicePdf(data)
      toast.success(t.tobaccoPurchase.list.toastDownloadSuccess, { id: toastId })
    } catch {
      toast.error(t.tobaccoPurchase.list.toastDownloadError, { id: toastId })
    }
  }, [loadInvoiceData, t])

  // ── Derived state ──
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const columns = React.useMemo(() => getColumns({
    t,
    purchasers,
    regions,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: (id: number) => setDeleteId(id),
    onPrint: handlePrint,
    onDownload: handleDownloadPdf,
  }), [t, purchasers, regions, handleView, handleEdit, handlePrint, handleDownloadPdf])

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
  }, [sorting, setSortGrandTotal, setSortNetWeight])

  const table = useReactTable({
    data: records,
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
    <Button size="sm" onClick={handleAddNew} className="h-8 px-2 flex gap-1.5 rounded-sm">
      <IconCirclePlusFilled className="h-4 w-4" />
      <span className="hidden sm:inline">{t.tobaccoPurchase.filters.add}</span>
    </Button>
  )



  // ── Shared props ──
  const sharedFilterProps = {
    purchasers,
    buyerFilter, setBuyerFilter: (v: number | null) => { setBuyerFilter(v) },
    regions,
    regionFilter, setRegionFilter: (v: number | null) => { setRegionFilter(v) },
  }

  const sharedCardProps = {
    records,
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
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.tobaccoPurchase.title}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
            {t.tobaccoPurchase.subtitle}
          </p>
        </div>
      </div>

      {/* ── Mobile & Tablet filter bar (<lg) ── */}
      <MobileFilterBar
        className="flex lg:hidden"
        searchInput={searchInput || ""}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
        {...sharedFilterProps}
      />

      {/* ── Desktop filter bar (≥lg) ── */}
      <div className="hidden lg:block">
        <DataTableToolbar
          table={table}
          action={actionNode}
          purchasers={purchasers}
          buyerFilter={buyerFilter}
          setBuyerFilter={setBuyerFilter}
          regions={regions}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          searchInput={searchInput || ""}
          setSearchInput={setSearchInput}
        />
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-25" />
              <Skeleton className="h-8 w-25" />
            </div>
            <Skeleton className="h-8 w-62.5" />
          </div>
          <div className="rounded-md border mt-2">
            <div className="h-10 border-b bg-muted/20" />
            {[1, 2, 3, 4, 5].map((id) => (
              <div key={id} className="flex items-center p-4 border-b last:border-0">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && records.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t.tobaccoPurchase.table.noRecordsMatch}
        </div>
      )}

      {/* ── Mobile view (<md) ── */}
      {!isLoading && records.length > 0 && (
        <MobileView {...sharedCardProps} />
      )}

      {/* ── Tablet view (md→lg) ── */}
      {!isLoading && records.length > 0 && (
        <TabletView {...sharedCardProps} />
      )}

      {/* ── Desktop view (≥lg) ── */}
      {!isLoading && records.length > 0 && (
        <div className="hidden lg:block">
          <DataTable table={table} noRecordsText={t.tobaccoPurchase.table.noRecordsMatch} />
        </div>
      )}

      {/* ── Infinite scroll sentinel ── */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
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
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tobacco-purchases"] })
          queryClient.invalidateQueries({ queryKey: ["farmer-contracts"] })
          queryClient.invalidateQueries({ queryKey: ["tobacco-repays"] })
          queryClient.invalidateQueries({ queryKey: ["tobacco-repay-years"] })
          queryClient.invalidateQueries({ queryKey: ["vendorContracts"] })
          queryClient.resetQueries({ queryKey: ["sack-registrations"] })
        }}
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
            <AlertDialogTitle>{t.tobaccoPurchase.list.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tobaccoPurchase.list.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">{t.tobaccoPurchase.list.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? t.tobaccoPurchase.list.deleting : t.tobaccoPurchase.list.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
