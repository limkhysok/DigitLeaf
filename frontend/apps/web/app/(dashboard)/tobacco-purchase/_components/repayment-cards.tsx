"use client"

import * as React from "react"
import { IconCheck, IconSearch, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Popover, PopoverContent, PopoverAnchor } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { TobaccoItem, TobaccoRepaymentCreate } from "@/lib/api-client"
import { VendorContractItem } from "@/lib/types/tobacco-purchase"

export type RepaymentItemType = Partial<TobaccoRepaymentCreate> & { tempId: string, con_num?: string }

interface RepaymentCardProps {
  repay: RepaymentItemType
  index: number
  isReadOnly?: boolean
  tobaccoTypes: TobaccoItem[]
  vendorContracts: VendorContractItem[]
  onRemove: (idx: number) => void
  onChange: (idx: number, field: string, val: string | number) => void
}

export const RepaymentDetailCard = React.memo(({
  repay, index, isReadOnly, tobaccoTypes, vendorContracts, onRemove, onChange
}: RepaymentCardProps) => {
  const [openTobac, setOpenTobac] = React.useState(false)
  const [openCon, setOpenCon] = React.useState(false)
  
  const [searchTobac, setSearchTobac] = React.useState(() => {
    const t = tobaccoTypes.find(item => item.t_id === repay.tobac_type)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [searchCon, setSearchCon] = React.useState(repay.con_num || "")

  const selectedContract = React.useMemo(() => 
    vendorContracts.find(c => c.con_id === repay.con_id),
  [vendorContracts, repay.con_id])

  React.useEffect(() => {
    if (selectedContract?.t_name) {
      setSearchTobac(`${selectedContract.t_name} | ${selectedContract.t_name_kh || ""}`)
      if (repay.tobac_type !== selectedContract.tobac_type && selectedContract.tobac_type !== undefined) {
        onChange(index, "tobac_type", selectedContract.tobac_type)
      }
    } else {
      const activeTobacType = repay.tobac_type
      if (activeTobacType) {
        const t = tobaccoTypes.find(item => item.t_id == activeTobacType)
        setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : `Unknown ID: ${activeTobacType}`)
      } else {
        setSearchTobac(selectedContract ? "No tobacco type in contract" : "")
      }
    }
  }, [repay.tobac_type, tobaccoTypes, selectedContract, index, onChange])

  React.useEffect(() => {
    setSearchCon(repay.con_num || "")
  }, [repay.con_num])

  const remainingText = selectedContract?.qty 
    ? ` | Remaining ${selectedContract.qty} / ${selectedContract.total_repaid || 0}`
    : ""

  return (
    <div className="rounded-md border border-border/60 bg-emerald-50/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-emerald-100/50 border-b border-emerald-200/40">
        <span className="text-[11px] font-bold text-emerald-800/80 uppercase tracking-wider">
          Repay #{index + 1}
        </span>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded hover:bg-red-50 text-emerald-800/40 hover:text-red-500 transition-colors"
          >
            <IconX className="size-3.5" />
          </button>
        )}
      </div>

      <div className="px-3 pt-3 pb-3 space-y-3">
        {/* Contract Selection */}
        <div>
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1.5">Contract Number</Label>
          <Popover open={openCon} onOpenChange={(isOpen) => {
            setOpenCon(isOpen)
            if (!isOpen) setSearchCon(repay.con_num || "")
          }}>
            <PopoverAnchor asChild>
              <div className="relative group">
                <Input
                  placeholder="Search contract..."
                  value={searchCon}
                  onChange={(e) => { setSearchCon(e.target.value); if (!openCon) setOpenCon(true) }}
                  onFocus={() => { setSearchCon(""); setOpenCon(true) }}
                  onClick={() => { setSearchCon(""); setOpenCon(true) }}
                  disabled={isReadOnly}
                  className="h-8 text-sm rounded-md bg-white border border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pr-10"
                />
                <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
              </div>
            </PopoverAnchor>
            <PopoverContent 
              className="w-64 p-0 border-border/50 z-[120]" 
              align="start"
              onMouseDown={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('.group')) e.preventDefault()
              }}
            >
              <div className="max-h-60 overflow-y-auto p-1">
                {vendorContracts.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">No contracts found</div>
                ) : vendorContracts
                  .filter(c => c.con_num?.toLowerCase().includes(searchCon.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.con_id}
                      type="button"
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-emerald-50",
                        repay.con_id === c.con_id && "bg-emerald-50"
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
                      <IconCheck className={cn("mr-2 h-3 w-3 text-emerald-600", repay.con_id === c.con_id ? "opacity-100" : "opacity-0")} />
                      {c.con_num}
                    </button>
                  ))
                }
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Tobacco Item */}
        <div>
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1.5">Tobacco Item</Label>
          <Popover open={openTobac} onOpenChange={(isOpen) => {
            setOpenTobac(isOpen)
            if (!isOpen) {
              const t = tobaccoTypes.find(item => item.t_id === repay.tobac_type)
              setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
            }
          }}>
            <PopoverAnchor asChild>
              <div className="relative group">
                <Input
                  placeholder="Search item..."
                  value={searchTobac}
                  onChange={(e) => { setSearchTobac(e.target.value); if (!openTobac) setOpenTobac(true) }}
                  onFocus={() => { setSearchTobac(""); setOpenTobac(true) }}
                  onClick={() => { setSearchTobac(""); setOpenTobac(true) }}
                  disabled={isReadOnly || !!repay.con_id}
                  className="h-8 text-sm rounded-md bg-white border border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pr-10 disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
              </div>
            </PopoverAnchor>
            <PopoverContent 
              className="w-64 p-0 border-border/50 z-[120]" 
              align="start"
              onMouseDown={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
              onInteractOutside={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('.group')) e.preventDefault()
              }}
            >
              <div className="max-h-60 overflow-y-auto p-1">
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
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-emerald-50",
                        repay.tobac_type === t.t_id && "bg-emerald-50"
                      )}
                      onClick={() => {
                        onChange(index, "tobac_type", t.t_id)
                        setSearchTobac(`${t.t_name} | ${t.t_name_kh || ""}`)
                        setOpenTobac(false)
                      }}
                    >
                      <IconCheck className={cn("mr-2 h-3 w-3 text-emerald-600", repay.tobac_type === t.t_id ? "opacity-100" : "opacity-0")} />
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
        <div>
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1.5">
            Repay Leaf (Kg) <span className="text-emerald-600/80 lowercase font-medium">{remainingText}</span>
          </Label>
          <Input type="number" step="0.01"
            className="h-8 text-sm rounded-md font-bold bg-white border-border/60 focus-visible:ring-1 focus-visible:ring-emerald-500/30 px-2"
            value={repay.qty_repay ?? ""} disabled={isReadOnly}
            onChange={(e) => onChange(index, "qty_repay", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          />
        </div>

      </div>
    </div>
  )
})
RepaymentDetailCard.displayName = "RepaymentDetailCard"

export const RepaymentDetailDesktopCard = React.memo(({
  repay, index, isReadOnly, tobaccoTypes, vendorContracts, onRemove, onChange
}: RepaymentCardProps) => {
  const [openTobac, setOpenTobac] = React.useState(false)
  const [openCon, setOpenCon] = React.useState(false)
  
  const [searchTobac, setSearchTobac] = React.useState(() => {
    const t = tobaccoTypes.find(item => item.t_id === repay.tobac_type)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [searchCon, setSearchCon] = React.useState(repay.con_num || "")

  const selectedContract = React.useMemo(() => 
    vendorContracts.find(c => c.con_id === repay.con_id),
  [vendorContracts, repay.con_id])

  React.useEffect(() => {
    if (selectedContract?.t_name) {
      setSearchTobac(`${selectedContract.t_name} | ${selectedContract.t_name_kh || ""}`)
      if (repay.tobac_type !== selectedContract.tobac_type && selectedContract.tobac_type !== undefined) {
        onChange(index, "tobac_type", selectedContract.tobac_type)
      }
    } else {
      const activeTobacType = repay.tobac_type
      if (activeTobacType) {
        const t = tobaccoTypes.find(item => item.t_id == activeTobacType)
        setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : `Unknown ID: ${activeTobacType}`)
      } else {
        setSearchTobac(selectedContract ? "No tobacco type in contract" : "")
      }
    }
  }, [repay.tobac_type, tobaccoTypes, selectedContract, index, onChange])

  React.useEffect(() => {
    setSearchCon(repay.con_num || "")
  }, [repay.con_num])

  const remainingText = selectedContract?.qty 
    ? ` | Remaining ${selectedContract.qty} / ${selectedContract.total_repaid || 0}`
    : ""

  return (
    <div className={cn(
      "relative border border-emerald-200 hover:-translate-y-0.5 rounded-md transition-all duration-300 p-3.5 mt-3.5",
      "focus-within:border-emerald-400 bg-emerald-50/20"
    )}>
      <div className="flex items-center justify-between gap-4 pb-1.5 border-b border-emerald-200/50 mb-3">
        <span className="text-[11.5px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Repay #{index + 1}
        </span>
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 h-6.5 px-2 rounded-md transition-colors text-[11px]"
          >
            <IconX className="size-3 mr-1" /> Remove
          </Button>
        )}
      </div>

      <div className="flex flex-row gap-4 items-start w-full">
        <div className="shrink-0 flex items-center justify-center w-24 h-24 bg-emerald-100/30 rounded-md border border-dashed border-emerald-200">
          <span className="text-4xl" role="img" aria-label="Leaf">🌱</span>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-sm text-emerald-800">Contract Number</Label>
            <Popover open={openCon} onOpenChange={(isOpen) => {
              setOpenCon(isOpen)
              if (!isOpen) setSearchCon(repay.con_num || "")
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <Input
                    placeholder="Search contract..."
                    value={searchCon}
                    onChange={(e) => { setSearchCon(e.target.value); if (!openCon) setOpenCon(true) }}
                    onFocus={() => { setSearchCon(""); setOpenCon(true) }}
                    onClick={() => { setSearchCon(""); setOpenCon(true) }}
                    disabled={isReadOnly}
                    className="h-8 text-sm rounded-md bg-white border border-emerald-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pr-10"
                  />
                  <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent 
                className="w-64 p-0 border-emerald-200 z-[120]" 
                align="start"
                onMouseDown={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1">
                  {vendorContracts.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">No contracts found</div>
                  ) : vendorContracts
                    .filter(c => c.con_num?.toLowerCase().includes(searchCon.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.con_id}
                        type="button"
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-emerald-50",
                          repay.con_id === c.con_id && "bg-emerald-50"
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
                        <IconCheck className={cn("mr-2 h-3 w-3 text-emerald-600", repay.con_id === c.con_id ? "opacity-100" : "opacity-0")} />
                        {c.con_num}
                      </button>
                    ))
                  }
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-sm text-emerald-800">Tobacco Item</Label>
            <Popover open={openTobac} onOpenChange={(isOpen) => {
              setOpenTobac(isOpen)
              if (!isOpen) {
                const t = tobaccoTypes.find(item => item.t_id === repay.tobac_type)
                setSearchTobac(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
              }
            }}>
              <PopoverAnchor asChild>
                <div className="relative group">
                  <Input
                    placeholder="Search item..."
                    value={searchTobac}
                    onChange={(e) => { setSearchTobac(e.target.value); if (!openTobac) setOpenTobac(true) }}
                    onFocus={() => { setSearchTobac(""); setOpenTobac(true) }}
                    onClick={() => { setSearchTobac(""); setOpenTobac(true) }}
                    disabled={isReadOnly || !!repay.con_id}
                    className="h-8 text-sm rounded-md bg-white border border-emerald-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 pr-10 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                </div>
              </PopoverAnchor>
              <PopoverContent 
                className="w-64 p-0 border-emerald-200 z-[120]" 
                align="start"
                onMouseDown={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onInteractOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.closest('.group')) e.preventDefault()
                }}
              >
                <div className="max-h-60 overflow-y-auto p-1">
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
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-emerald-50",
                          repay.tobac_type === t.t_id && "bg-emerald-50"
                        )}
                        onClick={() => {
                          onChange(index, "tobac_type", t.t_id)
                          setSearchTobac(`${t.t_name} | ${t.t_name_kh || ""}`)
                          setOpenTobac(false)
                        }}
                      >
                        <IconCheck className={cn("mr-2 h-3 w-3 text-emerald-600", repay.tobac_type === t.t_id ? "opacity-100" : "opacity-0")} />
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

          <div className="space-y-1">
            <Label className="text-sm text-emerald-800">
              Repay Leaf (Kg) <span className="text-[11px] text-emerald-600/80 font-medium">{remainingText}</span>
            </Label>
            <Input type="number" step="0.01"
              className="h-8 text-sm rounded-md font-bold bg-white border border-emerald-200 focus-visible:ring-1 focus-visible:ring-emerald-500/30 px-2.5"
              value={repay.qty_repay ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "qty_repay", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
RepaymentDetailDesktopCard.displayName = "RepaymentDetailDesktopCard"
