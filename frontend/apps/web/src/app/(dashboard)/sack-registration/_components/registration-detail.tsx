"use client"

import * as React from "react"
import { IconUsers, IconUser, IconCalendar, IconPackage, IconCircleCheck, IconNotes } from "@tabler/icons-react"
import { format } from "date-fns"
import { Badge } from "@workspace/ui/components/badge"
import { SackRegistrationItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"

export function RegistrationDetail({ target }: Readonly<{ target: SackRegistrationItem }>) {
  const { t, localizeNumber, localizeDateString } = useLanguage()
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUsers className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground">{t.sackRegistration.table.representative}</span>
            <span className="text-sm font-medium truncate">{target.represent_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground">{t.sackRegistration.table.farmer}</span>
            <span className="text-sm font-medium truncate">{target.member_farmer_name}</span>
          </div>
        </div>
        {target.sack_in_kg !== null && target.sack_in_kg !== undefined && (
          <div className="flex items-center gap-3 px-3 py-2">
            <IconPackage className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-muted-foreground">{t.sackRegistration.table.sackWeight}</span>
              <span className="text-sm font-normal">{localizeNumber(target.sack_in_kg)} kg</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <IconCircleCheck className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0 gap-1">
            <span className="text-sm text-muted-foreground">{t.sackRegistration.table.status}</span>
            {target.sack_in_kg === 0 ? (
              <Badge variant="outline" className="w-fit border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400">
                {t.sackRegistration.filters.statusConfirmed}
              </Badge>
            ) : (
              <Badge variant="outline" className="w-fit border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                {t.sackRegistration.filters.statusPending}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconNotes className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground">{t.sackRegistration.table.notes}</span>
            <span className="text-sm font-normal">{target.notes ?? "—"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconCalendar className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground">{t.sackRegistration.table.date}</span>
            <span className="text-sm font-normal">{localizeDateString(format(new Date(target.created_at), "dd/MM/yyyy 'at' h:mm a"))}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
