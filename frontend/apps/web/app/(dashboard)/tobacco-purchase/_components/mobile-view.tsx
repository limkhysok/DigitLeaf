"use client"

import * as React from "react"
import { TobaccoPurchase, PurchaserItem, OvenItem } from "@/lib/api-client"
import { TobaccoPurchaseCard } from "./tobacco-purchase-card"

interface MobileViewProps {
  records: TobaccoPurchase[]
  purchasers: PurchaserItem[]
  ovens: OvenItem[]
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
}

export function MobileView({
  records, purchasers, ovens, onEdit, onDelete,
}: Readonly<MobileViewProps>) {
  return (
    <div className="grid md:hidden grid-cols-1 gap-3">
      {records.map((rec, index) => (
        <TobaccoPurchaseCard
          key={rec.tp_id}
          rec={rec}
          index={index}
          purchaser={purchasers.find(p => p.p_id === rec.buyer)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
