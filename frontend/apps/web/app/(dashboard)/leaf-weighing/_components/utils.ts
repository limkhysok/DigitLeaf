"use client"

import * as React from "react"

export function isOutside(ref: React.RefObject<HTMLElement | null>, target: EventTarget | null) {
  return ref.current !== null && !ref.current.contains(target as Node)
}

export function computeWeight(totalInKg: string, remork: string, sackInKg: number): number | null {
  if (!totalInKg || remork === "") return null
  return Number(totalInKg) - Number(remork) - sackInKg
}
