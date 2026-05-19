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
  IconEdit, IconEye, IconLoader2, IconTrash,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { AddPurchaseDialog } from "./_components/add-purchase-dialog"
import { TobaccoPurchaseCard } from "./_components/tobacco-purchase-card"
import { FilterBar } from "./_components/filter-bar"
import { MobileFilterBar } from "./_components/mobile-filter-bar"
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
    const timer = setTimeout(() => { fetchRecords() }, 0)
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

      {/* ════════════════════════════════════════════════════════════════════
          HEADER — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Tobacco Purchase</h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            Manage tobacco purchase records and details.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FILTER BAR — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      <MobileFilterBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
      />

      {/* ════════════════════════════════════════════════════════════════════
          TABLET FILTER BAR — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      <FilterBar
        className="hidden md:flex lg:hidden"
        searchClassName="min-w-36 max-w-56"
        view={view}
        setView={setView}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
      />

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP FILTER BAR — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      <FilterBar
        className="hidden lg:flex"
        searchClassName="min-w-40 max-w-xs"
        view={view}
        setView={setView}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onAdd={handleAddNew}
      />

      {/* ════════════════════════════════════════════════════════════════════
          LOADING / EMPTY STATES — shared
      ════════════════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && filteredRecords.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {search ? "No records match your search." : "No records found."}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {filteredRecords.map((rec, index) => (
            <TobaccoPurchaseCard
              key={rec.tp_id}
              rec={rec}
              index={index}
              purchaser={purchasers.find(p => p.p_id === rec.buyer)}
              region={regions.find(r => r.reg_id === rec.region)}
              oven={ovens.find(o => o.id === rec.oven)}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-3">
          {filteredRecords.map((rec, index) => (
            <TobaccoPurchaseCard
              key={rec.tp_id}
              rec={rec}
              index={index}
              purchaser={purchasers.find(p => p.p_id === rec.buyer)}
              region={regions.find(r => r.reg_id === rec.region)}
              oven={ovens.find(o => o.id === rec.oven)}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="hidden lg:block">
          {view === "list" ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-[#F9FAFB] border-gray-200">
                        <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-10">No.</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Buyer</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Vendor</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Region</th>
                        <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Oven</th>
                        <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3 text-right font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Net Weight</th>
                        <th className="px-4 py-3 text-right font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">Grand Total</th>
                        <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-10">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((rec, index) => {
                        const purchaser = purchasers.find(p => p.p_id === rec.buyer)
                        const region = regions.find(r => r.reg_id === rec.region)
                        const oven = ovens.find(o => o.id === rec.oven)
                        return (
                          <tr
                            key={rec.tp_id}
                            className={cn(
                              "group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors",
                              index % 2 === 1 && "bg-[#F9FAFB]/60"
                            )}
                          >
                            <td className="px-4 py-3 text-center text-[#9CA3AF] text-xs">{index + 1}</td>
                            <td className="px-4 py-3 font-mono text-[13px] font-semibold text-[#111827]">{rec.invoice_num}</td>
                            <td className="px-4 py-3 text-[13px] text-[#9CA3AF] whitespace-nowrap">{rec.tp_date || "-"}</td>
                            <td className="px-4 py-3 text-[#111827] font-semibold">{purchaser?.p_name || "-"}</td>
                            <td className="px-4 py-3 text-[#374151]">{rec.vendor || "-"}</td>
                            <td className="px-4 py-3 text-[#6B7280] text-xs font-medium">{region?.reg_name || "-"}</td>
                            <td className="px-4 py-3 text-[#6B7280] text-xs font-medium">{oven?.name_en || "-"}</td>
                            <td className="px-4 py-3 text-center">
                              {rec.tobacco_item_count == null ? (
                                <span className="text-[#9CA3AF] text-xs">-</span>
                              ) : (
                                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#F3F4F6] text-[#374151] text-[11px] font-bold">
                                  {rec.tobacco_item_count}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-[13px] font-bold text-[#111827] tabular-nums">
                              {rec.total_net_weight == null ? "-" : rec.total_net_weight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-[13px] font-black text-[#009640] tabular-nums">
                              {rec.grand_total == null ? "-" : `៛${Math.round(rec.grand_total).toLocaleString()}`}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleView(rec)}
                                  className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                                >
                                  <IconEye className="size-4" stroke={1.5} />
                                </button>
                                <button
                                  onClick={() => handleEdit(rec)}
                                  className="p-1 rounded-md hover:bg-[#F0FDF4] text-[#9CA3AF] hover:text-[#009640] transition-colors"
                                >
                                  <IconEdit className="size-4" stroke={1.5} />
                                </button>
                                <button
                                  onClick={() => setDeleteId(rec.tp_id)}
                                  className="p-1 rounded-md hover:bg-rose-50 text-[#9CA3AF] hover:text-rose-600 transition-colors"
                                >
                                  <IconTrash className="size-4" stroke={1.5} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredRecords.map((rec, index) => (
                <TobaccoPurchaseCard
                  key={rec.tp_id}
                  rec={rec}
                  index={index}
                  purchaser={purchasers.find(p => p.p_id === rec.buyer)}
                  region={regions.find(r => r.reg_id === rec.region)}
                  oven={ovens.find(o => o.id === rec.oven)}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          )}
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
