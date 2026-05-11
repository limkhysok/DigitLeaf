"use client"

import * as React from "react"

import {
  apiClient,
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
  TobaccoPurchase,
  TobaccoPurchaseDetail,
} from "@/lib/api-client"
import { toast } from "sonner"
import { 
  IconLoader2, 
  IconPlus, 
  IconTrash, 
  IconSearch, 
  IconCheck, 
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

interface AddPurchaseDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  accessToken: string
  initialData?: TobaccoPurchase | null
  isReadOnly?: boolean
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  ovens: OvenItem[]
  tobaccoTypes: TobaccoItem[]
}

export function AddPurchaseDialog({ 
  open, 
  onClose, 
  onSuccess, 
  accessToken,
  initialData,
  isReadOnly,
  purchasers,
  regions,
  ovens,
  tobaccoTypes
}: Readonly<AddPurchaseDialogProps>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form State
  // Form State initialized from initialData if present
  const [buyer, setBuyer] = React.useState<string>("")
  const [buyerSearch, setBuyerSearch] = React.useState("")
  const [isBuyerOpen, setIsBuyerOpen] = React.useState(false)
  const [regionSearch, setRegionSearch] = React.useState("")
  const [isRegionOpen, setIsRegionOpen] = React.useState(false)
  const [ovenSearch, setOvenSearch] = React.useState("")
  const [isOvenOpen, setIsOvenOpen] = React.useState(false)
  const [vendor, setVendor] = React.useState("")
  const [v_addr, setVAddr] = React.useState("")
  const [region, setRegion] = React.useState<string>("")
  const [tpDate, setTpDate] = React.useState<string>("")
  const [tpNote, setTpNote] = React.useState("")
  const [oven, setOven] = React.useState<string>("")
  const [rate, setRate] = React.useState("")
  const [details, setDetails] = React.useState<(Partial<TobaccoPurchaseDetail> & { tempId: string })[]>([])

  // Initialize form when opening
  // We use a ref to track if we've already initialized for the current 'open' session
  const initialized = React.useRef(false)

  React.useEffect(() => {
    if (open && !initialized.current) {
      const resetForm = () => {
        setBuyer("")
        setBuyerSearch("")
        setVendor("")
        setVAddr("")
        setRegion("")
        setRegionSearch("")
        setTpDate(new Date().toISOString().split("T")[0] || "")
        setTpNote("")
        setOven("")
        setOvenSearch("")
        setRate("")
        setDetails([{ tempId: "initial-0", tobacco_name: undefined, qty: 0, price: 0 }])
      }

      const populateForm = (data: TobaccoPurchase) => {
        setBuyer(data.buyer?.toString() || "")
        setVendor(data.vendor || "")
        setVAddr(data.v_addr || "")
        setRegion(data.region?.toString() || "")
        setTpDate(data.tp_date || "")
        setTpNote(data.tp_note || "")
        setOven(data.oven?.toString() || "")
        setRate(data.rate.toString())
        setDetails(data.details?.map((d: Partial<TobaccoPurchaseDetail>) => ({ ...d, tempId: crypto.randomUUID() })) || [])

        // Map IDs to search strings
        const b = purchasers.find(p => p.p_id === data.buyer)
        if (b) setBuyerSearch(`${b.p_name} | ${b.p_name_kh || ""}`)
        
        const r = regions.find(item => item.reg_id === data.region)
        if (r) setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)
        
        const o = ovens.find(item => item.id === data.oven)
        if (o) setOvenSearch(`${o.name_en} | ${o.name_kh || ""}`)
      }

      const timer = setTimeout(() => {
        if (initialData) populateForm(initialData)
        else resetForm()
      }, 0)
      
      initialized.current = true
      return () => clearTimeout(timer)
    } else if (!open) {
      initialized.current = false
    }
  }, [open, initialData, purchasers, regions, ovens])

  const handleAddDetail = React.useCallback(() => {
    setDetails(prev => [...prev, { tempId: crypto.randomUUID(), tobacco_name: undefined, qty: 0, price: 0 }])
  }, [])

  const handleRemoveDetail = React.useCallback((index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDetailChange = React.useCallback((index: number, field: keyof TobaccoPurchaseDetail, val: string | number) => {
    setDetails(prev => {
      const newDetails = [...prev]
      const item = newDetails[index]
      if (item) {
        newDetails[index] = { ...item, [field]: val }
      }
      return newDetails
    })
  }, [])

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    if (!rate || details.some(d => !d.tobacco_name || !d.qty || !d.price)) {
      toast.error("Please fill all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        buyer: buyer ? Number.parseInt(buyer, 10) : undefined,
        vendor,
        v_addr,
        region: region ? Number.parseInt(region, 10) : undefined,
        tp_date: tpDate,
        tp_note: tpNote,
        oven: oven ? Number.parseInt(oven, 10) : undefined,
        rate: Number.parseInt(rate, 10),
        details: details as TobaccoPurchaseDetail[]
      }

      if (initialData?.tp_id) {
        await apiClient.updateTobaccoPurchase(accessToken, initialData.tp_id, payload)
        toast.success("Purchase updated successfully")
      } else {
        await apiClient.createTobaccoPurchase(accessToken, payload)
        toast.success("Purchase recorded successfully")
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  let title = "New Tobacco Purchase"
  let description = "Enter purchase details and item breakdown."

  if (isReadOnly) {
    title = "View Tobacco Purchase"
    description = "Viewing purchase details."
  } else if (initialData) {
    title = "Edit Tobacco Purchase"
    description = "Update the purchase information below."
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Row 1 */}
            <div className="space-y-2">
              <Label>Buyer (Search by EN/KH)</Label>
              <Popover open={isBuyerOpen} onOpenChange={setIsBuyerOpen} modal={false}>
                <PopoverAnchor asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search buyer..."
                      value={buyerSearch}
                      onChange={(e) => {
                        setBuyerSearch(e.target.value)
                        if (!isBuyerOpen) setIsBuyerOpen(true)
                      }}
                      onFocus={() => setIsBuyerOpen(true)}
                      disabled={isReadOnly}
                      className="pr-10"
                    />
                    <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </PopoverAnchor>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('.relative')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {purchasers
                      .filter(p => 
                        p.p_name.toLowerCase().includes(buyerSearch.toLowerCase()) || 
                        p.p_name_kh?.includes(buyerSearch)
                      )
                      .map((p) => (
                        <button
                          key={p.p_id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                            buyer === p.p_id.toString() && "bg-accent"
                          )}
                          onClick={() => {
                            setBuyer(p.p_id.toString())
                            setBuyerSearch(`${p.p_name} | ${p.p_name_kh || ""}`)
                            setIsBuyerOpen(false)

                            // Dynamic Region Selection: Auto-populate region if buyer has one linked
                            if (p.region) {
                              const r = regions.find(item => item.reg_id === p.region)
                              if (r) {
                                setRegion(r.reg_id.toString())
                                setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)
                              }
                            }
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              buyer === p.p_id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.p_name} | {p.p_name_kh || "-"}
                        </button>
                      ))}
                    {purchasers.filter(p => 
                      p.p_name.toLowerCase().includes(buyerSearch.toLowerCase()) || 
                      p.p_name_kh?.includes(buyerSearch)
                    ).length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No buyer found.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Popover open={isRegionOpen} onOpenChange={setIsRegionOpen} modal={false}>
                <PopoverAnchor asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search region..."
                      value={regionSearch}
                      onChange={(e) => {
                        setRegionSearch(e.target.value)
                        if (!isRegionOpen) setIsRegionOpen(true)
                      }}
                      onFocus={() => setIsRegionOpen(true)}
                      disabled={isReadOnly}
                      className="pr-10"
                    />
                    <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </PopoverAnchor>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('.relative')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {regions
                      .filter(r => 
                        r.reg_name.toLowerCase().includes(regionSearch.toLowerCase()) || 
                        r.reg_name_kh?.includes(regionSearch)
                      )
                      .map((r) => (
                        <button
                          key={r.reg_id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
                            region === r.reg_id.toString() && "bg-accent"
                          )}
                          onClick={() => {
                            setRegion(r.reg_id.toString())
                            setRegionSearch(`${r?.reg_name} | ${r?.reg_name_kh || ""}`)
                            setIsRegionOpen(false)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              region === r.reg_id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {r.reg_name} | {r.reg_name_kh || "-"}
                        </button>
                      ))}
                    {regions.filter(r => 
                      r.reg_name.toLowerCase().includes(regionSearch.toLowerCase()) || 
                      r.reg_name_kh?.includes(regionSearch)
                    ).length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No region found.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input type="date" value={tpDate} onChange={(e) => setTpDate(e.target.value)} disabled={isReadOnly} />
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
              <Label>Vendor (Farmer ID)</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. F-123" disabled={isReadOnly} />
            </div>

            <div className="space-y-2">
              <Label>Vendor Address</Label>
              <Input value={v_addr} onChange={(e) => setVAddr(e.target.value)} disabled={isReadOnly} />
            </div>

            <div className="space-y-2">
              <Label>Oven</Label>
              <Popover open={isOvenOpen} onOpenChange={setIsOvenOpen} modal={false}>
                <PopoverAnchor asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search oven..."
                      value={ovenSearch}
                      onChange={(e) => {
                        setOvenSearch(e.target.value)
                        if (!isOvenOpen) setIsOvenOpen(true)
                      }}
                      onFocus={() => setIsOvenOpen(true)}
                      disabled={isReadOnly}
                      className="pr-10"
                    />
                    <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </PopoverAnchor>
                <PopoverContent 
                  className="w-[var(--radix-popover-trigger-width)] p-0" 
                  align="start" 
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('.relative')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {ovens
                      .filter(o => 
                        o.name_en.toLowerCase().includes(ovenSearch.toLowerCase()) || 
                        o.name_kh?.includes(ovenSearch)
                      )
                      .map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
                            oven === o.id.toString() && "bg-accent"
                          )}
                          onClick={() => {
                            setOven(o.id.toString())
                            setOvenSearch(`${o?.name_en} | ${o?.name_kh || ""}`)
                            setIsOvenOpen(false)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              oven === o.id.toString() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {o.name_en} | {o.name_kh || "-"}
                        </button>
                      ))}
                    {ovens.filter(o => 
                      o.name_en.toLowerCase().includes(ovenSearch.toLowerCase()) || 
                      o.name_kh?.includes(ovenSearch)
                    ).length === 0 && (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No oven found.
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 3 */}
            <div className="space-y-2">
              <Label>Rate (Required)</Label>
              <Input 
                type="number" 
                value={rate} 
                onChange={(e) => setRate(e.target.value)} 
                required 
                disabled={isReadOnly} 
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label>Notes</Label>
              <Input value={tpNote} onChange={(e) => setTpNote(e.target.value)} placeholder="Optional notes..." disabled={isReadOnly} />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <Label className="text-base font-semibold">Purchase Items</Label>
              {!isReadOnly && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddDetail} className="h-7 text-xs gap-1">
                  <IconPlus className="size-3" /> Add Item
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {details.map((detail, idx) => (
                <PurchaseDetailRow 
                  key={detail.tempId}
                  detail={detail}
                  index={idx}
                  isReadOnly={isReadOnly}
                  tobaccoTypes={tobaccoTypes}
                  onRemove={handleRemoveDetail}
                  onChange={handleDetailChange}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting} className="bg-[#009640] hover:bg-[#008a3b]">
                {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Purchase
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Optimized Detail Row Component
const PurchaseDetailRow = React.memo(({ 
  detail, index, isReadOnly, tobaccoTypes, onRemove, onChange 
}: { 
  detail: Partial<TobaccoPurchaseDetail>, 
  index: number, 
  isReadOnly?: boolean,
  tobaccoTypes: TobaccoItem[], 
  onRemove: (idx: number) => void, 
  onChange: (idx: number, field: keyof TobaccoPurchaseDetail, val: string | number) => void 
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  return (
    <div className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-muted/20 p-3 rounded-lg border group relative">
      <div className="flex-1 min-w-[150px] space-y-1.5">
        <Label className="text-[10px] uppercase text-muted-foreground">Tobacco Type</Label>
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverAnchor asChild>
            <div className="relative">
              <Input
                placeholder="Search type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (!open) setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                disabled={isReadOnly}
                className="h-8 text-xs pr-7"
              />
              <IconSearch className="absolute right-2 top-1/2 -translate-y-1/2 size-3 opacity-50 pointer-events-none" />
            </div>
          </PopoverAnchor>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0" 
            align="start" 
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('.relative')) {
                e.preventDefault()
              }
            }}
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              {tobaccoTypes
                .filter(t => t.t_name.toLowerCase().includes(search.toLowerCase()))
                .map((t) => (
                  <button
                    key={t.t_id}
                    type="button"
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1 text-xs outline-hidden hover:bg-accent hover:text-accent-foreground",
                      detail.tobacco_name === t.t_id && "bg-accent"
                    )}
                    onClick={() => {
                      onChange(index, "tobacco_name", t.t_id)
                      setSearch(t.t_name)
                      setOpen(false)
                    }}
                  >
                    <IconCheck
                      className={cn(
                        "mr-2 h-3 w-3",
                        detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {t.t_name}
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-24 space-y-1.5">
        <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
        <Input 
          type="number" 
          step="0.001"
          className="h-8 text-xs" 
          value={detail.qty ?? ""} 
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
            onChange(index, "qty", val)
          }} 
          disabled={isReadOnly}
        />
      </div>
      <div className="w-24 space-y-1.5">
        <Label className="text-[10px] uppercase text-muted-foreground">Price</Label>
        <Input 
          type="number" 
          step="0.01"
          className="h-8 text-xs" 
          value={detail.price ?? ""} 
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
            onChange(index, "price", val)
          }} 
          disabled={isReadOnly}
        />
      </div>
      {!isReadOnly && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemove(index)}
          className="h-8 w-8 text-muted-foreground hover:text-red-600 mb-0.5"
        >
          <IconTrash className="size-4" />
        </Button>
      )}
    </div>
  )
})

PurchaseDetailRow.displayName = "PurchaseDetailRow"
