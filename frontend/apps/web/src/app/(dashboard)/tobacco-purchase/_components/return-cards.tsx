"use client"

import * as React from "react"
import { IconCheck, IconSearch, IconX, IconFileInvoice, IconLeaf, IconWeight, IconReplace, IconSeedling } from "@tabler/icons-react"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Popover, PopoverContent, PopoverAnchor } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { TobaccoItem, TobaccoReturnCreate } from "@/services/api-client"
import { VendorContractItem } from "@/types/tobacco-purchase"

export type ReturnItemType = Partial<TobaccoReturnCreate> & { tempId: string, con_num?: string }

interface ReturnCardProps {
  item: ReturnItemType
  index: number
  isReadOnly?: boolean
  tobaccoTypes: TobaccoItem[]
  vendorContracts: VendorContractItem[]
  onRemove: (idx: number) => void
  onChange: (idx: number, field: string, val: string | number) => void
}

export const ReturnDetailCard = React.memo(({
  item, index, isReadOnly, tobaccoTypes, vendorContracts, onRemove, onChange
}: ReturnCardProps) => {
  const [openTobac, setOpenTobac] = React.useState(false)
  const [openCon, setOpenCon] = React.useState(false)

  const [searchTobac, setSearchTobac] = React.useState(() => {
    const t = tobaccoTypes.find(t_item => t_item.t_id === item.tobac_type)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [searchCon, setSearchCon] = React.useState(item.con_num || "")

  const selectedContract = React.useMemo(() =>
    vendorContracts.find(c => c.con_id === item.con_id),
    [vendorContracts, item.con_id])

  React.useEffect(() => {
    if (selectedContract?.t_name) {
      setSearchTobac(`${selectedContract.t_name} | ${selectedContract.t_name_kh || ""}`)
      if (item.tobac_type !== selectedContract.tobac_type && selectedContract.tobac_type !== undefined) {
        onChange(index, "tobac_type", selectedContract.tobac_type)
      }
    } else {
      const activeTobacType = item.tobac_type
      if (activeTobacType) {
        const t = tobaccoTypes.find(t_item => t_item.t_id == activeTobacType)
        setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : `Unknown ID: ${activeTobacType}`)
      } else {
        setSearchTobac(selectedContract ? "No tobacco type in contract" : "")
      }
    }
  }, [item.tobac_type, tobaccoTypes, selectedContract, index, onChange])

  React.useEffect(() => {
    setSearchCon(item.con_num || "")
  }, [item.con_num])

  const remainingText = selectedContract?.qty
    ? ` (${selectedContract.qty} / ${selectedContract.total_returned || 0} Left)`
    : ""

  return (
    <div className="rounded-md border border-black/20 overflow-hidden">
      <div className="px-4 pt-3 pb-4">
        <div className="flex gap-3 items-end">
          {/* Return # + Seedling icon */}
          <div className="shrink-0 space-y-1">
            <span className="text-xs font-semibold md:text-[13px] text-foreground block whitespace-nowrap">No {index + 1}</span>
            <div className="h-8 w-8 flex items-center justify-center border border-black/20 rounded-md bg-white">
              <IconSeedling className="h-3.5 w-3.5 text-foreground/70" />
            </div>
          </div>

          {/* Contract Selection */}
          <div className="w-[20%] min-w-0 space-y-1">
            <Label className="text-xs md:text-[13px] font-semibold text-foreground">Contract ID</Label>
            <Popover open={openCon} onOpenChange={(isOpen) => {
              setOpenCon(isOpen)
              if (!isOpen) setSearchCon(item.con_num || "")
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <IconFileInvoice className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/80 pointer-events-none" />
                  <Input
                    placeholder="Search contract..."
                    value={searchCon}
                    onChange={(e) => { setSearchCon(e.target.value); if (!openCon) setOpenCon(true) }}
                    onFocus={() => { setSearchCon(""); setOpenCon(true) }}
                    onClick={() => { setSearchCon(""); setOpenCon(true) }}
                    disabled={isReadOnly}
                    className="h-8 text-xs rounded-md bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-6 pr-7"
                  />
                  <IconSearch className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-64 p-0 border-border/50 z-120"
                align="start"
                onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                  {vendorContracts.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No contracts found</div>
                  ) : vendorContracts
                    .filter(c => c.con_num?.toLowerCase().includes(searchCon.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.con_id}
                        type="button"
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none ",
                          item.con_id === c.con_id && "bg-white"
                        )}
                        onClick={() => {
                          onChange(index, "con_id", c.con_id)
                          onChange(index, "con_num", c.con_num)
                          if (c.tobac_type) {
                            onChange(index, "tobac_type", c.tobac_type)
                          }
                          setSearchCon(c.con_num)
                          setOpenCon(false)
                        }}
                      >
                        <IconCheck className={cn("mr-2 h-3 w-3", item.con_id === c.con_id ? "opacity-100" : "opacity-0")} />
                        {c.con_num}
                      </button>
                    ))
                  }
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tobacco Item */}
          <div className="w-[40%] min-w-0 space-y-1">
            <Label className="text-xs md:text-[13px] font-semibold text-foreground">Tobacco Type</Label>
            <Popover open={openTobac} onOpenChange={(isOpen) => {
              setOpenTobac(isOpen)
              if (!isOpen) {
                const t = tobaccoTypes.find(t_item => t_item.t_id === item.tobac_type)
                setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
              }
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <IconLeaf className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/80 pointer-events-none" />
                  <Input
                    placeholder="Search item..."
                    value={searchTobac}
                    onChange={(e) => { setSearchTobac(e.target.value); if (!openTobac) setOpenTobac(true) }}
                    onFocus={() => { setSearchTobac(""); setOpenTobac(true) }}
                    onClick={() => { setSearchTobac(""); setOpenTobac(true) }}
                    disabled={isReadOnly || !!item.con_id}
                    className="h-8 text-xs rounded-md bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-6 pr-7 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <IconSearch className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-64 p-0 border-border/50 z-120"
                align="start"
                onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                  {tobaccoTypes
                    .filter(t => {
                      const s = searchTobac.toLowerCase()
                      return t.t_name?.toLowerCase().includes(s) || t.t_name_kh?.toLowerCase().includes(s)
                    })
                    .map((t) => (
                      <button
                        key={t.t_id}
                        type="button"
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none ",
                          item.tobac_type === t.t_id && "bg-white"
                        )}
                        onClick={() => {
                          onChange(index, "tobac_type", t.t_id)
                          setSearchTobac(`${t.t_name} | ${t.t_name_kh || ""}`)
                          setOpenTobac(false)
                        }}
                      >
                        <IconCheck className={cn("mr-2 h-3 w-3", item.tobac_type === t.t_id ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col items-start">
                          <span className="font-bold">{t.t_name}</span>
                          <span className="text-[11px] text-muted-foreground">{t.t_name_kh || "-"}</span>
                        </div>
                      </button>
                    ))
                  }
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Repay Leaf */}
          <div className="w-[30%] min-w-0 space-y-1">
            <Label className="text-xs md:text-[13px] font-semibold text-foreground block">
              Repay<span className="text-xs md:text-[13px] font-semibold text-muted-foreground">{remainingText}</span>
            </Label>
            <div className="relative">
              <IconWeight className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/80 pointer-events-none" />
              <Input type="number" step="0.01"
                className="h-8 text-xs rounded-md font-bold bg-white border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-6 pr-7"
                value={item.qty_repay ?? ""} disabled={isReadOnly}
                onChange={(e) => onChange(index, "qty_repay", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">Kg</span>
            </div>
          </div>

          {!isReadOnly && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <IconX className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
ReturnDetailCard.displayName = "ReturnDetailCard"

export const ReturnDetailDesktopCard = React.memo(({
  item, index, isReadOnly, tobaccoTypes, vendorContracts, onRemove, onChange
}: ReturnCardProps) => {
  const [openTobac, setOpenTobac] = React.useState(false)
  const [openCon, setOpenCon] = React.useState(false)

  const [searchTobac, setSearchTobac] = React.useState(() => {
    const t = tobaccoTypes.find(t_item => t_item.t_id === item.tobac_type)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [searchCon, setSearchCon] = React.useState(item.con_num || "")

  const selectedContract = React.useMemo(() =>
    vendorContracts.find(c => c.con_id === item.con_id),
    [vendorContracts, item.con_id])

  React.useEffect(() => {
    if (selectedContract?.t_name) {
      setSearchTobac(`${selectedContract.t_name} | ${selectedContract.t_name_kh || ""}`)
      if (item.tobac_type !== selectedContract.tobac_type && selectedContract.tobac_type !== undefined) {
        onChange(index, "tobac_type", selectedContract.tobac_type)
      }
    } else {
      const activeTobacType = item.tobac_type
      if (activeTobacType) {
        const t = tobaccoTypes.find(t_item => t_item.t_id == activeTobacType)
        setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : `Unknown ID: ${activeTobacType}`)
      } else {
        setSearchTobac(selectedContract ? "No tobacco type in contract" : "")
      }
    }
  }, [item.tobac_type, tobaccoTypes, selectedContract, index, onChange])

  React.useEffect(() => {
    setSearchCon(item.con_num || "")
  }, [item.con_num])

  const remainingText = selectedContract?.qty
    ? `(${selectedContract.qty} / ${selectedContract.total_returned || 0} Left)`
    : ""

  return (
    <div className={cn(
      "relative border-t border-black/40 hover:-translate-y-0.5 rounded-none transition-all duration-300 py-3 mt-2.5",
      "focus-within:border-black/20"
    )}>
      <div className="flex gap-3 items-end">
          <div className="shrink-0 space-y-1">
            <span className="text-sm font-medium text-center text-foreground block tracking-tighter">No {index + 1}</span>
            <div className="h-8 w-9 flex items-center justify-center border border-black/20 rounded-md bg-white">
              <IconReplace className="h-4 w-4 text-foreground/70" />
            </div>
          </div>

          <div className="w-[28%] space-y-1">
            <Label className="text-sm">Contract Number</Label>
            <Popover open={openCon} onOpenChange={(isOpen) => {
              setOpenCon(isOpen)
              if (!isOpen) setSearchCon(item.con_num || "")
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <IconFileInvoice className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                  <Input
                    placeholder="Search contract..."
                    value={searchCon}
                    onChange={(e) => { setSearchCon(e.target.value); if (!openCon) setOpenCon(true) }}
                    onFocus={() => { setSearchCon(""); setOpenCon(true) }}
                    onClick={() => { setSearchCon(""); setOpenCon(true) }}
                    disabled={isReadOnly}
                    className="h-8 text-sm rounded-md bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-8 pr-10"
                  />
                  <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-64 p-0 border-black/20 z-120"
                align="start"
                onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                  {vendorContracts.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No contracts found</div>
                  ) : vendorContracts
                    .filter(c => c.con_num?.toLowerCase().includes(searchCon.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.con_id}
                        type="button"
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
                          item.con_id === c.con_id && "bg-white"
                        )}
                        onClick={() => {
                          onChange(index, "con_id", c.con_id)
                          onChange(index, "con_num", c.con_num)
                          if (c.tobac_type) {
                            onChange(index, "tobac_type", c.tobac_type)
                          }
                          setSearchCon(c.con_num)
                          setOpenCon(false)
                        }}
                      >
                        <IconCheck className={cn("mr-2 h-3 w-3", item.con_id === c.con_id ? "opacity-100" : "opacity-0")} />
                        {c.con_num}
                      </button>
                    ))
                  }
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-[28%] space-y-1">
            <Label className="text-sm">Tobacco Item</Label>
            <Popover open={openTobac} onOpenChange={(isOpen) => {
              setOpenTobac(isOpen)
              if (!isOpen) {
                const t = tobaccoTypes.find(t_item => t_item.t_id === item.tobac_type)
                setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
              }
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <IconLeaf className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                  <Input
                    placeholder="Search item..."
                    value={searchTobac}
                    onChange={(e) => { setSearchTobac(e.target.value); if (!openTobac) setOpenTobac(true) }}
                    onFocus={() => { setSearchTobac(""); setOpenTobac(true) }}
                    onClick={() => { setSearchTobac(""); setOpenTobac(true) }}
                    disabled={isReadOnly || !!item.con_id}
                    className="h-8 text-sm rounded-md bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-8 pr-10 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-64 p-0 border-black/20 z-120"
                align="start"
                onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                  {tobaccoTypes
                    .filter(t => {
                      const s = searchTobac.toLowerCase()
                      return t.t_name?.toLowerCase().includes(s) || t.t_name_kh?.toLowerCase().includes(s)
                    })
                    .map((t) => (
                      <button
                        key={t.t_id}
                        type="button"
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none",
                          item.tobac_type === t.t_id && "bg-white"
                        )}
                        onClick={() => {
                          onChange(index, "tobac_type", t.t_id)
                          setSearchTobac(`${t.t_name} | ${t.t_name_kh || ""}`)
                          setOpenTobac(false)
                        }}
                      >
                        <IconCheck className={cn("mr-2 h-3 w-3", item.tobac_type === t.t_id ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col items-start">
                          <span className="font-bold">{t.t_name}</span>
                          <span className="text-[11px] text-muted-foreground">{t.t_name_kh || "-"}</span>
                        </div>
                      </button>
                    ))
                  }
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 space-y-1">
            <Label className="text-sm">
              Repay<span className="text-sm">{remainingText}</span>
            </Label>
            <div className="relative">
              <IconWeight className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
              <Input type="number" step="0.01"
                className="h-8 text-sm rounded-md font-bold bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pl-8 pr-8"
                value={item.qty_repay ?? ""} disabled={isReadOnly}
                onChange={(e) => onChange(index, "qty_repay", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">Kg</span>
            </div>
          </div>

          {!isReadOnly && (
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <IconX className="size-3.5" />
              </button>
            </div>
          )}
        </div>
    </div>
  )
})
ReturnDetailDesktopCard.displayName = "ReturnDetailDesktopCard"
