"use client"

import * as React from "react"
import { IconUsers, IconUser, IconCalendar, IconPackage } from "@tabler/icons-react"
import { SackRegistrationItem } from "@/lib/api-client"
import { STATUS_MAP } from "./constants"
import { useLanguage } from "@/hooks/use-language"

export function RegistrationDetail({ target }: Readonly<{ target: SackRegistrationItem }>) {
  const { t } = useLanguage()
  const status = STATUS_MAP[target.status] ?? { className: "bg-gray-100 text-gray-800" }
  const getStatusLabel = (statusVal: number) => {
    switch (statusVal) {
      case 0: return t.sackRegistration.filters.statusPending
      case 1: return t.sackRegistration.filters.statusApproved
      case 2: return t.sackRegistration.filters.statusRejected
      default: return String(statusVal)
    }
  }
  const statusLabel = getStatusLabel(target.status)
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{t.sackRegistration.table.status}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{statusLabel}</span>
      </div>
      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUsers className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">{t.sackRegistration.table.representative}</span>
            <span className="text-xs font-medium truncate">{target.represent_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">{t.sackRegistration.table.farmer}</span>
            <span className="text-xs font-medium truncate">{target.member_farmer_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconCalendar className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">{t.sackRegistration.table.registeredAt}</span>
            <span className="text-xs font-medium">{new Date(target.registered_at).toLocaleDateString()}</span>
          </div>
        </div>
        {target.sack_in_kg !== null && target.sack_in_kg !== undefined && (
          <div className="flex items-center gap-3 px-3 py-2">
            <IconPackage className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-muted-foreground">{t.sackRegistration.table.sackWeight}</span>
              <span className="text-xs font-medium">{target.sack_in_kg} kg</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">{t.sackRegistration.table.registeredBy}</span>
            <span className="text-xs font-medium">{target.dl_user_name}</span>
          </div>
        </div>
        {target.notes && (
          <div className="px-3 py-2">
            <span className="text-[10px] text-muted-foreground block mb-0.5">{t.sackRegistration.table.notes}</span>
            <span className="text-xs">{target.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}
