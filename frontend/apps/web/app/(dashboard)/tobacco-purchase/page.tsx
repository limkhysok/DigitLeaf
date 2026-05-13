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
import {
  IconEdit, IconEye, IconLayoutGrid, IconLayoutList,
  IconLoader2, IconPlus, IconSearch, IconTrash,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
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
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")

  // Lookups for mapping IDs to names
  const [purchasers, setPurchasers] = React.useState<PurchaserItem[]>([])
  const [regions, setRegions] = React.useState<RegionItem[]>([])
  const [ovens, setOvens] = React.useState<OvenItem[]>([])
  const [tobaccoTypes, setTobaccoTypes] = React.useState<TobaccoItem[]>([])

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const [pData, rData, oData, tData, recData] = await Promise.all([
        apiClient.getPurchasers(tokens.access_token),
        apiClient.getRegions(tokens.access_token),
        apiClient.getOvens(tokens.access_token),
        apiClient.getTobaccoTypes(tokens.access_token),
        apiClient.getTobaccoPurchases(tokens.access_token)
      ])
      setPurchasers(pData)
      setRegions(rData)
      setOvens(oData)
      setTobaccoTypes(tData)
      setRecords(recData.items)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    const timer = setTimeout(() => {
      fetchRecords()
    }, 0)
    return () => clearTimeout(timer)
  }, [isAuthLoading, tokens, fetchRecords])

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

  const q = search.toLowerCase()
  const filteredRecords = search
    ? records.filter(r =>
        (r.invoice_num?.toLowerCase().includes(q)) ||
        (r.vendor?.toLowerCase().includes(q)) ||
        (purchasers.find(p => p.p_id === r.buyer)?.p_name?.toLowerCase().includes(q))
      )
    : records

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Tobacco Purchase</h1>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">Manage tobacco purchase records and details.</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="shrink-0 rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          New Purchase
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex items-center h-9 flex-1 max-w-sm rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-[#009640]/20 focus-within:border-[#009640] transition-all">
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search invoice, vendor, buyer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
          )}
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center rounded-full border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setView("list")}
            className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "list" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <IconLayoutList className="size-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "grid" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredRecords.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {search ? "No records match your search." : "No records found."}
        </div>
      )}

      {/* List View */}
      {!isLoading && filteredRecords.length > 0 && view === "list" && (
        <Card>
          <CardContent className="p-0">
            <TobaccoPurchaseTable
              records={filteredRecords}
              purchasers={purchasers}
              regions={regions}
              ovens={ovens}
              onEdit={handleEdit}
              onView={handleView}
              onDelete={(id: number) => setDeleteId(id)}
            />
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && filteredRecords.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRecords.map((rec, index) => {
            const purchaser = purchasers.find(p => p.p_id === rec.buyer)
            const region = regions.find(r => r.reg_id === rec.region)
            const oven = ovens.find(o => o.id === rec.oven)
            return (
              <TobaccoPurchaseCard
                key={rec.tp_id}
                rec={rec}
                index={index}
                purchaser={purchaser}
                region={region}
                oven={oven}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={(id) => setDeleteId(id)}
              />
            )
          })}
        </div>
      )}

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

// Grid Card Component
const TobaccoPurchaseCard = React.memo(({
  rec, index, purchaser, region, oven, onEdit, onView, onDelete
}: {
  rec: TobaccoPurchase,
  index: number,
  purchaser?: PurchaserItem,
  region?: RegionItem,
  oven?: OvenItem,
  onEdit: (rec: TobaccoPurchase) => void,
  onView: (rec: TobaccoPurchase) => void,
  onDelete: (id: number) => void
}) => {
  return (
    <div className="group relative flex flex-col gap-2 rounded-sm border border-border bg-card px-3 py-2.5 transition-all duration-200 hover:shadow-sm hover:border-border/80">
      {/* Top row: index + invoice */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-medium text-muted-foreground/60">No. {index + 1}</span>
        <span className="font-mono text-[12px] font-semibold text-foreground truncate">{rec.invoice_num}</span>
      </div>

      {/* Date + Oven */}
      <div className="flex items-center justify-between gap-2 -mt-1">
        <span className="text-[11px] text-muted-foreground">{rec.tp_date || "-"}</span>
        {oven && (
          <span className="text-[10px] text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 truncate max-w-25">{oven.name_en}</span>
        )}
      </div>

      {/* Buyer + Vendor */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-[11px] text-muted-foreground shrink-0">Buyer:</span>
          <span className="text-[13px] font-semibold truncate leading-tight">{purchaser?.p_name || "-"}</span>
        </div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-[11px] text-muted-foreground shrink-0">Vendor:</span>
          <span className="text-[12px] text-muted-foreground truncate">{rec.vendor || "-"}</span>
        </div>
        {region && (
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-[11px] text-muted-foreground shrink-0">Region:</span>
            <span className="text-[12px] text-muted-foreground truncate">{region.reg_name}</span>
          </div>
        )}
      </div>

      {/* Footer: items · weight · total */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/60 gap-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {rec.tobacco_item_count != null && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-muted text-foreground text-[10px] font-bold">
              {rec.tobacco_item_count}
            </span>
          )}
          <span className="font-medium text-foreground tabular-nums">
            {rec.total_net_weight == null ? "-" : rec.total_net_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
          </span>
        </div>
        <span className="text-[12px] font-bold text-foreground tabular-nums">
          {rec.grand_total == null ? "-" : `៛${Math.round(rec.grand_total).toLocaleString()}`}
        </span>
      </div>

      {/* Invisible overlay for view click */}
      <button
        onClick={() => onView(rec)}
        className="absolute inset-0 rounded-sm cursor-pointer focus:outline-none"
        aria-label={`View purchase ${rec.invoice_num}`}
      />

      {/* Action buttons (above overlay) */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 z-10 bg-card/80 backdrop-blur-sm rounded-md px-0.5 py-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onView(rec) }}
          className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-green-600 hover:bg-green-50 transition-colors"
        >
          <IconEye className="size-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(rec) }}
          className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <IconEdit className="size-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(rec.tp_id) }}
          className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <IconTrash className="size-3" />
        </button>
      </div>
    </div>
  )
})

TobaccoPurchaseCard.displayName = "TobaccoPurchaseCard"

// Optimized Table Component
const TobaccoPurchaseTable = React.memo(({
  records, purchasers, regions, ovens, onEdit, onView, onDelete
}: {
  records: TobaccoPurchase[],
  purchasers: PurchaserItem[],
  regions: RegionItem[],
  ovens: OvenItem[],
  onEdit: (rec: TobaccoPurchase) => void,
  onView: (rec: TobaccoPurchase) => void,
  onDelete: (id: number) => void
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/40 border-b">
          <tr>
            <th className="px-4 py-3 font-medium text-muted-foreground w-10 text-center">No</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Invoice</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Buyer</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Vendor</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Region</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Oven</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Items</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-right">Net Weight(KG)</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-right">Grand Total(៛)</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((rec, index) => (
            <TobaccoPurchaseRow
              key={rec.tp_id}
              rec={rec}
              index={index}
              purchaser={purchasers.find(p => p.p_id === rec.buyer)}
              region={regions.find(r => r.reg_id === rec.region)}
              oven={ovens.find(o => o.id === rec.oven)}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
})

const TobaccoPurchaseRow = React.memo(({
  rec, index, purchaser, region, oven, onEdit, onView, onDelete
}: {
  rec: TobaccoPurchase,
  index: number,
  purchaser?: PurchaserItem,
  region?: RegionItem,
  oven?: OvenItem,
  onEdit: (rec: TobaccoPurchase) => void,
  onView: (rec: TobaccoPurchase) => void,
  onDelete: (id: number) => void
}) => {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 text-center text-muted-foreground text-xs">{index + 1}</td>
      <td className="px-4 py-3 font-mono text-[13px] font-semibold text-foreground">{rec.invoice_num}</td>
      <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{rec.tp_date || "-"}</td>
      <td className="px-4 py-3 text-[13px]">{purchaser?.p_name || "-"}</td>
      <td className="px-4 py-3 text-[13px] font-medium">{rec.vendor || "-"}</td>
      <td className="px-4 py-3 text-[13px]">{region?.reg_name || "-"}</td>
      <td className="px-4 py-3 text-[13px]">{oven?.name_en || "-"}</td>
      <td className="px-4 py-3 text-center">
        {rec.tobacco_item_count == null ? (
          <span className="text-muted-foreground text-xs">-</span>
        ) : (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-muted text-foreground text-[11px] font-bold">
            {rec.tobacco_item_count}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-[13px] font-bold text-foreground tabular-nums">
        {rec.total_net_weight == null ? "-" : rec.total_net_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right text-[13px] font-bold text-foreground tabular-nums">
        {rec.grand_total == null ? "-" : `៛${Math.round(rec.grand_total).toLocaleString()}`}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-green-600 hover:bg-green-50"
            onClick={() => onView(rec)}
          >
            <IconEye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
            onClick={() => onEdit(rec)}
          >
            <IconEdit className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(rec.tp_id)}
          >
            <IconTrash className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
})

TobaccoPurchaseTable.displayName = "TobaccoPurchaseTable"
TobaccoPurchaseRow.displayName = "TobaccoPurchaseRow"
