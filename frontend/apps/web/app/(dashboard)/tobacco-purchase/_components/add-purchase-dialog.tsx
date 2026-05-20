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
  IconX,
  IconCamera,
  IconPhoto,
} from "@tabler/icons-react"
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

function maskDate(raw: string): string {
  const digits = raw.replaceAll(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function getPictureUrl(picture?: string | null): string {
  if (!picture) return ""
  if (picture.startsWith("data:") || picture.startsWith("blob:")) {
    return picture
  }
  const apiRoot = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
  const backendBase = apiRoot.replace("/api/v1", "")
  return `${backendBase}/uploads/${picture}`
}

function getDialogLabels(isReadOnly?: boolean, initialData?: TobaccoPurchase | null) {
  if (isReadOnly) {
    return {
      title: "View Tobacco Purchase",
      description: "Viewing purchase details.",
    }
  }
  if (initialData) {
    return {
      title: "Edit Tobacco Purchase",
      description: "Update the purchase information below.",
    }
  }
  return { title: "New Tobacco Purchase", description: "Enter purchase details and item breakdown." }
}

function updateDetailsSackWeight(
  prevDetails: (Partial<TobaccoPurchaseDetail> & { tempId: string })[],
  sackInKg: number
) {
  return prevDetails.map((d, i) => ({
    ...d,
    sack_in_kg: i === 0 ? sackInKg : 0,
  }))
}

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
  tobaccoTypes,
}: Readonly<AddPurchaseDialogProps>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const [vendors, setVendors] = React.useState<MemberFarmerItem[]>([])
  const [isVendorsLoading, setIsVendorsLoading] = React.useState(false)
  const [dateDisplay, setDateDisplay] = React.useState("")

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

  const resetForm = React.useCallback(() => {
    setBuyer("")
    setBuyerSearch("")
    setVendor("")
    setVendorSearch("")
    setVendors([])
    setVAddr("")
    setRegion("")
    setRegionSearch("")
    const today = new Date()
    setTpDate(today.toISOString().split("T")[0] || "")
    setDateDisplay(format(today, "dd/MM/yyyy"))
    setTpNote("")
    const defaultOven = ovens[0]
    setOven(defaultOven ? defaultOven.id.toString() : "")
    setOvenSearch(defaultOven ? `${defaultOven.name_en} | ${defaultOven.name_kh || ""}` : "")
    setRate("4000")
    setTpCode(`${format(new Date(), "yyyyMMdd")}-TEMP`)

    setDetails([{ tempId: "initial-0", tobacco_name: undefined, gross_weight: 0, price: 0 }])
  }, [ovens])

  const populateForm = React.useCallback(async (data: TobaccoPurchase) => {
    setBuyer(data.buyer?.toString() || "")
    setVendor(data.vendor || "")
    setVendorSearch(data.vendor || "")
    setVAddr(data.v_addr || "")
    setRegion(data.region?.toString() || "")
    setTpDate(data.tp_date || "")
    if (data.tp_date) {
      const [y, m, d] = data.tp_date.split("-")
      setDateDisplay(`${d}/${m}/${y}`)
    }
    setTpNote(data.tp_note || "")
    setOven(data.oven?.toString() || "")
    setRate(data.rate.toString())
    setTpCode(data.invoice_num || "")
    setDetails(data.details?.map((d: Partial<TobaccoPurchaseDetail>) => ({ ...d, tempId: crypto.randomUUID() })) || [])

    const b = purchasers.find(p => p.p_id === data.buyer)
    if (b) setBuyerSearch(`${b.p_name} | ${b.p_name_kh || ""}`)

    const r = regions.find(item => item.reg_id === data.region)
    if (r) setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)

    const o = ovens.find(item => item.id === data.oven)
    if (o) setOvenSearch(`${o.name_en} | ${o.name_kh || ""}`)

    if (data.buyer) {
      setIsVendorsLoading(true)
      try {
        const v = await apiClient.getVendorsByBuyer(accessToken, data.buyer)
        setVendors(v)
        const match = v.find(item => item.name === data.vendor)
        if (match) setVendorSearch(`${match.name} | ${match.mf_code}`)
      } catch {
        setVendors([])
      } finally {
        setIsVendorsLoading(false)
      }
    }
  }, [purchasers, regions, ovens, accessToken])

  // Populate or reset whenever the dialog opens or the record being edited changes.
  // Using initialData directly as the dependency (not a ref guard) so switching
  // from record A → record B always re-populates correctly.
  React.useEffect(() => {
    if (!open) {
      initialized.current = false
      return
    }
    if (initialized.current) return
    initialized.current = true
    if (initialData) {
      populateForm(initialData)
    } else {
      resetForm()
    }
  }, [open, initialData, populateForm, resetForm])

  // Auto-fetch sack weight only when creating a NEW record (no initialData).
  // Skip this for edit mode — we must preserve the sack_in_kg values from the DB.
  React.useEffect(() => {
    if (!vendor || isReadOnly || initialData) return

    let active = true
    async function fetchSackWeight() {
      try {
        const { sack_in_kg } = await apiClient.getVendorSack(accessToken, vendor)
        if (active) {
          setDetails(prev => updateDetailsSackWeight(prev, sack_in_kg ?? 0))
        }
      } catch {
        // ignore
      }
    }

    fetchSackWeight()
    return () => { active = false }
  }, [vendor, accessToken, isReadOnly, initialData])

  const handleAddDetail = React.useCallback(() => {
    setDetails(prev => [...prev, { tempId: crypto.randomUUID(), tobacco_name: undefined, gross_weight: 0, price: 0, sack_in_kg: 0 }])
  }, [])

  const handleRemoveDetail = React.useCallback((index: number) => {
    setDetails(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleDetailChange = React.useCallback((index: number, field: keyof TobaccoPurchaseDetail, val: string | number) => {
    setDetails(prev => {
      const newDetails = [...prev]
      const item = newDetails[index]
      if (item) newDetails[index] = { ...item, [field]: val }
      return newDetails
    })
  }, [])

  const handleBuyerSelect = React.useCallback(async (pId: number) => {
    setBuyer(pId.toString())
    const p = purchasers.find(item => item.p_id === pId)
    setBuyerSearch(p ? `${p.p_name} | ${p.p_name_kh || ""}` : "")
    setIsBuyerOpen(false)

    if (p) {
      const r = regions.find(reg => reg.reg_id === p.region)
      if (r) {
        setRegion(r.reg_id.toString())
        setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)
      }
    }

    setVendor("")
    setVendorSearch("")
    setVendors([])
    setIsVendorsLoading(true)
    try {
      const v = await apiClient.getVendorsByBuyer(accessToken, pId)
      setVendors(v)
    } catch {
      setVendors([])
    } finally {
      setIsVendorsLoading(false)
    }
  }, [purchasers, regions, accessToken])

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    if (!buyer) {
      toast.error("Please select a Buyer")
      return
    }
    if (!vendor) {
      toast.error("Please select a Vendor")
      return
    }
    if (!region) {
      toast.error("Please select a Region")
      return
    }
    if (!rate) {
      toast.error("Please enter a valid exchange rate")
      return
    }
    if (details.length === 0) {
      toast.error("Please add at least one tobacco purchase item")
      return
    }
    if (details.some(d => !d.tobacco_name || !d.gross_weight || !d.price)) {
      toast.error("Please ensure all item details have a Tobacco Grade, Gross Weight, and Price/Kg")
      return
    }


    setIsSubmitting(true)
    try {
      const payload: TobaccoPurchaseCreate = {
        buyer: buyer ? Number.parseInt(buyer, 10) : undefined,
        vendor,
        v_addr,
        region: region ? Number.parseInt(region, 10) : undefined,
        tp_date: tpDate,
        tp_note: tpNote,
        oven: oven ? Number.parseInt(oven, 10) : undefined,
        rate: Number.parseInt(rate, 10),
        details: details.map(d => ({
          tobacco_name: d.tobacco_name as number,
          gross_weight: Number(d.gross_weight) || 0,
          price: Number(d.price) || 0,
          remork_in_kg: Number(d.remork_in_kg) || 0,
          sack_in_kg: Number(d.sack_in_kg) || 0,
          borrowed_leaf_kg: Number(d.borrowed_leaf_kg) || 0,
          picture: d.picture || null,
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

  const isBuyerSelected = purchasers.some(p => p.p_id.toString() === buyer)

  let vendorListContent: React.ReactNode
  if (isVendorsLoading) {
    vendorListContent = (
      <div className="flex items-center justify-center py-4">
        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  } else if (vendors.length === 0) {
    vendorListContent = (
      <div className="px-3 py-4 text-[12px] text-muted-foreground text-center">
        {buyer ? "No vendors found for this buyer" : "Select a buyer first"}
      </div>
    )
  } else {
    vendorListContent = vendors
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
            vendor === f.name && "bg-accent"
          )}
          onClick={() => {
            setVendor(f.name)
            setVendorSearch(`${f.name} | ${f.mf_code}`)
            setVAddr(f.address || "")
            setIsVendorOpen(false)
          }}
        >
          <IconCheck className={cn("mr-2 h-3.5 w-3.5", vendor === f.name ? "opacity-100" : "opacity-0")} />
          {f.name} | {f.mf_code}
        </button>
      ))
  }

  // Computed totals for mobile/tablet summary
  const totalNetWeight = details.reduce((sum, item) => {
    return sum + Math.max(0, (Number(item.gross_weight) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
  }, 0)
  const grandTotal = details.reduce((sum, item) => {
    const net = Math.max(0, (Number(item.gross_weight) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
    return sum + net * (Number(item.price) || 0)
  }, 0)

  const { title, description } = getDialogLabels(isReadOnly, initialData)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-md border-border/50">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-[18px] font-bold text-foreground">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-[13px] text-muted-foreground/70">{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ════════════════════════════════════════════════════════════════════
              FORM FIELDS — shared across all breakpoints
              grid: cols-1 (mobile) → cols-2 (tablet) → cols-4 (desktop)
          ════════════════════════════════════════════════════════════════════ */}
            <div className="bg-white p-4 lg:p-6 rounded-md border border-border/60 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">

                {/* Invoice No. */}
                <div className="lg:col-span-1 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Invoice No.</Label>
                  <Input
                    value={tpCode}
                    readOnly
                    className="h-9 text-[13px] font-bold bg-slate-50 border-border/60 text-muted-foreground shadow-none cursor-default"
                  />
                </div>

                {/* Buyer */}
                <div className="md:col-span-1 lg:col-span-2 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Buyer selection</Label>
                  <Popover open={isBuyerOpen} onOpenChange={(open) => {
                    setIsBuyerOpen(open)
                    if (!open) {
                      const b = purchasers.find(p => p.p_id.toString() === buyer)
                      setBuyerSearch(b ? `${b.p_name} | ${b.p_name_kh || ""}` : "")
                    }
                  }}>
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
                          onFocus={() => { setBuyerSearch(""); setIsBuyerOpen(true) }}
                          onClick={() => { setBuyerSearch(""); setIsBuyerOpen(true) }}
                          disabled={isReadOnly}
                          className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0 shadow-2xl border-border/50 z-100"
                      align="start"
                      sideOffset={4}
                      onMouseDown={(e) => e.preventDefault()}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1">
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
                              onClick={() => handleBuyerSelect(p.p_id)}
                            >
                              <IconCheck className={cn("mr-2 h-3.5 w-3.5", buyer === p.p_id.toString() ? "opacity-100" : "opacity-0")} />
                              {p.p_name} | {p.p_name_kh || "-"}
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Region */}
                <div className="lg:col-span-1 space-y-1.5">
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
                      className="w-(--radix-popover-trigger-width) p-0 shadow-2xl border-border/50 z-100"
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1">
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

                {/* Vendor */}
                <div className="lg:col-span-1 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Vendor (Id)</Label>
                  <Popover open={isVendorOpen} onOpenChange={(open) => {
                    setIsVendorOpen(open)
                    if (!open) setVendorSearch(vendor)
                  }}>
                    <PopoverAnchor asChild>
                      <div className="relative group">
                        <Input
                          placeholder="Search vendor..."
                          value={vendorSearch}
                          onChange={(e) => {
                            const val = e.target.value
                            setVendorSearch(val)
                            if (!isVendorOpen) setIsVendorOpen(true)
                          }}
                          onFocus={() => { setVendorSearch(""); setIsVendorOpen(true) }}
                          onClick={() => { setVendorSearch(""); setIsVendorOpen(true) }}
                          disabled={isReadOnly || !isBuyerSelected}
                          className="pr-10 h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0 shadow-2xl border-border/50 z-100"
                      align="start"
                      sideOffset={4}
                      onMouseDown={(e) => e.preventDefault()}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1">
                        {vendorListContent}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Vendor Address */}
                <div className="md:col-span-2 lg:col-span-2 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Vendor Address</Label>
                  <Input
                    value={v_addr}
                    onChange={(e) => setVAddr(e.target.value)}
                    disabled={isReadOnly || !isBuyerSelected}
                    placeholder="Enter address..."
                    className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                  />
                </div>

                {/* Oven */}
                <div className="lg:col-span-1 space-y-1.5">
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
                      className="w-(--radix-popover-trigger-width) p-0 shadow-2xl border-border/50 z-100"
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1">
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

                {/* System Rate */}
                <div className="lg:col-span-1 space-y-1.5">
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

                {/* Remark */}
                <div className="md:col-span-1 lg:col-span-2 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Remark (Optional)</Label>
                  <Input
                    value={tpNote}
                    onChange={(e) => setTpNote(e.target.value)}
                    placeholder="Type notes here..."
                    disabled={isReadOnly}
                    className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                  />
                </div>

                {/* Purchase Date */}
                <div className="lg:col-span-1 space-y-1.5">
                  <Label className="text-[12px] font-bold text-muted-foreground/70">Purchase Date</Label>
                  <Input
                    value={dateDisplay}
                    onChange={(e) => {
                      const masked = maskDate(e.target.value)
                      setDateDisplay(masked)
                      const digits = masked.replaceAll(/\D/g, "")
                      if (digits.length === 8) {
                        const d = digits.slice(0, 2)
                        const m = digits.slice(2, 4)
                        const y = digits.slice(4, 8)
                        setTpDate(`${y}-${m}-${d}`)
                      } else {
                        setTpDate("")
                      }
                    }}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    disabled={isReadOnly}
                    className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all"
                  />
                </div>

              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════
              MOBILE ITEMS — (< 768px / below md)
              Card-per-row, full-width stacked
          ════════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden space-y-3">
              {details.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-md border border-dashed border-border/60 bg-slate-50/50">
                  <div className="size-12 rounded-full bg-white flex items-center justify-center border border-dashed border-border/60">
                    <IconPlus className="size-5 text-muted-foreground/20" />
                  </div>
                  <p className="text-[13px] font-bold text-foreground">No items yet</p>
                  <p className="text-[12px] text-muted-foreground/60 text-center max-w-56">Add tobacco items to build the purchase invoice.</p>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                      className="mt-1 h-9 px-5 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5">
                      <IconPlus className="mr-1.5 size-3.5" /> Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {details.map((detail, idx) => (
                    <PurchaseDetailCard
                      key={detail.tempId}
                      detail={detail}
                      index={idx}
                      isReadOnly={isReadOnly}
                      tobaccoTypes={tobaccoTypes}
                      onRemove={handleRemoveDetail}
                      onChange={handleDetailChange}
                      onPreviewImage={setPreviewImage}
                    />
                  ))}
                </div>
              )}
              {!isReadOnly && details.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                  className="w-full h-9 text-[12px] font-bold rounded-md bg-white hover:bg-slate-50 border-border/60 shadow-xs">
                  <IconPlus className="mr-2 size-4 text-primary" /> Add Row
                </Button>
              )}
              {details.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-md bg-slate-50 border border-border/60">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Total Weight</p>
                    <p className="text-[15px] font-black text-primary tabular-nums">
                      {totalNetWeight.toFixed(2)} <span className="text-[10px] font-bold">Kg</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-emerald-700/60 tracking-wider">Grand Total</p>
                    <p className="text-[16px] font-black text-emerald-700 tabular-nums">
                      ៛{Math.round(grandTotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
              TABLET ITEMS — (768px – 1023px / md → lg)
              2-column card grid
          ════════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block lg:hidden space-y-3">
              {details.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-md border border-dashed border-border/60 bg-slate-50/50">
                  <div className="size-12 rounded-full bg-white flex items-center justify-center border border-dashed border-border/60">
                    <IconPlus className="size-5 text-muted-foreground/20" />
                  </div>
                  <p className="text-[13px] font-bold text-foreground">No items yet</p>
                  <p className="text-[12px] text-muted-foreground/60 text-center max-w-56">Add tobacco items to build the purchase invoice.</p>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                      className="mt-1 h-9 px-5 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5">
                      <IconPlus className="mr-1.5 size-3.5" /> Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {details.map((detail, idx) => (
                    <PurchaseDetailCard
                      key={detail.tempId}
                      detail={detail}
                      index={idx}
                      isReadOnly={isReadOnly}
                      tobaccoTypes={tobaccoTypes}
                      onRemove={handleRemoveDetail}
                      onChange={handleDetailChange}
                      onPreviewImage={setPreviewImage}
                    />
                  ))}
                </div>
              )}
              {!isReadOnly && details.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                  className="w-full h-9 text-[12px] font-bold rounded-md bg-white hover:bg-slate-50 border-border/60 shadow-xs">
                  <IconPlus className="mr-2 size-4 text-primary" /> Add Row
                </Button>
              )}
              {details.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 rounded-md bg-slate-50 border border-border/60">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Total Weight</p>
                    <p className="text-[15px] font-black text-primary tabular-nums">
                      {totalNetWeight.toFixed(2)} <span className="text-[10px] font-bold">Kg</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-emerald-700/60 tracking-wider">Grand Total</p>
                    <p className="text-[16px] font-black text-emerald-700 tabular-nums">
                      ៛{Math.round(grandTotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════════════
              DESKTOP ITEMS — (≥ 1024px / lg and above)
              Full 9-column table, horizontally scrollable
          ════════════════════════════════════════════════════════════════════ */}
            <div className="hidden lg:block">
              {details.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 rounded-md border border-dashed border-border/60 bg-slate-50/50 mt-4">
                  <div className="size-16 rounded-full bg-white flex items-center justify-center border border-dashed border-border/60 shadow-xs">
                    <IconPlus className="size-6 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-[14px] font-bold text-foreground">No tobacco items recorded yet</p>
                    <p className="text-[12px] text-muted-foreground/60 max-w-64">Start building your purchase invoice by adding tobacco items.</p>
                  </div>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                      className="mt-2 h-9 px-6 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-xs">
                      <IconPlus className="mr-2 size-3.5" /> Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {details.map((detail, idx) => (
                    <PurchaseDetailDesktopCard
                      key={detail.tempId}
                      detail={detail}
                      index={idx}
                      isReadOnly={isReadOnly}
                      tobaccoTypes={tobaccoTypes}
                      onRemove={handleRemoveDetail}
                      onChange={handleDetailChange}
                      onPreviewImage={setPreviewImage}
                    />
                  ))}

                  {/* Desktop Summary Bar */}
                  <div className="bg-slate-100/80 backdrop-blur-sm border border-border/80 rounded-md p-3 flex flex-row justify-between items-center mt-4">
                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Summary ({details.length} Items)
                    </span>
                    <div className="flex items-center gap-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold uppercase text-slate-400">Total Weight:</span>
                        <span className="text-[18px] font-black text-primary tabular-nums">
                          {totalNetWeight.toFixed(2)} <span className="text-[11px] font-bold text-primary/50">Kg</span>
                        </span>
                      </div>
                      <div className="h-6 w-px bg-border" />
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-bold uppercase text-emerald-700/50">Grand Total:</span>
                        <span className="text-[20px] font-black text-emerald-700 tabular-nums">
                          ៛{Math.round(grandTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add Row Button Row */}
                  <div className="flex flex-row justify-between items-center mt-3 px-1">
                    {!isReadOnly && (
                      <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                        className="h-8.5 px-4 text-[12px] font-bold rounded-md bg-white hover:bg-slate-50 border-border/60 shadow-xs transition-all active:scale-95">
                        <IconPlus className="mr-1.5 size-3.5 text-primary" /> Add Row
                      </Button>
                    )}
                    <span className="text-[11px] font-medium text-muted-foreground italic">
                      Tip: Changes are saved only after clicking &apos;Save Purchase&apos;
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3.5 border-t border-border/40 mt-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}
                className="h-8.5 px-4 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button type="submit" disabled={isSubmitting}
                  className="h-8.5 px-5 bg-[#009640] hover:bg-[#008a3b] text-white shadow-md shadow-green-500/10 rounded-md text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-2">
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
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-2xl flex items-center justify-center z-120 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 [&>button]:hidden">
            <DialogTitle className="sr-only">Tobacco Purchase Detail Image Preview</DialogTitle>
            <DialogDescription className="sr-only">Preview of the uploaded image for the tobacco purchase detail.</DialogDescription>
            <div className="relative max-h-[85vh] max-w-full overflow-hidden rounded-lg bg-black/90 p-1.5 flex items-center justify-center group/preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Tobacco Purchase Detail"
                className="max-h-[80vh] max-w-full object-contain rounded-md select-none"
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 hover:scale-105 active:scale-95 transition-all animate-in fade-in duration-200"
              >
                <IconX className="size-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// ─── PurchaseDetailCard — mobile & tablet card layout ────────────────────────

const PurchaseDetailCard = React.memo(({
  detail, index, isReadOnly, tobaccoTypes, onRemove, onChange, onPreviewImage
}: {
  detail: Partial<TobaccoPurchaseDetail> & { tempId: string }
  index: number
  isReadOnly?: boolean
  tobaccoTypes: TobaccoItem[]
  onRemove: (idx: number) => void
  onChange: (idx: number, field: keyof TobaccoPurchaseDetail, val: string | number) => void
  onPreviewImage: (url: string) => void
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState(() => {
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [prevTobaccoId, setPrevTobaccoId] = React.useState(detail.tobacco_name)
  if (detail.tobacco_name !== prevTobaccoId) {
    setPrevTobaccoId(detail.tobacco_name)
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
  }

  const netWeight = Math.max(0,
    (Number(detail.gross_weight) || 0) -
    (Number(detail.remork_in_kg) || 0) -
    (Number(detail.sack_in_kg) || 0)
  )
  const total = Math.round(netWeight * (Number(detail.price) || 0))

  return (
    <div className="rounded-md border border-border/60 bg-white overflow-hidden">

      {/* Card header: item number + delete */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50/80 border-b border-border/40">
        <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Item #{index + 1}
        </span>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded hover:bg-red-50 text-muted-foreground/30 hover:text-red-500 transition-colors"
          >
            <IconX className="size-3.5" />
          </button>
        )}
      </div>

      {/* Tobacco item selector & Image */}
      <div className="flex flex-col border-b border-border/30">
        <div className="flex flex-col items-center justify-center px-3 pt-4 pb-3 border-b border-border/10">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-2 text-center">Item Image</Label>
          <Popover>
            <PopoverTrigger asChild>
              {detail.picture ? (
                <button
                  type="button"
                  className="w-32 h-32 bg-white rounded-lg border border-border/60 overflow-hidden group/img relative flex items-center justify-center shadow-xs p-0 outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPictureUrl(detail.picture)}
                    alt="Tobacco item detail"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-all duration-200"
                  />
                  {!isReadOnly && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <IconPlus className="size-8 text-white" />
                    </div>
                  )}
                </button>
              ) : (
                <button type="button" disabled={isReadOnly} className="w-32 h-32 bg-slate-50/50 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center hover:border-primary/40 transition-all group/img overflow-hidden relative cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed">
                  <IconPlus className="size-10 text-muted-foreground/20 group-hover/img:text-primary/40" />
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1 shadow-2xl border-border/50 z-100" align="center" sideOffset={8}>
              <div className="flex flex-col">
                {detail.picture && (
                  <button type="button" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-slate-100 rounded text-left font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary" onClick={() => onPreviewImage(getPictureUrl(detail.picture!))}>
                    <IconSearch className="size-4" /> View Full Image
                  </button>
                )}
                {!isReadOnly && (
                  <>
                    <label className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-slate-100 rounded cursor-pointer font-medium outline-none focus-within:ring-1 focus-within:ring-primary">
                      <IconCamera className="size-4 text-primary" /> Take Camera Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => onChange(index, "picture", reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-slate-100 rounded cursor-pointer font-medium outline-none focus-within:ring-1 focus-within:ring-primary">
                      <IconPhoto className="size-4 text-emerald-600" /> Upload Existing
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => onChange(index, "picture", reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="px-3 pt-3 pb-3">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1.5">Tobacco Item</Label>
          <Popover open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
              setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
            }
          }}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  placeholder="Search item..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
                  onFocus={() => { setSearch(""); setOpen(true) }}
                  onClick={() => { setSearch(""); setOpen(true) }}
                  disabled={isReadOnly}
                  className="h-9 text-[13px] bg-white border border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 pr-10"
                />
                <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 pointer-events-none" />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0 shadow-2xl border-border/50 z-100"
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-62.5 overflow-y-auto p-1">
                {tobaccoTypes.length === 0 ? (
                  <div className="px-3 py-4 text-[12px] text-muted-foreground text-center">No tobacco items found</div>
                ) : tobaccoTypes
                  .filter(t => {
                    const s = search.toLowerCase()
                    return t.t_name?.toLowerCase().includes(s) || t.t_name_kh?.toLowerCase().includes(s)
                  })
                  .map((t) => (
                    <button
                      key={t.t_id}
                      type="button"
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[12px] outline-hidden hover:bg-accent",
                        detail.tobacco_name === t.t_id && "bg-accent"
                      )}
                      onClick={() => {
                        onChange(index, "tobacco_name", t.t_id)
                        setSearch(`${t.t_name} | ${t.t_name_kh || ""}`)
                        setOpen(false)
                      }}
                    >
                      <IconCheck className={cn("mr-2 h-3 w-3", detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0")} />
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
      </div>

      {/* Weight row: G.Weight | Remork | Sack | Borrowed Leaf */}
      <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30">
        <div className="px-2 py-2.5 space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">G.Weight</Label>
          <Input type="number" step="1"
            className="h-8 text-[13px] font-bold bg-transparent border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-2"
            value={detail.gross_weight ?? ""} disabled={isReadOnly}
            onChange={(e) => onChange(index, "gross_weight", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          />
        </div>
        <div className="px-2 py-2.5 space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Remork</Label>
          <Input type="number" step="1"
            className="h-8 text-[13px] bg-transparent border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-2"
            value={detail.remork_in_kg ?? ""} disabled={isReadOnly}
            onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border/30 border-b border-border/30 bg-slate-50/30">
        <div className="px-2 py-2.5 space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Sack(Kg)</Label>
          <Input type="number" step="0.01"
            className="h-8 text-[13px] bg-transparent border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-2"
            value={detail.sack_in_kg ?? ""} disabled={isReadOnly}
            onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          />
        </div>
        <div className="px-2 py-2.5 space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Borrow(Kg)</Label>
          <Input type="number" step="0.01"
            className="h-8 text-[13px] bg-transparent border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-2"
            value={detail.borrowed_leaf_kg ?? ""} disabled={isReadOnly}
            placeholder="opt."
            onChange={(e) => onChange(index, "borrowed_leaf_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* Footer row: Price | Net Weight | Total */}
      <div className="grid grid-cols-3 divide-x divide-border/30">
        <div className="px-3 py-2.5 space-y-1">
          <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Price/Kg</Label>
          <div className="relative">
            <Input type="number"
              className="h-8 text-[13px] font-bold bg-transparent border-border/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 px-2 pr-5"
              value={detail.price ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold opacity-25">៛</span>
          </div>
        </div>
        <div className="px-3 py-2.5 space-y-0.5 bg-primary/2">
          <Label className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Net (Kg)</Label>
          <p className="text-[13px] font-black text-primary tabular-nums">{netWeight.toFixed(2)}</p>
        </div>
        <div className="px-3 py-2.5 space-y-0.5 bg-emerald-50/40">
          <Label className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider">Total</Label>
          <p className="text-[13px] font-black text-emerald-700 tabular-nums">
            ៛{total.toLocaleString()}
          </p>
        </div>
      </div>

    </div>
  )
})

PurchaseDetailCard.displayName = "PurchaseDetailCard"

// ─── PurchaseDetailDesktopCard — desktop spacious horizontal card layout ───

const PurchaseDetailDesktopCard = React.memo(({
  detail, index, isReadOnly, tobaccoTypes, onRemove, onChange, onPreviewImage
}: {
  detail: Partial<TobaccoPurchaseDetail> & { tempId: string }
  index: number
  isReadOnly?: boolean
  tobaccoTypes: TobaccoItem[]
  onRemove: (idx: number) => void
  onChange: (idx: number, field: keyof TobaccoPurchaseDetail, val: string | number) => void
  onPreviewImage: (url: string) => void
}) => {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState(() => {
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    return t ? `${t.t_name} | ${t.t_name_kh || ""}` : ""
  })
  const [prevTobaccoId, setPrevTobaccoId] = React.useState(detail.tobacco_name)

  if (detail.tobacco_name !== prevTobaccoId) {
    setPrevTobaccoId(detail.tobacco_name)
    const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
    setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
  }

  const netWeight = Math.max(0,
    (Number(detail.gross_weight) || 0) -
    (Number(detail.remork_in_kg) || 0) -
    (Number(detail.sack_in_kg) || 0)
  )
  const total = Math.round(netWeight * (Number(detail.price) || 0))

  return (
    <div className={cn(
      "relative bg-white border border-border/85 hover:border-primary/45 hover:-translate-y-0.5 rounded-lg shadow-xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 p-3.5 mt-3.5",
      "focus-within:border-primary/30 focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
      index % 2 === 0 ? "bg-white" : "bg-slate-50/10"
    )}>
      {/* Top bar: Item Index and Delete Action */}
      <div className="flex items-center justify-between gap-4 pb-1.5 border-b border-border/35 mb-2">
        <span className="text-[11.5px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Item #{index + 1}
        </span>
        {!isReadOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 h-6.5 px-2 rounded-md transition-colors text-[11px]"
          >
            <IconX className="size-3 mr-1" /> Remove Item
          </Button>
        )}
      </div>

      {/* Main content body: Image on the Left, Spacious form fields on the Right */}
      <div className="flex flex-row gap-4 items-start">
        {/* Left Side: Enlarged Image upload / preview box (w-[189px] h-[189px] for perfect 1:1 alignment) */}
        <div className="flex-shrink-0">
          {detail.picture ? (
            <div className="w-[189px] h-[189px] bg-white rounded-md border border-border/80 overflow-hidden group/img relative flex items-center justify-center shadow-xs">
              <button
                type="button"
                onClick={() => onPreviewImage(getPictureUrl(detail.picture))}
                className="w-full h-full p-0 border-none outline-none bg-transparent cursor-zoom-in outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPictureUrl(detail.picture)}
                  alt="Tobacco item detail"
                  className="w-full h-full object-cover hover:scale-105 transition-all duration-200"
                />
              </button>
              {!isReadOnly && (
                <label className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                  <IconPlus className="size-10 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          onChange(index, "picture", reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              )}
            </div>
          ) : (
            <label className="w-[189px] h-[189px] bg-slate-50/50 rounded-md border border-dashed border-border/80 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-all group/img overflow-hidden relative block">
              <IconPlus className="size-10 text-muted-foreground/20 group-hover/img:text-primary/40" />
              {!isReadOnly && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        onChange(index, "picture", reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              )}
            </label>
          )}
        </div>

        {/* Right Side: Spacious Form fields */}
        <div className="flex-1 space-y-3">
          {/* Row 1: Tobacco Item Search Popover (2 columns) & Borrow Leaf (1 column) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Tobacco Item</Label>
              <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen)
                if (!isOpen) {
                  const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
                  setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
                }
              }}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search and select tobacco item..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
                      onFocus={() => { setSearch(""); setOpen(true) }}
                      onClick={() => { setSearch(""); setOpen(true) }}
                      disabled={isReadOnly}
                      className="h-9 text-[13px] bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 pr-10"
                    />
                    <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-96 p-0 shadow-2xl border-border/50 z-100"
                  align="start"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-62.5 overflow-y-auto p-1">
                    {tobaccoTypes.length === 0 ? (
                      <div className="px-3 py-4 text-[12px] text-muted-foreground text-center">No tobacco items found</div>
                    ) : tobaccoTypes
                      .filter(t => {
                        const s = search.toLowerCase()
                        return t.t_name?.toLowerCase().includes(s) || t.t_name_kh?.toLowerCase().includes(s)
                      })
                      .map((t) => (
                        <button
                          key={t.t_id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[12px] outline-hidden hover:bg-accent",
                            detail.tobacco_name === t.t_id && "bg-accent"
                          )}
                          onClick={() => {
                            onChange(index, "tobacco_name", t.t_id)
                            setSearch(`${t.t_name} | ${t.t_name_kh || ""}`)
                            setOpen(false)
                          }}
                        >
                          <IconCheck className={cn("mr-2 h-3 w-3", detail.tobacco_name === t.t_id ? "opacity-100" : "opacity-0")} />
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

            <div className="col-span-1 space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Borrow Leaf (Kg)</Label>
              <Input type="number" step="0.01"
                className="h-9 text-[13px] font-medium bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 px-2.5 placeholder:text-muted-foreground/20"
                value={detail.borrowed_leaf_kg ?? ""} disabled={isReadOnly}
                placeholder="Optional"
                onChange={(e) => onChange(index, "borrowed_leaf_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Row 2: Weights Inputs (3 equal columns) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Gross Weight (Kg)</Label>
              <Input type="number" step="1"
                className="h-9 text-[13px] font-medium bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 px-2.5"
                value={detail.gross_weight ?? ""} disabled={isReadOnly}
                onChange={(e) => onChange(index, "gross_weight", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Remork (Kg)</Label>
              <Input type="number" step="1"
                className="h-9 text-[13px] font-medium bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 px-2.5"
                value={detail.remork_in_kg ?? ""} disabled={isReadOnly}
                onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Sack Weight (Kg)</Label>
              <Input type="number" step="0.01"
                className="h-9 text-[13px] font-medium bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 px-2.5"
                value={detail.sack_in_kg ?? ""} disabled={isReadOnly}
                onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* Row 3: Price, Net Weight, and Total Amount (3 equal columns representing Price x Net Weight = Total Amount) */}
          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Price/Kg</Label>
              <div className="relative">
                <Input type="number"
                  className="h-9 text-[13px] font-bold bg-white border border-border/80 shadow-xs focus-visible:ring-1 focus-visible:ring-primary/30 px-2.5 pr-7"
                  value={detail.price ?? ""} disabled={isReadOnly}
                  onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold opacity-40">៛</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Net Weight(Kg)</Label>
              <div className="h-9 bg-primary/5 border border-primary/20 rounded-md px-2.5 flex items-center justify-between shadow-xs">
                <span className="text-[13.5px] font-black text-primary tabular-nums">
                  {netWeight.toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-primary/50">Kg</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wider">Total Amount</Label>
              <div className="h-9 bg-emerald-50/50 border border-emerald-100 rounded-md px-3 flex items-center justify-between shadow-xs">
                <span className="text-[12px] font-bold text-emerald-700/50">៛</span>
                <span className="text-[15px] font-black text-emerald-700 tabular-nums">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
})

PurchaseDetailDesktopCard.displayName = "PurchaseDetailDesktopCard"
