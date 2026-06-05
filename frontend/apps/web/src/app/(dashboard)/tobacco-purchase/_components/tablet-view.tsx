"use client"

import * as React from "react"
import { TobaccoPurchase, PurchaserItem, OvenItem } from "@/services/api-client"
import { TobaccoPurchaseCard } from "./tobacco-purchase-card"

interface TabletViewProps {
  records: TobaccoPurchase[]
  purchasers: PurchaserItem[]
  ovens: OvenItem[]
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export function TabletView({
  records,
  purchasers,
  ovens,
  onEdit,
  onDelete,
}: Readonly<TabletViewProps>) {
  return (
    <div className="hidden md:grid lg:hidden grid-cols-2 gap-3">
      {records.map((rec, index) => {
        const purchaser = purchasers.find((p) => p.p_id === rec.buyer)
        const oven = ovens.find((o) => o.id === rec.oven)
        return (
          <TobaccoPurchaseCard
            key={rec.tp_id}
            rec={rec}
            index={index}
            purchaser={purchaser}
            oven={oven}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}
