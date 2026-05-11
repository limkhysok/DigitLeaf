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
  MemberFarmerItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconEdit, IconEye, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
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

  // Lookups for mapping IDs to names
  const [purchasers, setPurchasers] = React.useState<PurchaserItem[]>([])
  const [regions, setRegions] = React.useState<RegionItem[]>([])
  const [ovens, setOvens] = React.useState<OvenItem[]>([])
  const [tobaccoTypes, setTobaccoTypes] = React.useState<TobaccoItem[]>([])
  const [farmers, setFarmers] = React.useState<MemberFarmerItem[]>([])

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const [pData, rData, oData, tData, fData, recData] = await Promise.all([
        apiClient.getPurchasers(tokens.access_token),
        apiClient.getRegions(tokens.access_token),
        apiClient.getOvens(tokens.access_token),
        apiClient.getTobaccoTypes(tokens.access_token),
        apiClient.getMemberFarmers(tokens.access_token),
        apiClient.getTobaccoPurchases(tokens.access_token)
      ])
      setPurchasers(pData)
      setRegions(rData)
      setOvens(oData)
      setTobaccoTypes(tData)
      setFarmers(fData)
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

  const handleEdit = (record: TobaccoPurchase) => {
    setSelectedRecord(record)
    setIsViewOnly(false)
    setDialogOpen(true)
  }

  const handleView = (record: TobaccoPurchase) => {
    setSelectedRecord(record)
    setIsViewOnly(true)
    setDialogOpen(true)
  }

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    if (records.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No records found.
        </div>
      )
    }

    return (
      <TobaccoPurchaseTable
        records={records}
        purchasers={purchasers}
        regions={regions}
        ovens={ovens}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={(id: number) => setDeleteId(id)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl text-foreground">Tobacco Purchase</h1>
          <p className="text-xs text-muted-foreground tracking-wide">Manage tobacco purchase records and details.</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          New Purchase
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>

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
        farmers={farmers}
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
            <th className="px-4 py-3 font-medium text-muted-foreground w-12 text-center">No</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Invoice</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Buyer</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Vendor</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Region</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Address</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Assigned By</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Oven</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-right">Rate(Riels)</th>
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
      <td className="px-4 py-3 text-center text-muted-foreground">{index + 1}</td>
      <td className="px-4 py-3 font-mono  font-medium text-primary">{rec.invoice_num}</td>
      <td className="px-4 py-3">{purchaser?.p_name || "-"}</td>
      <td className="px-4 py-3">{rec.vendor || "-"}</td>
      <td className="px-4 py-3 ">{region?.reg_name || "-"}</td>
      <td className="px-4 py-3 ">{rec.v_addr || "-"}</td>
      <td className="px-4 py-3 text-muted-foreground">{rec.user || "-"}</td>
      <td className="px-4 py-3 ">{oven?.name_en || "-"}</td>
      <td className="px-4 py-3 text-right font-medium">{rec.rate.toLocaleString()}</td>
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
