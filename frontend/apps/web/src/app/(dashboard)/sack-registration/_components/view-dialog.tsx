"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/services/api-client"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { useLanguage } from "@/hooks/use-language"
import { RegistrationDetail } from "./registration-detail"

export function ViewDialog({
  target,
  onClose,
  onEdit,
  onDelete,
}: {
  readonly target: SackRegistrationItem | null
  readonly onClose: () => void
  readonly onEdit: (rec: SackRegistrationItem) => void
  readonly onDelete: (rec: SackRegistrationItem) => void
}) {
  const { t } = useLanguage()
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.sackRegistration.dialog.viewTitle}</DialogTitle>
          <DialogDescription>
            {t.sackRegistration.dialog.viewSubtitle}
          </DialogDescription>
        </DialogHeader>
        {target && <RegistrationDetail target={target} />}
        <DialogFooter>
          <Button className="rounded-md" variant="outline" onClick={onClose}>
            {t.sackRegistration.dialog.close}
          </Button>
          <Button
            className="rounded-md"
            variant="destructive"
            onClick={() => { if (target) { onClose(); onDelete(target) } }}
          >
            <IconTrash className="mr-2 h-4 w-4" />
            {t.sackRegistration.dialog.delete}
          </Button>
          <Button
            className="rounded-md"
            onClick={() => { if (target) { onClose(); onEdit(target) } }}
          >
            <IconPencil className="mr-2 h-4 w-4" />
            {t.sackRegistration.dialog.edit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
