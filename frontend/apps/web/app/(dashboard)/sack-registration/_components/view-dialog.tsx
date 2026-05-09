"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
import { IconPencil } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { RegistrationDetail } from "./registration-detail"

export function ViewDialog({
  target,
  onClose,
  onEdit,
}: {
  readonly target: SackRegistrationItem | null
  readonly onClose: () => void
  readonly onEdit: (rec: SackRegistrationItem) => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registration Detail</DialogTitle>
          <DialogDescription>
            Full details for this sack registration record.
          </DialogDescription>
        </DialogHeader>
        {target && <RegistrationDetail target={target} />}
        <DialogFooter>
          <Button variant="outline" className="rounded-full h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose}>Close</Button>
          <Button
            className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
            onClick={() => { if (target) { onClose(); onEdit(target) } }}
          >
            <IconPencil className="size-3.5" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
