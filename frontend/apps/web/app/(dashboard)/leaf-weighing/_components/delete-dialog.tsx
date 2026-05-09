"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"

export function DeleteDialog({
  target,
  onClose,
  onSuccess,
  accessToken,
}: {
  readonly target: { id: number; no: number } | null
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const confirmDelete = async () => {
    if (!accessToken || !target) return
    setIsDeleting(true)
    try {
      await apiClient.deleteWeighLeaf(accessToken, target.id)
      toast.success("Record deleted")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete row{" "}
            <span className="font-medium text-foreground">No. {target?.no}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline"
            className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
            onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button type="button" onClick={confirmDelete} disabled={isDeleting}
            className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-600 hover:bg-red-700 text-white border-transparent">
            {isDeleting && <IconLoader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
