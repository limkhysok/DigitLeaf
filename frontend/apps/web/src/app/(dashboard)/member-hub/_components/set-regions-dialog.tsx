"use client"

import * as React from "react"
import { IconLoader2, IconMapPin } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, type RegionItem, type UserProfile } from "@/services/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"

interface SetRegionsDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  member: UserProfile | null
  regions: RegionItem[]
}

export function SetRegionsDialog({ open, onOpenChange, member, regions }: Readonly<SetRegionsDialogProps>) {
  const { tokens } = useAuth()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

  // Reset the checklist whenever the target member changes (adjust-during-render pattern)
  const [prevMemberId, setPrevMemberId] = React.useState<number | null>(null)
  const memberKey = member && open ? member.id : null
  if (memberKey !== prevMemberId) {
    setPrevMemberId(memberKey)
    if (member && open) {
      setSelectedIds(new Set(member.regions))
    }
  }

  function toggleRegion(regId: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(regId)
      else next.delete(regId)
      return next
    })
  }

  function toggleAllRegions(checked: boolean) {
    setSelectedIds(checked ? new Set(regions.map((r) => r.reg_id)) : new Set())
  }

  const isAllSelected = regions.length > 0 && regions.every((r) => selectedIds.has(r.reg_id))
  const isSomeSelected = !isAllSelected && regions.some((r) => selectedIds.has(r.reg_id))

  const { mutate: saveRegions, isPending } = useMutation({
    mutationFn: () => apiClient.setUserRegions(tokens!.access_token, member!.id, Array.from(selectedIds)),
    onSuccess: () => {
      toast.success(t.memberHub.regionsUpdated)
      queryClient.invalidateQueries({ queryKey: ["members"] })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update regions")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMapPin className="h-5 w-5 text-[#009640]" />
            {t.memberHub.manageRegions}
          </DialogTitle>
        </DialogHeader>

        {member && (
          <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm">
            <span className="font-medium text-green-700 dark:text-green-400 capitalize">{member.user_name}</span>
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto py-1">
          {regions.length === 0 && (
            <span className="text-sm text-muted-foreground px-1 py-2">{t.memberHub.noRegionsAvailable}</span>
          )}
          {regions.map((region) => {
            const label = region.reg_name_kh ? `${region.reg_name} | ${region.reg_name_kh}` : region.reg_name
            return (
              <Label
                key={region.reg_id}
                className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-sm hover:bg-muted/40 transition-colors cursor-pointer font-normal"
              >
                <Checkbox
                  checked={selectedIds.has(region.reg_id)}
                  onCheckedChange={(value) => toggleRegion(region.reg_id, !!value)}
                />
                <span className="text-sm">{label}</span>
              </Label>
            )
          })}
        </div>

        <DialogFooter className="pt-2 justify-between">
          {regions.length > 0 ? (
            <Label className="flex items-center gap-2 cursor-pointer font-normal">
              <Checkbox
                checked={isAllSelected || (isSomeSelected && "indeterminate")}
                onCheckedChange={(value) => toggleAllRegions(!!value)}
              />
              <span className="text-sm">{t.memberHub.selectAllRegions}</span>
            </Label>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => saveRegions()}
              disabled={isPending}
              className="bg-[#009640] hover:bg-[#007a33] text-white"
            >
              {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.memberHub.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
