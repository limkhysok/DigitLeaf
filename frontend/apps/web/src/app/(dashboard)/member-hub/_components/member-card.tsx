"use client"

import { IconMapPin, IconEye, IconTrash } from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { UserProfile } from "@/services/api-client"

export interface MemberCardProps {
  readonly member: UserProfile
  readonly index: number
  readonly isAdmin: boolean
  readonly regionLabel: string
  readonly regionText: string
  readonly regionTitle: string
  readonly manageRegionsLabel: string
  readonly onManageRegions: () => void
  readonly viewDetailsLabel: string
  readonly onViewDetails: () => void
  readonly onDelete: () => void
  readonly isProtected: boolean
  readonly protectedTitle: string
}

export function MemberCard({
  member,
  index,
  isAdmin,
  regionLabel,
  regionText,
  regionTitle,
  manageRegionsLabel,
  onManageRegions,
  viewDetailsLabel,
  onViewDetails,
  onDelete,
  isProtected,
  protectedTitle,
}: MemberCardProps) {
  const initials = member.user_name.substring(0, 2).toUpperCase()

  return (
    <Card className="group flex flex-col overflow-hidden border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2 pt-3 px-3">
        <span className="text-sm font-semibold text-foreground bg-muted/60 px-1.5 rounded-sm border border-border/50 shrink-0">
          #{index}
        </span>
        <Avatar className="size-9 rounded-full border border-border/60 shrink-0">
          <AvatarFallback className="text-xs font-bold bg-muted text-foreground rounded-full">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm font-semibold capitalize truncate text-foreground" title={member.user_name}>
            {member.user_name}
          </span>
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
      </CardHeader>

      <CardContent className="flex flex-col gap-2 pb-3 px-3">
        <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
          <span className="text-sm text-foreground flex items-center gap-1.5 shrink-0">
            <IconMapPin className="h-3.5 w-3.5" />
            {regionLabel}
          </span>
          <span className="text-sm font-medium truncate text-right text-foreground" title={regionTitle}>
            {regionText}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="h-8 text-xs"
          >
            <IconEye className="h-3.5 w-3.5" />
            {viewDetailsLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onManageRegions}
            className="h-8 text-xs flex-1"
          >
            <IconMapPin className="h-3.5 w-3.5" />
            {manageRegionsLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onDelete}
            disabled={isProtected}
            title={isProtected ? protectedTitle : undefined}
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
