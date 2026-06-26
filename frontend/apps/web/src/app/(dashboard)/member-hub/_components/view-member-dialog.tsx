"use client"

import { format } from "date-fns"
import { IconEye, IconMapPin, IconUserCog, IconCalendar } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import type { RegionItem, UserProfile } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"

interface ViewMemberDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  member: UserProfile | null
  regions: RegionItem[]
}

export function ViewMemberDialog({ open, onOpenChange, member, regions }: Readonly<ViewMemberDialogProps>) {
  const { t, localizeDateString } = useLanguage()
  const d = t.memberHub.details

  if (!member) return null

  const isAdmin = member.access_type.toLowerCase() === "all" || member.access_type.toLowerCase() === "admin"
  const initials = member.user_name.substring(0, 2).toUpperCase()
  const memberRegions = regions.filter((r) => member.regions.includes(r.reg_id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEye className="h-5 w-5 text-[#009640]" />
            {d.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
            <Avatar className="size-10 rounded-full border border-border/60 shrink-0">
              <AvatarFallback className="text-xs font-bold bg-muted text-foreground rounded-full">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 gap-1">
              <span className="text-sm font-semibold capitalize truncate leading-none">{member.user_name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-[10px] font-medium rounded-sm capitalize w-fit",
                  isAdmin
                    ? "bg-[#009640]/10 text-[#009640] border-[#009640]/20"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {member.access_type || "Standard"}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border border-border divide-y divide-border text-sm overflow-hidden">
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <IconUserCog className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0 gap-0.5">
                <span className="text-xs text-muted-foreground">{d.loginType}</span>
                <span className="text-sm font-medium">{member.login_type || "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              <IconCalendar className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0 gap-0.5">
                <span className="text-xs text-muted-foreground">{d.createdDate}</span>
                <span className="text-sm font-medium">
                  {member.do_date ? localizeDateString(format(new Date(member.do_date), "dd/MM/yyyy")) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <IconMapPin className="size-3.5" />
                {d.region}
              </span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium rounded-sm">
                {memberRegions.length}
              </Badge>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 min-h-16 max-h-48 overflow-y-auto">
              {memberRegions.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {memberRegions.map((r) => (
                    <Badge key={r.reg_id} variant="outline" className="font-normal bg-background">
                      {r.reg_name_kh ? `${r.reg_name} | ${r.reg_name_kh}` : r.reg_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {d.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
