"use client"

import * as React from "react"

import {
  apiClient,
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
  MemberFarmerItem,
  TobaccoPurchase,
  TobaccoPurchaseCreate,
  TobaccoPurchaseDetail,
} from "@/lib/api-client"
import { toast } from "sonner"
import {
  IconLoader2,
  IconPlus,
  IconTrash,
  IconSearch,
  IconCheck,
  IconCalendar,
} from "@tabler/icons-react"
import { Calendar } from "@workspace/ui/components/calendar"
import { format } from "date-fns"
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
  PopoverTrigger,
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
  farmers: MemberFarmerItem[]
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
  tobaccoTypes,
  farmers
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
  const [vendorSearch, setVendorSearch] = React.useState("")
  const [isVendorOpen, setIsVendorOpen] = React.useState(false)
  const [vendor, setVendor] = React.useState("")
  const [v_addr, setVAddr] = React.useState("")
  const [region, setRegion] = React.useState<string>("")
  const [tpDate, setTpDate] = React.useState<string>("")
  const [tpNote, setTpNote] = React.useState("")
  const [oven, setOven] = React.useState<string>("")
  const [rate, setRate] = React.useState("4000")
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
        setVendorSearch("")
        setVAddr("")
        setRegion("")
        setRegionSearch("")
        setTpDate(new Date().toISOString().split("T")[0] || "")
        setTpNote("")
        setOven("")
        setOvenSearch("")
        setRate("4000")
        setDetails([{ tempId: "initial-0", tobacco_name: undefined, qty: 0, price: 0 }])
      }

      const populateForm = (data: TobaccoPurchase) => {
        setBuyer(data.buyer?.toString() || "")
        setVendor(data.vendor || "")
        setVendorSearch(data.vendor || "")
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

        const f = farmers.find(item => item.name === data.vendor || item.mf_code === data.vendor)
        if (f) setVendorSearch(`${f.name} | ${f.mf_code}`)

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
  }, [open, initialData, purchasers, regions, ovens, tobaccoTypes, farmers])

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
      let parsedRegion: string | number | undefined = undefined
      if (region) {
        const num = Number(region)
        parsedRegion = Number.isNaN(num) ? region : num
      }

      const payload: TobaccoPurchaseCreate = {
        buyer: buyer ? Number.parseInt(buyer, 10) : undefined,
        vendor,
        v_addr,
        region: parsedRegion,
        tp_date: tpDate,
        tp_note: tpNote,
        oven: oven ? Number.parseInt(oven, 10) : undefined,
        rate: Number.parseInt(rate, 10),
        details: details.map(d => ({
          ...d,
          price: Math.max(0, (Number(d.qty) || 0) - (Number(d.remork_in_kg) || 0) - (Number(d.sack_in_kg) || 0))
        })) as TobaccoPurchaseDetail[]
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-md border-border/50">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Info Group - Invoice Paper Style */}
          <div className="bg-white p-6 rounded-md border border-border/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Buyer (Search by EN/KH)</Label>
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
                        className="pr-10 h-8 text-xs bg-background shadow-xs"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/50"
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

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Region</Label>
                <Popover open={isRegionOpen} onOpenChange={setIsRegionOpen} modal={false}>
                  <PopoverAnchor asChild>
                    <div className="relative">
                      <Input
                        placeholder="Search or type region..."
                        value={regionSearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setRegionSearch(val)
                          setRegion(val) // Allow manual entry
                          if (!isRegionOpen) setIsRegionOpen(true)
                        }}
                        onFocus={() => setIsRegionOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-8 text-xs bg-background shadow-xs"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/50"
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

              {/* Row 2 */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Vendor (Farmer ID)</Label>
                <Popover open={isVendorOpen} onOpenChange={setIsVendorOpen} modal={false}>
                  <PopoverAnchor asChild>
                    <div className="relative">
                      <Input
                        placeholder="Search vendor..."
                        value={vendorSearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setVendorSearch(val)
                          setVendor(val) // Allow manual entry
                          if (!isVendorOpen) setIsVendorOpen(true)
                        }}
                        onFocus={() => setIsVendorOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-8 text-xs bg-background shadow-xs"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/50"
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
                      {farmers
                        .filter(f =>
                          f.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                          f.mf_code.toLowerCase().includes(vendorSearch.toLowerCase())
                        )
                        .map((f) => (
                          <button
                            key={f.mf_id}
                            type="button"
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
                              (vendor === f.name || vendor === f.mf_code) && "bg-accent"
                            )}
                            onClick={() => {
                              setVendor(f.name)
                              setVendorSearch(`${f.name} | ${f.mf_code}`)
                              // Try multiple possible field names from API
                              const address = f.address || f.v_addr || f.addr || ""
                              setVAddr(address)
                              setIsVendorOpen(false)
                            }}
                          >
                            <IconCheck
                              className={cn(
                                "mr-2 h-4 w-4",
                                (vendor === f.name || vendor === f.mf_code) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {f.name} | {f.mf_code}
                          </button>
                        ))}
                      {farmers.filter(f =>
                        f.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                        f.mf_code.toLowerCase().includes(vendorSearch.toLowerCase())
                      ).length === 0 && (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No farmer found.
                          </div>
                        )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Vendor Address</Label>
                <Input
                  value={v_addr}
                  onChange={(e) => setVAddr(e.target.value)}
                  disabled={isReadOnly}
                  className="h-8 text-xs bg-background shadow-xs"
                />
              </div>

              {/* Row 3 */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Oven</Label>
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
                        className="pr-10 h-8 text-xs bg-background shadow-xs"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40 pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border-border/50"
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

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-xs bg-background shadow-xs",
                        !tpDate && "text-muted-foreground"
                      )}
                      disabled={isReadOnly}
                    >
                      <IconCalendar className="mr-2 h-4 w-4 opacity-40" />
                      {tpDate ? format(new Date(tpDate), "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-2xl border-border/50" align="start">
                    <Calendar
                      mode="single"
                      selected={tpDate ? new Date(tpDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setTpDate(format(date, "yyyy-MM-dd"))
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 4 */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Notes</Label>
                <Input
                  value={tpNote}
                  onChange={(e) => setTpNote(e.target.value)}
                  placeholder="Optional notes..."
                  disabled={isReadOnly}
                  className="h-8 text-xs bg-background shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Rate (Required)</Label>
                <Input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                  disabled={isReadOnly}
                  className="h-8 text-[11px] bg-background shadow-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Details Section - Invoice Paper Style */}
          <div className="space-y-6 bg-white p-6 rounded-md border border-border/60">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="space-y-1">
                <Label className="text-sm font-bold tracking-tight">Purchase Items (x{details.length})</Label>
                <p className="text-[10px] text-muted-foreground">Detailed breakdown of tobacco types and pricing</p>
              </div>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDetail}
                  className="h-7 text-[10px] gap-1 px-2.5 bg-background hover:bg-accent/50 transition-colors shadow-xs"
                >
                  <IconPlus className="size-3" /> Add New Line
                </Button>
              )}
            </div>

            {/* Items Table Header */}
            <div className="hidden md:flex gap-3 px-3 pb-2 border-b border-border/40">
              <div className="flex-1 min-w-[150px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Tobacco Type</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Qty(kg)</span>
              </div>
              <div className="w-16 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">-Remork</span>
              </div>
              <div className="w-16 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">-Sack</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Net Qty</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">× Rate</span>
              </div>
              <div className="w-28 text-right pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">= Total</span>
              </div>
              <div className="w-7"></div>
            </div>

            <div className="space-y-0 min-h-[50px]">
              {details.length > 0 ? (
                details.map((detail, idx) => (
                  <PurchaseDetailRow
                    key={detail.tempId}
                    detail={detail}
                    index={idx}
                    isReadOnly={isReadOnly}
                    tobaccoTypes={tobaccoTypes}
                    rate={Number(rate) || 0}
                    onRemove={handleRemoveDetail}
                    onChange={handleDetailChange}
                  />
                ))
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-border/40 rounded-xl">
                  <p className="text-sm text-muted-foreground">No items added to this purchase.</p>
                </div>
              )}
            </div>

            {/* Grand Total Bar - Invoice Style */}
            <div className="flex justify-end pt-5 border-t border-border/40 mt-4">
              <div className="flex flex-col items-end gap-1 px-4">
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Grand Total ៛</span>
                <span className="text-3xl font-bold tabular-nums text-[#009640]">
                  {Math.round(details.reduce((sum, item) => {
                    const netQty = Math.max(0, (Number(item.qty) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
                    return sum + (netQty * (Number(rate) || 0))
                  }, 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-5 border-t border-border/40 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-6 bg-[#009640] hover:bg-[#008a3b] text-white shadow-md shadow-green-500/10 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <IconCheck className="h-3.5 w-3.5" />
                )}
                {initialData ? "Update Purchase" : "Save Purchase"}
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
  detail, index, isReadOnly, tobaccoTypes, rate, onRemove, onChange
}: {
  detail: Partial<TobaccoPurchaseDetail>,
  index: number,
  isReadOnly?: boolean,
  tobaccoTypes: TobaccoItem[],
  rate: number,
  onRemove: (idx: number) => void,
  onChange: (idx: number, field: keyof TobaccoPurchaseDetail, val: string | number) => void
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [prevTobaccoId, setPrevTobaccoId] = React.useState(detail.tobacco_name)

  // Sync search text when the selection changes (e.g. initial load or parent update)
  if (detail.tobacco_name !== prevTobaccoId) {
    setPrevTobaccoId(detail.tobacco_name)
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
  }

  return (
    <div className="flex flex-wrap md:flex-nowrap gap-3 items-center bg-[#fcfcfc] p-2 rounded-none border border-border/50 group relative hover:bg-white transition-colors duration-200">
      <div className="flex-1 min-w-[150px]">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">Tobacco Type</Label>
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
                className="h-7 text-[11px] pr-7"
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
                .filter(t => 
                  t.t_name.toLowerCase().includes(search.toLowerCase()) || 
                  t.t_name_kh?.toLowerCase().includes(search.toLowerCase())
                )
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
                      setSearch(`${t.t_name} | ${t.t_name_kh || ""}`)
                      setOpen(false)
                    }}
                  >
                    <IconCheck
                      className={cn(
                        "mr-2 h-3 w-3",
                        detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {t.t_name} | {t.t_name_kh || "-"}
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-24">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">Qty(kg)</Label>
        <Input
          type="number"
          step="0.001"
          className="h-7 text-[11px]"
          value={detail.qty ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
            onChange(index, "qty", val)
          }}
          disabled={isReadOnly}
        />
      </div>
      <div className="w-20">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">-Remork(kg)</Label>
        <Input
          type="number"
          step="0.01"
          className="h-7 text-[11px]"
          value={detail.remork_in_kg ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
            onChange(index, "remork_in_kg", val)
          }}
          disabled={isReadOnly}
        />
      </div>
      <div className="w-20">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">-Sack(kg)</Label>
        <Input
          type="number"
          step="0.01"
          className="h-7 text-[11px]"
          value={detail.sack_in_kg ?? ""}
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
            onChange(index, "sack_in_kg", val)
          }}
          disabled={isReadOnly}
        />
      </div>
      <div className="w-20">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">Net Qty</Label>
        <div className="h-7 px-1 flex items-center justify-end text-[11px] font-bold bg-muted/20 rounded-sm tabular-nums text-foreground/80">
          {Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      <div className="w-20">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">Rate</Label>
        <div className="h-7 px-1 flex items-center justify-end text-[10px] font-medium text-muted-foreground tabular-nums">
          {rate.toLocaleString()}
        </div>
      </div>
      <div className="w-28">
        {/* Mobile-only Label */}
        <Label className="md:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1 block">Row Total</Label>
        <div className="h-7 px-1 flex items-center justify-end text-[11px] font-bold text-[#009640] tabular-nums bg-green-50/50 rounded-sm border border-green-100/50">
          {Math.round(Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)) * rate).toLocaleString()}
        </div>
      </div>
      {!isReadOnly && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="h-7 w-7 text-muted-foreground hover:text-red-600 mb-0.5"
        >
          <IconTrash className="size-3.5" />
        </Button>
      )}
    </div>
  )
})

PurchaseDetailRow.displayName = "PurchaseDetailRow"
