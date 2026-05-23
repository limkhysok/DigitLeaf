"use client"

import * as React from "react"
import { SackRegistrationItem } from "@/lib/api-client"
import { IconClock, IconEye, IconPencil, IconTrash, IconUsers, IconPackage, IconDots, IconUser, IconPaperBag } from "@tabler/icons-react"
import { format } from "date-fns"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
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

  const getStatusColor = (statusVal: number) => {
    switch (statusVal) {
      case 0: return "bg-amber-400"
      case 1: return "bg-emerald-400"
      case 2: return "bg-rose-400"
      default: return "bg-gray-400"
    }
  }
  const topBarColor = getStatusColor(rec.status)

  return (
    <Card
      className="group flex flex-col overflow-hidden cursor-pointer border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 rounded-lg shadow-sm"
      onClick={() => onView(rec)}
    >
      {/* ROW 1: Header (Number, Status, Menu) */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground bg-muted/60 px-1.5 rounded-sm border border-border/50">
            #{localizeNumber(index)}
          </span>
          <Badge variant="outline" className={cn("px-1.5 py-0.5 text-sm font-semibold rounded-sm border-opacity-50", status.className)}>
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", topBarColor)} />
            {statusLabel}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-foreground hover:bg-muted shrink-0 -mr-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(rec)}>
              <IconEye className="mr-2 h-4 w-4" />
              {t.sackRegistration.dialog.view}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(rec)}>
              <IconPencil className="mr-2 h-4 w-4" />
              {t.sackRegistration.dialog.edit}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(rec)} className="text-destructive focus:text-destructive">
              <IconTrash className="mr-2 h-4 w-4 text-destructive" />
              {t.sackRegistration.dialog.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pb-3 px-3">
        {/* ROW 2: Sack Icon */}
        <div className="w-full h-20 bg-muted/20 rounded-md border border-border/50 flex flex-col items-center justify-center text-muted-foreground group-hover:bg-muted/40 transition-colors overflow-hidden">
          <IconPaperBag className="h-10 w-10 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" stroke={1.5} />
        </div>

        {/* ROW 3: Details */}
        <div className="flex flex-col gap-0.5">
          {/* Farmer */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 shrink-0">
              <IconUser className="h-3.5 w-3.5" />
              {t.sackRegistration.table.farmer}
            </span>
            <span className="text-sm font-semibold truncate text-right text-foreground" title={rec.member_farmer_name}>
              {rec.member_farmer_name}
            </span>
          </div>

          {/* Representative */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 shrink-0">
              <IconUsers className="h-3.5 w-3.5" />
              {t.sackRegistration.table.representative}
            </span>
            <span className="text-sm font-semibold truncate text-right text-foreground" title={rec.represent_name}>
              {rec.represent_name}
            </span>
          </div>

          {/* Sack (kg) */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 shrink-0">
              <IconPackage className="h-3.5 w-3.5" />
              {t.sackRegistration.table.sackWeight}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              {rec.sack_in_kg !== null && rec.sack_in_kg !== undefined ? `${localizeNumber(rec.sack_in_kg)} kg` : "—"}
            </span>
          </div>

          {/* Datetime */}
          <div className="flex items-center justify-between gap-2 py-0.5 px-1.5 -mx-1.5 rounded-sm hover:bg-muted/40 transition-colors">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5 shrink-0">
              <IconClock className="h-3.5 w-3.5" />
              {t.sackRegistration.table.date}
            </span>
            <span className="text-sm font-semibold tabular-nums text-right text-foreground">
              {localizeNumber(format(new Date(rec.registered_at), "dd/MM/yyyy"))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

SackRegistrationCard.displayName = "SackRegistrationCard"
