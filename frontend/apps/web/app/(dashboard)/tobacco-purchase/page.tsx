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
  IconCalendar, IconUser, IconFlame, IconMapPin
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
          className="shrink-0 rounded-md h-9 px-4 text-xs font-bold uppercase tracking-wide gap-2 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent transition-all"
        >
          <IconPlus className="size-4" />
          New Purchase
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex items-center h-9 flex-1 max-w-sm rounded-md border border-slate-200 bg-transparent px-3 gap-2.5 shadow-xs focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
          <IconSearch className="size-4 shrink-0 text-slate-400" stroke={1.5} />
          <input
            className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder:text-slate-400"
            placeholder="Search invoice, vendor, buyer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-slate-400 hover:text-slate-600 text-xs p-1">✕</button>
          )}
        </div>

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center rounded-md border border-input p-1 gap-1 bg-background shadow-sm">
          <button
            onClick={() => setView("list")}
            className={cn("flex items-center justify-center h-7 px-2 rounded-sm transition-all duration-200 gap-1.5 text-xs font-medium", view === "list" ? "bg-secondary text-secondary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <IconLayoutList className="size-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn("flex items-center justify-center h-7 px-2 rounded-sm transition-all duration-200 gap-1.5 text-xs font-medium", view === "grid" ? "bg-secondary text-secondary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
          >
            <IconLayoutGrid className="size-3.5" />
            <span>Grid</span>
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
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:ring-1 hover:ring-emerald-500/20">
      {/* Card Header: Invoice & Actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-5 rounded bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
            {index + 1}
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-600 tracking-tight">
            {rec.invoice_num}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <button onClick={() => onView(rec)} className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all">
            <IconEye className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={() => onEdit(rec)} className="p-1.5 rounded-md hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all">
            <IconEdit className="size-3.5" stroke={1.5} />
          </button>
          <button onClick={() => onDelete(rec.tp_id)} className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all">
            <IconTrash className="size-3.5" stroke={1.5} />
          </button>
        </div>
      </div>

      {/* Card Body: Main Participants */}
      <div className="p-4 flex flex-col gap-5 flex-1">
        <div className="space-y-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <IconUser className="size-3" stroke={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Purchaser</span>
            </div>
            <p className="text-[13px] font-semibold text-slate-900 leading-tight line-clamp-1 pl-4.5">
              {purchaser?.p_name || "Direct Sale"}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <IconCalendar className="size-3" stroke={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Vendor & Date</span>
            </div>
            <div className="flex items-center gap-2 pl-4.5">
              <p className="text-[12px] font-medium text-slate-700 truncate">
                {rec.vendor || "Farmer"}
              </p>
              <div className="size-1 rounded-full bg-slate-200" />
              <p className="text-[12px] font-medium text-slate-500 shrink-0">
                {rec.tp_date || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-3 rounded-md bg-slate-50 border border-slate-100">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Region</span>
            <div className="flex items-center gap-1.5">
              <IconMapPin className="size-3 text-slate-300" stroke={1.5} />
              <span className="text-[11px] font-medium text-slate-700 truncate">{region?.reg_name || "-"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Processing</span>
            <div className="flex items-center gap-1.5 justify-end">
              <IconFlame className="size-3 text-slate-300" stroke={1.5} />
              <span className="text-[11px] font-medium text-slate-700 truncate">{oven?.name_en || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Totals */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 mt-auto flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Net weight</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-bold text-slate-900 tabular-nums">
              {rec.total_net_weight?.toLocaleString(undefined, { minimumFractionDigits: 1 }) || "0.0"}
            </span>
            <span className="text-[10px] font-bold text-slate-400">KG</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[9px] font-black uppercase text-emerald-600/80 tracking-wider">Total amount</span>
          <div className="flex items-baseline gap-0.5 text-emerald-600">
            <span className="text-[11px] font-bold">៛</span>
            <span className="text-[16px] font-black tabular-nums">
              {Math.round(rec.grand_total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Click Overlay */}
      <button
        onClick={() => onView(rec)}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none"
        aria-label={`View ${rec.invoice_num}`}
      />
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
        <thead className="bg-slate-50/50 border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider w-10 text-center">No.</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Invoice</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Buyer</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Vendor</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Region</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider">Oven</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Items</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Net Weight</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-right">Grand Total</th>
            <th className="px-4 py-3 font-bold text-slate-400 text-[10px] uppercase tracking-wider text-center">Actions</th>
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
    <tr className="group/row hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
      <td className="px-4 py-3 text-center text-slate-400 text-xs">{index + 1}</td>
      <td className="px-4 py-3 font-mono text-[13px] font-semibold text-slate-900">{rec.invoice_num}</td>
      <td className="px-4 py-3 text-[13px] text-slate-500 whitespace-nowrap">{rec.tp_date || "-"}</td>
      <td className="px-4 py-3 text-[13px] text-slate-900">{purchaser?.p_name || "-"}</td>
      <td className="px-4 py-3 text-[13px] font-medium text-slate-700">{rec.vendor || "-"}</td>
      <td className="px-4 py-3 text-[13px] text-slate-500">{region?.reg_name || "-"}</td>
      <td className="px-4 py-3 text-[13px] text-slate-500">{oven?.name_en || "-"}</td>
      <td className="px-4 py-3 text-center">
        {rec.tobacco_item_count == null ? (
          <span className="text-slate-300 text-xs">-</span>
        ) : (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            {rec.tobacco_item_count}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-900 tabular-nums">
        {rec.total_net_weight == null ? "-" : rec.total_net_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-4 py-3 text-right text-[13px] font-black text-emerald-600 tabular-nums">
        {rec.grand_total == null ? "-" : `៛${Math.round(rec.grand_total).toLocaleString()}`}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1 opacity-60 group-hover/row:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            onClick={() => onView(rec)}
          >
            <IconEye className="size-3.5" stroke={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => onEdit(rec)}
          >
            <IconEdit className="size-3.5" stroke={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(rec.tp_id)}
          >
            <IconTrash className="size-3.5" stroke={1.5} />
          </Button>
        </div>
      </td>
    </tr>
  )
})

TobaccoPurchaseTable.displayName = "TobaccoPurchaseTable"
TobaccoPurchaseRow.displayName = "TobaccoPurchaseRow"
