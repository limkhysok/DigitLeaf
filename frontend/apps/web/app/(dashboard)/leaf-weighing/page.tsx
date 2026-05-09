"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  WeighLeafItem,
  TobaccoItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { AddLeafSackDialog } from "./_components/add-leaf-sack-dialog"

export default function LeafPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()

  const [records, setRecords] = React.useState<WeighLeafItem[]>([])
  const [leafTypes, setLeafTypes] = React.useState<TobaccoItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<WeighLeafItem | null>(null)

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const data = await apiClient.getWeighLeaves(tokens.access_token)
      setRecords(data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    const init = async () => {
      try {
        const [types] = await Promise.all([
          apiClient.getLeafTypes(tokens.access_token),
          fetchRecords(),
        ])
        setLeafTypes(types)
      } catch { /* fetchRecords handles its own errors */ }
    }
    init()
  }, [isAuthLoading, tokens, fetchRecords])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl text-foreground">Leaf</h1>
          <p className="text-xs text-muted-foreground tracking-wide">Weigh and record leaf sacks.</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          Add Leaf Sack
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && records.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No records yet.
            </div>
          )}
          {!isLoading && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack #</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Leaf Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remork (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total Weight (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recorded By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">#{rec.sack_registration_id}</td>
                      <td className="px-4 py-3">{rec.user_name}</td>
                      <td className="px-4 py-3">{rec.leaf_type_name}</td>
                      <td className="px-4 py-3">{rec.total_in_kg}</td>
                      <td className="px-4 py-3">{rec.sack_in_kg}</td>
                      <td className="px-4 py-3">{rec.remork}</td>
                      <td className="px-4 py-3">{rec.total_weight_in_kg}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{rec.dl_user_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditTarget(rec)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <IconPencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditDialog target={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchRecords} accessToken={tokens?.access_token} leafTypes={leafTypes} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={fetchRecords} accessToken={tokens?.access_token} />
      <AddLeafSackDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={fetchRecords} accessToken={tokens?.access_token} leafTypes={leafTypes} />
    </div>
  )
}
