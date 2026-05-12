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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
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
  const [tpCode, setTpCode] = React.useState("")
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
        setTpCode(`INV-${format(new Date(), "yyyyMMdd")}-TEMP`)
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
        setTpCode(data.invoice_num || "")
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
    title = initialData?.invoice_num ? `View Purchase: ${initialData.invoice_num}` : "View Tobacco Purchase"
    description = "Viewing purchase details."
  } else if (initialData) {
    title = initialData.invoice_num ? `Edit Purchase: ${initialData.invoice_num}` : "Edit Tobacco Purchase"
    description = "Update the purchase information below."
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-md border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                {title}
                {tpCode && (
                  <span className="text-[14px] font-mono text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-sm border border-border/60">
                    {tpCode}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground/70">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white p-6 rounded-md border border-border/60 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-5">
              {/* Row 1: Invoice, Buyer, Region */}
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Invoice No.</Label>
                <Input
                  value={tpCode}
                  readOnly
                  className="h-9 text-[13px] font-bold bg-slate-50 border-border/60 text-muted-foreground shadow-none cursor-default"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Buyer selection</Label>
                <Popover open={isBuyerOpen} onOpenChange={setIsBuyerOpen}>
                  <PopoverAnchor asChild>
                    <div className="relative group">
                      <Input
                        placeholder="Search buyer..."
                        value={buyerSearch}
                        onChange={(e) => {
                          const val = e.target.value
                          setBuyerSearch(val)
                          setBuyer(val)
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
                              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-[13px] outline-hidden hover:bg-accent hover:text-accent-foreground",
                              buyer === p.p_id.toString() && "bg-accent"
                            )}
                            onClick={() => {
                              setBuyer(p.p_id.toString())
                              setBuyerSearch(`${p.p_name} | ${p.p_name_kh || ""}`)
                              setIsBuyerOpen(false)
                              if (p.p_id) {
                                const r = regions.find(reg => reg.reg_id === p.region)
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

              <div className="md:col-span-1 space-y-1.5">
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

              {/* Row 2: Vendor, Address, Oven */}
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Vendor (Id)</Label>
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

              <div className="md:col-span-1 space-y-1.5">
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

              {/* Row 3: Rate, Remark, Date */}
              <div className="md:col-span-1 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">System Rate</Label>
                <div className="relative group">
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                    disabled={isReadOnly}
                    className="h-9 text-[13px] font-bold bg-white border border-border/60 text-black shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold opacity-40">៛</div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[12px] font-bold text-muted-foreground/70">Remark(Optional)</Label>
                <Input
                  value={tpNote}
                  onChange={(e) => setTpNote(e.target.value)}
                  placeholder="Type notes here..."
                  disabled={isReadOnly}
                  className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                />
              </div>

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
            </div>
          </div>

          {/* Details Section - Premium Shadcn Table Style */}
          <div className="bg-white rounded-none border border-border/80 mt-4 overflow-hidden">
            <Table className="table-fixed border-collapse">
              <TableHeader className="bg-slate-50/90 backdrop-blur-sm sticky top-0 z-20 shadow-xs border-t border-b border-border/80">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[50px] text-[13px] font-bold text-center border-r border-border/60">#</TableHead>
                  <TableHead className="min-w-[250px] text-[13px] font-bold border-r border-border/60">
                    <div className="flex items-center gap-2 px-1">
                      <div className="size-1.5 rounded-full bg-primary/40 animate-pulse" />
                      Tobacco Item
                    </div>
                  </TableHead>
                  <TableHead className="w-[60px] text-[13px] font-bold text-center border-r border-border/60">Image</TableHead>
                  <TableHead className="w-[90px] text-[13px] font-bold text-center border-r border-border/60">Qty(KG)</TableHead>
                  <TableHead className="w-[90px] text-[13px] font-bold text-center border-r border-border/60">Remork(KG)</TableHead>
                  <TableHead className="w-[90px] text-[13px] font-bold text-center border-r border-border/60">Sack(KG)</TableHead>
                  <TableHead className="w-[95px] text-[13px] font-bold text-center border-r border-border/60">Price</TableHead>
                  <TableHead className="w-[105px] text-[13px] font-bold text-center bg-primary/[0.03] text-primary/80 border-r border-border/60">Net Weight</TableHead>
                  <TableHead className="w-[130px] text-[13px] font-bold text-right bg-emerald-500/[0.03] text-emerald-700/80 pr-4">Grand Total</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
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
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-[2px]">
                        <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-border/60">
                          <IconPlus className="size-6 text-muted-foreground/20" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[14px] font-bold text-foreground">No items recorded yet</p>
                          <p className="text-[12px] text-muted-foreground/60 max-w-[240px]">Start building your purchase invoice by adding tobacco items.</p>
                        </div>
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddDetail}
                            className="mt-2 h-9 px-6 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-xs"
                          >
                            <IconPlus className="mr-2 size-3.5" /> Add First Item
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-slate-50/80 border-t-2 border-border/80">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-right text-[11px] font-bold text-muted-foreground uppercase pr-4">Total Summary</TableCell>
                  <TableCell className="text-center p-2 bg-primary/[0.04] border-r border-border/60">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase leading-none mb-1">Total Weight</span>
                      <span className="text-[14px] font-black text-primary tabular-nums">
                        {details.reduce((sum, item) => {
                          const netQty = Math.max(0, (Number(item.qty) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
                          return sum + netQty
                        }, 0).toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right p-2 bg-emerald-500/[0.04] pr-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-emerald-700/50 uppercase leading-none mb-1">Grand Total</span>
                      <span className="text-[16px] font-black text-emerald-700 tabular-nums">
                        ៛{Math.round(details.reduce((sum, item) => {
                          const netQty = Math.max(0, (Number(item.qty) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
                          return sum + (netQty * (Number(item.price) || 0))
                        }, 0)).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            {/* Table Action Footer */}
            <div className="bg-slate-50/50 border-t border-border/80 p-3 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                {!isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDetail}
                    className="h-9 px-5 text-[12px] font-bold rounded-md bg-white hover:bg-slate-50 border-border/60 shadow-xs transition-all active:scale-95"
                  >
                    <IconPlus className="mr-2 size-4 text-primary" /> Add Row
                  </Button>
                )}
                <span className="text-[11px] font-medium text-muted-foreground italic">
                  Tip: Changes are saved only after clicking &apos;Save Purchase&apos;
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
    <TableRow className={cn(
      "group transition-all duration-200 relative border-b border-border/60",
      "focus-within:bg-emerald-50/40",
      index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
      "hover:bg-primary/[0.01]"
    )}>
      {/* Column 1: No. */}
      <TableCell className="p-1 w-[50px] border-r border-border/60 text-center align-middle">
        <div className="text-[12px] font-bold text-muted-foreground/60 tabular-nums">
          {index + 1}
        </div>
      </TableCell>

      {/* Column 2: Tobacco Item */}
      <TableCell className="p-0 min-w-[250px] border-r border-border/60 align-middle">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div className="relative group/type">
              <Input
                placeholder="Item..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (!open) setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                disabled={isReadOnly}
                className="h-9 text-[12px] bg-transparent border-none shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3"
              />
            </div>
          </PopoverAnchor>
          <PopoverContent className="w-[300px] p-0 shadow-2xl border-border/50 z-[100]" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="max-h-[250px] overflow-y-auto p-1">
              {tobaccoTypes.filter(t => t.t_name.toLowerCase().includes(search.toLowerCase()) || t.t_name_kh?.toLowerCase().includes(search.toLowerCase()))
                .map((t) => (
                  <button key={t.t_id} type="button" className={cn("relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[12px] outline-hidden hover:bg-accent", detail.tobacco_name === t.t_id && "bg-accent")}
                    onClick={() => { onChange(index, "tobacco_name", t.t_id); setSearch(`${t.t_name} | ${t.t_name_kh || ""}`); setOpen(false) }}>
                    <IconCheck className={cn("mr-2 h-3 w-3", detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-[12px]">{t.t_name}</span>
                      <span className="text-[12px] text-muted-foreground">{t.t_name_kh || "-"}</span>
                    </div>
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>

      {/* Column 3: Image */}
      <TableCell className="p-1 w-[60px] border-r border-border/60 align-middle">
        <div className="flex justify-center">
          <div className="w-8 aspect-square bg-white rounded border border-dashed border-border/60 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all group/img">
            <IconPlus className="size-2 text-muted-foreground/20 group-hover/img:text-primary/40" />
          </div>
        </div>
      </TableCell>

      {/* Column 4: Qty (KG) */}
      <TableCell className="p-1 w-[90px] border-r border-border/60 text-center align-middle">
        <Input type="number" step="1" className="h-9 text-[12px] font-bold bg-transparent border-none text-center p-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" value={detail.qty ?? ""}
          onChange={(e) => onChange(index, "qty", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          disabled={isReadOnly} />
      </TableCell>

      {/* Column 5: Remork */}
      <TableCell className="p-1 w-[90px] border-r border-border/60 text-center align-middle">
        <Input type="number" step="1" className="h-9 text-[12px] bg-transparent border-none text-center p-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" value={detail.remork_in_kg ?? ""}
          onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          disabled={isReadOnly} />
      </TableCell>

      {/* Column 6: Sack */}
      <TableCell className="p-1 w-[90px] border-r border-border/60 text-center align-middle">
        <Input type="number" step="1" className="h-9 text-[12px] bg-transparent border-none text-center p-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" value={detail.sack_in_kg ?? ""}
          onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          disabled={isReadOnly} />
      </TableCell>

      {/* Column 7: Price */}
      <TableCell className="p-1 w-[95px] border-r border-border/60 text-center align-middle">
        <div className="relative w-full text-center">
          <Input
            type="number"
            className="h-9 text-[12px] font-bold bg-transparent border-none text-center p-0 shadow-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={detail.price ?? ""}
            onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            disabled={isReadOnly}
          />
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-bold opacity-20">៛</span>
        </div>
      </TableCell>

      {/* Column 8: Weight */}
      <TableCell className="p-1 w-[85px] border-r border-border/60 text-center align-middle bg-primary/[0.01]">
        <span className="text-[12px] font-bold text-primary tabular-nums leading-none">
          {Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)).toFixed(2)}
        </span>
      </TableCell>

      {/* Column 9: Grand Total */}
      <TableCell className="p-1 w-[130px] text-right align-middle bg-emerald-50/20 pr-4">
        <span className="text-[12px] font-bold text-emerald-700 tabular-nums leading-none">
          ៛{Math.round(Math.max(0, (Number(detail.qty) || 0) - (Number(detail.remork_in_kg) || 0) - (Number(detail.sack_in_kg) || 0)) * (Number(detail.price) || 0)).toLocaleString()}
        </span>

        {/* Absolute delete button - visible on row hover */}
        <div className="absolute top-1/2 -translate-y-1/2 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
      </TableCell>
    </TableRow>
  )
})

PurchaseDetailRow.displayName = "PurchaseDetailRow"
