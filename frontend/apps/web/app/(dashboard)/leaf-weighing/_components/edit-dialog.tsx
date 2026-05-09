"use client"

import * as React from "react"
import { apiClient, WeighLeafItem, TobaccoItem } from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { computeWeight } from "./utils"

export function EditDialog({
  target,
  onClose,
  onSuccess,
  accessToken,
  leafTypes,
}: {
  readonly target: WeighLeafItem | null
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
  readonly leafTypes: TobaccoItem[]
}) {
  const [editLeafTypeId, setEditLeafTypeId] = React.useState("")
  const [editTotalInKg, setEditTotalInKg] = React.useState("")
  const [editRemork, setEditRemork] = React.useState("")
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (target) {
      const timer = setTimeout(() => {
        setEditLeafTypeId(String(target.leaf_type_id))
        setEditTotalInKg(String(target.total_in_kg))
        setEditRemork(String(target.remork))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [target])

  const editCalcTotalWeight = target
    ? computeWeight(editTotalInKg, editRemork, target.sack_in_kg)
    : null

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!accessToken || !target) return
    setIsEditSubmitting(true)
    try {
      await apiClient.updateWeighLeaf(accessToken, target.id, {
        leaf_type_id: Number(editLeafTypeId),
        total_in_kg: Number(editTotalInKg),
        remork: Number(editRemork),
      })
      toast.success("Record updated")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsEditSubmitting(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Leaf Record</DialogTitle>
          <DialogDescription>Update the leaf weighing record details.</DialogDescription>
        </DialogHeader>
        {target && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
              <p className="text-muted-foreground">Sack: <span className="font-mono text-foreground">#{target.sack_registration_id}</span></p>
              <p className="text-muted-foreground">User: <span className="text-foreground">{target.user_name}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Leaf Type</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none"
                value={editLeafTypeId}
                onChange={(e) => setEditLeafTypeId(e.target.value)}
                required
              >
                <option value="">Select leaf type...</option>
                {leafTypes.map((t) => (
                  <option key={t.t_id} value={t.t_id}>{t.t_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total (kg)</Label>
              <Input className="h-9 text-sm" type="number" min={0} step="0.01" value={editTotalInKg}
                onChange={(e) => setEditTotalInKg(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Remork</Label>
              <Input className="h-9 text-sm" type="number" min={0} step="1" value={editRemork}
                onChange={(e) => setEditRemork(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total Weight (kg)</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                {editCalcTotalWeight ?? "—"}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline"
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
                onClick={onClose} disabled={isEditSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isEditSubmitting}
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
                {isEditSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
