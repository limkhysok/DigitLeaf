"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
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
        <DialogFooter className="flex-row items-center justify-end gap-2 sm:justify-end">
          <Button
            className="rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
            onClick={() => { if (target) { onClose(); onEdit(target) } }}
          >
            <IconPencil className="size-3.5" />
            {t.sackRegistration.dialog.edit}
          </Button>
          <Button
            variant="destructive"
            className="rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-500 hover:bg-red-600 text-white border-transparent"
            onClick={() => { if (target) { onClose(); onDelete(target) } }}
          >
            <IconTrash className="size-3.5" />
            {t.sackRegistration.dialog.delete}
          </Button>
          <Button variant="outline" className="rounded-full h-9 px-4 text-xs capitalize tracking-wide" onClick={onClose}>{t.sackRegistration.dialog.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
