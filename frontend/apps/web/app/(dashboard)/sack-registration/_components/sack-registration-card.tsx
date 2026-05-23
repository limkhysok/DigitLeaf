"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
import { IconClock, IconEye, IconPencil, IconTrash, IconUsers, IconPackage, IconDots } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { STATUS_MAP } from "./constants"
import { useLanguage } from "@/hooks/use-language"

export const SackRegistrationCard = React.memo(({
  rec, index, onView, onEdit, onDelete
}: {
  rec: SackRegistrationItem
  index: number
  onView: (rec: SackRegistrationItem) => void
  onEdit: (rec: SackRegistrationItem) => void
  onDelete: (rec: SackRegistrationItem) => void
}) => {
  const { t, localizeNumber } = useLanguage()
  const status = STATUS_MAP[rec.status] ?? { className: "bg-gray-100 text-gray-800" }
  
  const getStatusLabel = (statusVal: number) => {
    switch (statusVal) {
      case 0: return t.sackRegistration.filters.statusPending
      case 1: return t.sackRegistration.filters.statusConfirmed
      case 2: return t.sackRegistration.filters.statusRejected
      default: return String(statusVal)
    }
  }
  const statusLabel = getStatusLabel(rec.status)

  return (
    <Card 
      className="flex flex-col justify-between overflow-hidden cursor-pointer hover:border-primary/50 transition-colors" 
      onClick={() => onView(rec)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1.5 min-w-0 pr-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <span className="font-mono bg-muted px-1 py-0.5 rounded-sm">
               #{localizeNumber(index)}
             </span>
             <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider rounded-sm", status.className)}>
               {statusLabel}
             </Badge>
          </div>
          <CardTitle className="text-base font-semibold truncate leading-tight mt-0.5" title={rec.member_farmer_name}>
            {rec.member_farmer_name}
          </CardTitle>
        </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 -mr-2"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(rec)}>
                <IconEye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                {t.sackRegistration.dialog.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(rec)}>
                <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                {t.sackRegistration.dialog.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(rec)} className="text-destructive focus:text-destructive">
                <IconTrash className="mr-2 h-4 w-4 text-destructive/70" />
                {t.sackRegistration.dialog.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </CardHeader>
      
      <CardContent className="grid grid-cols-2 gap-4 pb-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <IconUsers className="h-3 w-3" />
            {t.sackRegistration.table.representative}
          </span>
          <span className="text-sm font-medium truncate" title={rec.represent_name}>
            {rec.represent_name}
          </span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
            <IconPackage className="h-3 w-3" />
            {t.sackRegistration.table.sackWeight}
          </span>
          <span className="text-sm font-medium tabular-nums">
            {rec.sack_in_kg !== null && rec.sack_in_kg !== undefined ? `${rec.sack_in_kg} kg` : "—"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground flex items-center justify-between border-t border-border/40 bg-muted/20 mt-auto px-6 py-2.5">
        <div className="flex items-center gap-1.5">
          <IconClock className="h-3.5 w-3.5" />
          <span>{new Date(rec.registered_at).toLocaleDateString()}</span>
        </div>
      </CardFooter>
    </Card>
  )
})

SackRegistrationCard.displayName = "SackRegistrationCard"
