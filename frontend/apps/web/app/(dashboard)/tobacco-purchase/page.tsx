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
import { cn } from "@workspace/ui/lib/utils"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
import { MobileView } from "./_components/mobile-view"
import { TabletView } from "./_components/tablet-view"
import { DesktopView } from "./_components/desktop-view"
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

function getPageNumbers(totalPages: number, page: number): number[] {
  const count = Math.min(totalPages, 5)
  return Array.from({ length: count }, (_, i) => {
    if (totalPages <= 5 || page < 3) return i
    if (page > totalPages - 4) return totalPages - 5 + i
    return page - 2 + i
  })
}

export default function TobaccoPurchasePage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const [records, setRecords] = React.useState<TobaccoPurchase[]>([])
  const [total, setTotal] = React.useState(0)
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
    const t = setTimeout(() => { setSearch(searchInput); setPage(0) }, 400)
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
    setPage(0)
  }

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = React.useState(0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

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
          skip: page * PAGE_SIZE,
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
      setTotal(recData.total)

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
  }, [tokens, page, search, dateFrom, dateTo, buyerFilter, sortGrandTotal, sortNetWeight])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    const timer = setTimeout(() => { fetchRecords() }, 0)
    return () => clearTimeout(timer)
  }, [isAuthLoading, tokens, fetchRecords])

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

  if (!mounted) return null

  // ── Derived state ─────────────────────────────────────────────────────────────
  const filteredRecords = records

  const pageNumbers = getPageNumbers(totalPages, page)

  // ── Shared props ──────────────────────────────────────────────────────────────
  const sharedFilterProps = {
    purchasers,
    buyerFilter, setBuyerFilter: (v: number | null) => { setBuyerFilter(v); setPage(0) },
    dateFrom, setDateFrom: (v: string) => { setDateFrom(v); setPage(0) },
    dateTo, setDateTo: (v: string) => { setDateTo(v); setPage(0) },
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


      {/* ── Mobile filter bar (<md) ── */}
      <MobileFilterBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
        {...sharedFilterProps}
      />

      {/* ── Tablet filter bar (md→lg) ── */}
      <FilterBar
        className="hidden md:flex lg:hidden"
        searchClassName="min-w-36 max-w-56"
        view={view}
        setView={setView}
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
          page={page}
          sortGrandTotal={sortGrandTotal}
          sortNetWeight={sortNetWeight}
          onToggleSort={handleToggleSort}
          onView={handleView}
        />
      )}

      {/* ── Pagination ── */}
      {!isLoading && total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="h-8 px-3 rounded-full border border-border text-xs font-medium transition-all disabled:opacity-40 hover:bg-muted"
            >
              ← Prev
            </button>
            {pageNumbers.map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  "h-8 w-8 rounded-full border text-xs font-medium transition-all",
                  page === pageNum
                    ? "border-[#009640] bg-[#009640] text-white"
                    : "border-border hover:bg-muted"
                )}
              >
                {pageNum + 1}
              </button>
            ))}
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="h-8 px-3 rounded-full border border-border text-xs font-medium transition-all disabled:opacity-40 hover:bg-muted"
            >
              Next →
            </button>
          </div>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
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
