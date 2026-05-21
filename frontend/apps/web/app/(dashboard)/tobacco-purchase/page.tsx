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
import { IconLoader2 } from "@tabler/icons-react"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { MobileView } from "./_components/mobile-view"
import { TabletView } from "./_components/tablet-view"
import { DesktopView } from "./_components/desktop-view"
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

function nextSortDir(prev: SortDir): SortDir {
  if (prev === "desc") return "asc"
  if (prev === "asc") return null
  return "desc"
}



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

  // ── Sort ────────────────────────────────────────────────────────────────────
  const [sortGrandTotal, setSortGrandTotal] = React.useState<SortDir>(null)
  const [sortNetWeight, setSortNetWeight] = React.useState<SortDir>(null)

  const handleToggleSort = (col: "grand_total" | "net_weight") => {
    if (col === "grand_total") {
      setSortGrandTotal(prev => nextSortDir(prev))
      setSortNetWeight(null)
    } else {
      setSortNetWeight(prev => nextSortDir(prev))
      setSortGrandTotal(null)
    }
  }

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

  const handleEdit = (record: TobaccoPurchase) => openRecord(record, false)
  const handleView = (record: TobaccoPurchase) => openRecord(record, true)

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
      await printInvoice({
        record: full,
        purchasers,
        regions,
        ovens,
        tobaccoTypes,
      })
    } catch {
      toast.error("Failed to load purchase details for printing")
    }
  }, [tokens, purchasers, regions, ovens, tobaccoTypes])

  if (!mounted) return null

  // ── Derived state ─────────────────────────────────────────────────────────────
  const filteredRecords = records

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
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Tobacco Purchase</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
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
      <FilterBar
        className="hidden lg:flex"
        searchClassName="min-w-40 max-w-xs"
        view={view}
        setView={setView}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
        {...sharedFilterProps}
      />

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
        <DesktopView
          {...sharedCardProps}
          view={view}
          sortGrandTotal={sortGrandTotal}
          sortNetWeight={sortNetWeight}
          onToggleSort={handleToggleSort}
          onView={handleView}
          onPrint={handlePrint}
        />
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
