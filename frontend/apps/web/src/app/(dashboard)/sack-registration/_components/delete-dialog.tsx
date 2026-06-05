"use client"

import * as React from "react"
import { apiClient } from "@/services/api-client"
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

import { useLanguage } from "@/hooks/use-language"

export function DeleteDialog({
  target,
  onClose,
  onSuccess,
  accessToken,
}: {
  readonly target: { readonly id: number; readonly no: number } | null
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
}) {
  const { t } = useLanguage()
  const [isDeleting, setIsDeleting] = React.useState(false)

  const confirmDelete = async () => {
    if (!accessToken || !target) return
    setIsDeleting(true)
    try {
      await apiClient.deleteSackRegistration(accessToken, target.id)
      toast.success(t.sackRegistration.dialog.deleteSuccessToast)
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
          <DialogTitle>{t.sackRegistration.dialog.deleteTitle}</DialogTitle>
          <DialogDescription>
            {t.sackRegistration.dialog.deleteConfirm.replace("{no}", String(target?.no ?? ""))}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-md h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose} disabled={isDeleting}>{t.sackRegistration.dialog.cancel}</Button>
          <Button type="button" onClick={confirmDelete} disabled={isDeleting} className="rounded-md h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-600 hover:bg-red-700 text-white border-transparent">
            {isDeleting && <IconLoader2 className="size-3.5 animate-spin" />}
            {t.sackRegistration.dialog.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
