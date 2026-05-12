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
  IconSearch,
  IconCheck,
  IconCalendar,
  IconX,
  IconHelpCircle,
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
    setDetails(prev => [...prev, { tempId: crypto.randomUUID(), tobacco_name: undefined, qty: 0, price: Number(rate) || 0 }])
  }, [rate])

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
    title = initialData?.invoice_num ? `View Purchase: ${initialData.invoice_num}` : "View Tobacco Purchase"
    description = "Viewing purchase details."
  } else if (initialData) {
    title = initialData.invoice_num ? `Edit Purchase: ${initialData.invoice_num}` : "Edit Tobacco Purchase"
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
          <div className="bg-white p-6 rounded-md border border-border/60 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-5">
              {/* Row 1: Primary Transaction Entities */}
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Buyer (EN/KH)</Label>
                <Popover open={isBuyerOpen} onOpenChange={setIsBuyerOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative group">
                      <Input
                        placeholder="Search buyer..."
                        value={buyerSearch}
                        onChange={(e) => {
                          setBuyerSearch(e.target.value)
                          if (!isBuyerOpen) setIsBuyerOpen(true)
                        }}
                        onFocus={() => setIsBuyerOpen(true)}
                        onClick={() => setIsBuyerOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-border/50 z-[100]"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('.group')) e.preventDefault()
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
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[13px] outline-hidden hover:bg-accent hover:text-accent-foreground transition-colors",
                              buyer === p.p_id.toString() && "bg-accent"
                            )}
                            onClick={() => {
                              setBuyer(p.p_id.toString())
                              setBuyerSearch(`${p.p_name} | ${p.p_name_kh || ""}`)
                              setIsBuyerOpen(false)
                              if (p.region) {
                                const r = regions.find(item => item.reg_id === p.region)
                                if (r) {
                                  setRegion(r.reg_id.toString())
                                  setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)
                                }
                              }
                            }}
                          >
                            <IconCheck className={cn("mr-2 h-3.5 w-3.5", buyer === p.p_id.toString() ? "opacity-100" : "opacity-0")} />
                            {p.p_name} | {p.p_name_kh || "-"}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Region</Label>
                <Popover open={isRegionOpen} onOpenChange={setIsRegionOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative group">
                      <Input
                        placeholder="Region..."
                        value={regionSearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setRegionSearch(val)
                          setRegion(val)
                          if (!isRegionOpen) setIsRegionOpen(true)
                        }}
                        onFocus={() => setIsRegionOpen(true)}
                        onClick={() => setIsRegionOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-border/50 z-[100]"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('.group')) e.preventDefault()
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
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[13px] outline-hidden hover:bg-accent hover:text-accent-foreground",
                              region === r.reg_id.toString() && "bg-accent"
                            )}
                            onClick={() => {
                              setRegion(r.reg_id.toString())
                              setRegionSearch(`${r?.reg_name} | ${r?.reg_name_kh || ""}`)
                              setIsRegionOpen(false)
                            }}
                          >
                            <IconCheck className={cn("mr-2 h-3.5 w-3.5", region === r.reg_id.toString() ? "opacity-100" : "opacity-0")} />
                            {r.reg_name} | {r.reg_name_kh || "-"}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Vendor (Farmer)</Label>
                <Popover open={isVendorOpen} onOpenChange={setIsVendorOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative group">
                      <Input
                        placeholder="Search vendor..."
                        value={vendorSearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setVendorSearch(val)
                          setVendor(val)
                          if (!isVendorOpen) setIsVendorOpen(true)
                        }}
                        onFocus={() => setIsVendorOpen(true)}
                        onClick={() => setIsVendorOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-border/50 z-[100]"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('.group')) e.preventDefault()
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
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[13px] outline-hidden hover:bg-accent hover:text-accent-foreground",
                              (vendor === f.name || vendor === f.mf_code) && "bg-accent"
                            )}
                            onClick={() => {
                              setVendor(f.name)
                              setVendorSearch(`${f.name} | ${f.mf_code}`)
                              setVAddr(f.address || f.v_addr || f.addr || "")
                              setIsVendorOpen(false)
                            }}
                          >
                            <IconCheck className={cn("mr-2 h-3.5 w-3.5", (vendor === f.name || vendor === f.mf_code) ? "opacity-100" : "opacity-0")} />
                            {f.name} | {f.mf_code}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Vendor Address</Label>
                <Input
                  value={v_addr}
                  onChange={(e) => setVAddr(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Enter address..."
                  className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Oven</Label>
                <Popover open={isOvenOpen} onOpenChange={setIsOvenOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative group">
                      <Input
                        placeholder="Oven..."
                        value={ovenSearch}
                        onChange={(e) => {
                          setOvenSearch(e.target.value)
                          if (!isOvenOpen) setIsOvenOpen(true)
                        }}
                        onFocus={() => setIsOvenOpen(true)}
                        onClick={() => setIsOvenOpen(true)}
                        disabled={isReadOnly}
                        className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                      />
                      <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                    </div>
                  </PopoverAnchor>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-border/50 z-[100]"
                    align="start"
                    sideOffset={4}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    onInteractOutside={(e) => {
                      const target = e.target as HTMLElement
                      if (target.closest('.group')) e.preventDefault()
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
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[13px] outline-hidden hover:bg-accent hover:text-accent-foreground",
                              oven === o.id.toString() && "bg-accent"
                            )}
                            onClick={() => {
                              setOven(o.id.toString())
                              setOvenSearch(`${o?.name_en} | ${o?.name_kh || ""}`)
                              setIsOvenOpen(false)
                            }}
                          >
                            <IconCheck className={cn("mr-2 h-3.5 w-3.5", oven === o.id.toString() ? "opacity-100" : "opacity-0")} />
                            {o.name_en} | {o.name_kh || "-"}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">System Rate</Label>
                <div className="relative group">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                    disabled={isReadOnly}
                    className="h-9 text-[13px] font-bold bg-primary/5 border-primary/10 text-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold opacity-40">៛</div>
                </div>
              </div>

              {/* Row 4: Transaction Date and Notes */}
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-[13px] bg-white border border-border/60 shadow-none hover:bg-slate-50 transition-all",
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
                      onSelect={(date) => date && setTpDate(format(date, "yyyy-MM-dd"))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Remark(Optional)</Label>
                <Input
                  value={tpNote}
                  onChange={(e) => setTpNote(e.target.value)}
                  placeholder="Type notes here..."
                  disabled={isReadOnly}
                  className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Details Section - Invoice Paper Style */}
          <div className="space-y-4 bg-white p-3 rounded-md border border-border/60">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Purchase Items</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="inline-flex items-center justify-center size-5 rounded-full bg-muted/50 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary transition-colors cursor-help border border-border/40">
                      <IconHelpCircle className="size-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 shadow-2xl border-border/60 z-[100]" side="top" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                        <IconHelpCircle className="size-4 text-primary" />
                        <h4 className="font-bold text-[13px] uppercase tracking-widest text-primary">Calculation Formulas</h4>
                      </div>

                      <div className="space-y-3">
                        <div className="p-2 bg-slate-50 rounded-md border border-border/40">
                          <div className="text-[13px] font-black uppercase text-muted-foreground/50 mb-1">Row 1: Net Weight</div>
                          <div className="flex items-center gap-2 text-[13px] font-bold tabular-nums text-foreground">
                            <span>QTY (G)</span>
                            <span className="text-muted-foreground/30">−</span>
                            <span>REMORK</span>
                            <span className="text-muted-foreground/30">−</span>
                            <span>SACK</span>
                            <span className="text-muted-foreground/30">=</span>
                            <span className="text-primary underline decoration-primary/30">NET WEIGHT</span>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-50/50 rounded-md border border-emerald-100">
                          <div className="text-[13px] font-black uppercase text-emerald-700/50 mb-1">Row 2: Grand Total</div>
                          <div className="flex items-center gap-2 text-[13px] font-bold tabular-nums text-emerald-700">
                            <span>NET WEIGHT</span>
                            <span className="text-emerald-700/30">×</span>
                            <span>PRICE/KG</span>
                            <span className="text-emerald-700/30">=</span>
                            <span className="underline decoration-emerald-700/30">TOTAL MONEY</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[13px] text-muted-foreground italic leading-relaxed">
                        Note: All weight calculations are done in KG. Rates are based on the system rate selected above.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDetail}
                  className="h-8 text-[13px] gap-2 px-4 bg-background border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-xs rounded-full"
                >
                  <IconPlus className="size-3.5" /> Add New Item
                </Button>
              )}
            </div>

            {/* Removed redundant headers */}

            <div className="space-y-0 min-h-[50px]">
              {details.length > 0 ? (
                details.map((detail, idx) => (
                  <PurchaseDetailRow
                    key={detail.tempId}
                    detail={detail}
                    index={idx}
                    isReadOnly={isReadOnly}
                    tobaccoTypes={tobaccoTypes}
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

            <div className="flex justify-end items-end p-0 pt-4 gap-12">
              {/* Total Weight Summary */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[12px] font-bold text-muted-foreground/60">Total Weight (Net)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums text-foreground">
                    {details.reduce((sum, item) => {
                      const netQty = Math.max(0, (Number(item.qty) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
                      return sum + netQty
                    }, 0).toFixed(2)}
                  </span>
                  <span className="text-[13px] font-bold text-muted-foreground">KG</span>
                </div>
              </div>

              {/* Total Amount Summary */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[12px] font-bold text-[#009640]/70">Grand Total Amount</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-[#009640]/80">៛</span>
                  <span className="text-4xl font-black tabular-nums text-[#009640]">
                    {Math.round(details.reduce((sum, item) => {
                      const netQty = Math.max(0, (Number(item.qty) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
                      return sum + (netQty * (Number(rate) || 0))
                    }, 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-5 border-t border-border/40 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-6 bg-[#009640] hover:bg-[#008a3b] text-white shadow-md shadow-green-500/10 rounded-md text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
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
  const [prevTobaccoId, setPrevTobaccoId] = React.useState(detail.tobacco_name)

  if (detail.tobacco_name !== prevTobaccoId) {
    setPrevTobaccoId(detail.tobacco_name)
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4 p-4 md:p-3 border-b border-border/40 group transition-all duration-200 relative",
      index % 2 === 0 ? "bg-white" : "bg-muted/10",
      "hover:bg-primary/[0.02]"
    )}>
      {/* Top-Right Delete Action - Compact X Icon */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="h-6 w-6 text-muted-foreground/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <IconX className="size-3" />
          </Button>
        )}
      </div>

      {/* Left Column: Tall Image & Number (Spans 2 rows) */}
      <div className="flex flex-col gap-2 h-full">
        <div className="text-[13px] font-black text-muted-foreground/30 flex items-center gap-1 self-start ml-1">
          <span className="opacity-50">#</span>{index + 1}
        </div>
        <div className="flex-1 w-full bg-white rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all group/img overflow-hidden relative shadow-xs min-h-[80px]">
          <IconPlus className="size-4 text-muted-foreground/20 group-hover/img:text-primary/40 transition-colors" />
          <span className="text-[13px] font-bold uppercase tracking-tighter text-muted-foreground/30 group-hover/img:text-primary/40">Img</span>
        </div>
      </div>

      {/* Right Column: Data Entry & Results */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Item Selection & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Tobacco Type */}
          <div className="col-span-12 md:col-span-6 space-y-1.5">
            <Label className="text-[12px] font-bold text-muted-foreground/70">Tobacco Item</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverAnchor asChild>
                <div className="relative group/type">
                  <Input
                    placeholder="Select tobacco..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      if (!open) setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onClick={() => setOpen(true)}
                    disabled={isReadOnly}
                    className="h-9 text-[13px] font-medium pr-10 bg-white border-border/60 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 opacity-20 group-focus-within/type:opacity-50 transition-opacity pointer-events-none" />
                </div>
              </PopoverAnchor>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-border/50 z-[100]" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-[250px] overflow-y-auto p-1">
                  {tobaccoTypes.filter(t => t.t_name.toLowerCase().includes(search.toLowerCase()) || t.t_name_kh?.toLowerCase().includes(search.toLowerCase()))
                    .map((t) => (
                      <button key={t.t_id} type="button" className={cn("relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[13px] outline-hidden hover:bg-accent", detail.tobacco_name === t.t_id && "bg-accent")}
                        onClick={() => { onChange(index, "tobacco_name", t.t_id); setSearch(`${t.t_name} | ${t.t_name_kh || ""}`); setOpen(false) }}>
                        <IconCheck className={cn("mr-2 h-3.5 w-3.5", detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-[13px]">{t.t_name}</span>
                          <span className="text-[13px] text-muted-foreground">{t.t_name_kh || "-"}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Gross Weight */}
          <div className="col-span-3 md:col-span-2 space-y-1.5">
            <Label className="text-[12px] font-bold text-muted-foreground/70">Qty (KG)</Label>
            <div className="relative">
              <Input type="number" step="1" className="h-9 text-[13px] font-bold bg-white border-border/60 text-center" value={detail.qty ?? ""}
                onChange={(e) => onChange(index, "qty", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()} disabled={isReadOnly} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] font-bold opacity-30">KG</span>
            </div>
          </div>

          {/* Remork */}
          <div className="col-span-3 md:col-span-2 space-y-1.5">
            <Label className="text-[12px] font-bold text-muted-foreground/70">Remork (KG)</Label>
            <Input type="number" step="1" className="h-9 text-[13px] bg-white border-border/60 text-center" value={detail.remork_in_kg ?? ""}
              onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()} disabled={isReadOnly} />
          </div>

          {/* Sack */}
          <div className="col-span-3 md:col-span-2 space-y-1.5">
            <Label className="text-[12px] font-bold text-muted-foreground/70">Sack (KG)</Label>
            <Input type="number" step="1" className="h-9 text-[13px] bg-white border-border/60 text-center" value={detail.sack_in_kg ?? ""}
              onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()} disabled={isReadOnly} />
          </div>
        </div>

        {/* Row 2: Results & Actions */}
        <div className="flex items-center gap-3">
          {/* Price per KG Input */}
          <div className="flex-1 bg-white rounded-md p-2 border border-border/60 flex items-center justify-between group/price focus-within:border-primary/40 transition-colors shadow-xs">
            <span className="text-[12px] font-bold text-muted-foreground/70">Price / KG</span>
            <div className="relative flex items-center justify-end">
              <Input
                type="number"
                className="h-6 w-24 text-[13px] font-bold text-right border-none bg-transparent shadow-none focus-visible:ring-0 p-0"
                value={detail.price ?? ""}
                onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                onFocus={(e) => e.currentTarget.select()}
                disabled={isReadOnly}
              />
              <span className="ml-1 text-[13px] font-bold opacity-30">៛</span>
            </div>
          </div>

          {/* Net Weight Display */}
          <div className="flex-1 bg-white rounded-md p-2 border border-border/60 flex items-center justify-between shadow-xs">
            <span className="text-[12px] font-bold text-muted-foreground/70">Net Weight</span>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black text-primary tabular-nums">
                {Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)).toFixed(2)}
              </span>
              <span className="text-[13px] font-bold opacity-40">KG</span>
            </div>
          </div>

          {/* Row Total Display */}
          <div className="flex-1 bg-white rounded-md p-2 border border-border/60 flex items-center justify-between shadow-xs">
            <span className="text-[12px] font-bold text-emerald-700/70">Grand Total</span>
            <span className="text-[15px] font-black text-emerald-700 tabular-nums">
              ៛{Math.round(Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)) * (Number(detail.price) || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

PurchaseDetailRow.displayName = "PurchaseDetailRow"
