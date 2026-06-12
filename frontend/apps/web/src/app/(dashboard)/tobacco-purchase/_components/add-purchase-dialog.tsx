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
  TobaccoReturnCreate,
} from "@/services/api-client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  IconLoader2,
  IconPlus,
  IconSquareRoundedPlus,
  IconSeedling,
  IconSearch,
  IconCheck,
  IconX,
  IconCamera,
  IconPhoto,
  IconPrinter,
  IconFileInvoice,
  IconUser,
  IconMapPin,
  IconBuildingStore,
  IconHome,
  IconFlame,
  IconCurrencyDollar,
  IconNote,
  IconCalendar,
  IconLeaf,
  IconWeight,
  IconTruck,
  IconPackage,
} from "@tabler/icons-react"
import { printInvoice } from "./invoice-print"
import { ReturnDetailCard, ReturnDetailDesktopCard, type ReturnItemType } from "./return-cards"
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

async function processImageFile(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const cropSize = Math.min(img.width, img.height)
      const outputSize = Math.min(cropSize, maxSize)
      const canvas = document.createElement("canvas")
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext("2d")!
      const offsetX = (img.width - cropSize) / 2
      const offsetY = (img.height - cropSize) / 2
      ctx.drawImage(img, offsetX, offsetY, cropSize, cropSize, 0, 0, outputSize, outputSize)
      resolve(canvas.toDataURL("image/webp", 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")) }
    img.src = objectUrl
  })
}

function getPictureUrl(picture?: string | null): string {
  if (!picture) return ""
  if (picture.startsWith("data:") || picture.startsWith("blob:")) {
    return picture
  }
  const apiRoot = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000/api/v1"
  const backendBase = apiRoot.replace("/api/v1", "")
  return `${backendBase}/uploads/${picture}`
}

function TobaccoQuotaDisplay({ displayRemainingQuota }: Readonly<{ displayRemainingQuota: number | null }>) {
  if (displayRemainingQuota === null) return null;
  return (
    <div className="flex shrink-0 mr-2">
      <span className="block text-sm md:text-base lg:text-base font-medium text-white mr-1">Quota: </span>
      <div className="flex items-baseline gap-0.5">
        <span className={cn("text-sm md:text-base lg:text-base font-medium",
          displayRemainingQuota >= 0 ? "text-white" : "text-red-500"
        )}>
          {displayRemainingQuota >= 0 ? "+" : ""}
          {displayRemainingQuota.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={cn(
          "text-sm md:text-base lg:text-base",
          displayRemainingQuota >= 0 ? "text-white" : "text-red-500"
        )}>
          kg
        </span>
      </div>
    </div>
  )
}

function getDialogLabels(isReadOnly?: boolean, initialData?: TobaccoPurchase | null) {
  if (isReadOnly) {
    return {
      title: "View Tobacco Purchase",
      mobileTitle: "View Tobacco",
      description: "Viewing purchase details.",
    }
  }
  if (initialData) {
    return {
      title: "Edit Tobacco Purchase",
      mobileTitle: "Edit Tobacco",
      description: "Update the purchase information below.",
    }
  }
  return {
    title: "New Tobacco Purchase",
    mobileTitle: "Add Tobacco",
    description: "Enter purchase details and item breakdown.",
  }
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

type VendorIdType = number | string | null;

function validatePurchaseForm(
  buyer: string,
  vendor: VendorIdType,
  region: string,
  rate: string,
  details: (Partial<TobaccoPurchaseDetail> & { tempId: string })[]
): boolean {
  if (!buyer) {
    toast.error("Please select a Buyer")
    return false
  }
  if (!vendor) {
    toast.error("Please select a Vendor")
    return false
  }
  if (!region) {
    toast.error("Please select a Region")
    return false
  }
  if (!rate) {
    toast.error("Please enter a valid exchange rate")
    return false
  }
  if (details.length === 0) {
    toast.error("Please add at least one tobacco purchase item")
    return false
  }
  if (details.some(d => !d.tobacco_name || !d.gross_weight || !d.price)) {
    toast.error("Please ensure all item details have a Tobacco Grade, Gross Weight, and Price/Kg")
    return false
  }
  return true
}

interface AddPurchaseDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  onPrint?: (record: TobaccoPurchase) => void
  accessToken: string
  initialData?: TobaccoPurchase | null
  isReadOnly?: boolean
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  ovens: OvenItem[]
  tobaccoTypes: TobaccoItem[]
}

function VendorListContent({
  isVendorsLoading,
  vendors,
  buyer,
  vendorSearch,
  vendor,
  setVendor,
  setVendorSearch,
  setVAddr,
  setIsVendorOpen
}: Readonly<{
  isVendorsLoading: boolean;
  vendors: MemberFarmerItem[];
  buyer: string;
  vendorSearch: string;
  vendor: VendorIdType;
  setVendor: (v: VendorIdType) => void;
  setVendorSearch: (v: string) => void;
  setVAddr: (v: string) => void;
  setIsVendorOpen: (open: boolean) => void;
}>) {
  if (isVendorsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (vendors.length === 0) {
    return (
      <div className="px-3 py-4 text-[12px] text-muted-foreground text-center">
        {buyer ? "No vendors found for this buyer" : "Select a buyer first"}
      </div>
    )
  }
  return (
    <>
      {vendors
        .filter(f =>
          f.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
          f.mf_code.toLowerCase().includes(vendorSearch.toLowerCase())
        )
        .map((f) => (
          <button
            key={f.mf_id}
            type="button"
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
              vendor === f.mf_id && "bg-accent"
            )}
            onClick={() => {
              setVendor(f.mf_id)
              setVendorSearch(`${f.name} | ${f.mf_code}`)
              setVAddr(f.address || "")
              setIsVendorOpen(false)
            }}
          >
            <IconCheck className={cn("mr-2 h-3.5 w-3.5", vendor === f.mf_id ? "opacity-100" : "opacity-0")} />
            {f.name} | {f.mf_code}
          </button>
        ))}
    </>
  )
}

export function AddPurchaseDialog({
  open,
  onClose,
  onSuccess,
  onPrint,
  accessToken,
  initialData,
  isReadOnly,
  purchasers,
  regions,
  ovens,
  tobaccoTypes,
}: Readonly<AddPurchaseDialogProps>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [printAfterSave, setPrintAfterSave] = React.useState(false)
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
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
  const [vendor, setVendor] = React.useState<VendorIdType>(null)
  const [v_addr, setVAddr] = React.useState("")
  const [region, setRegion] = React.useState<string>("")
  const [tpDate, setTpDate] = React.useState<string>("")
  const [tpNote, setTpNote] = React.useState("")
  const [oven, setOven] = React.useState<string>("")
  const [rate, setRate] = React.useState("4000")
  const [tpCode, setTpCode] = React.useState(`${format(new Date(), "yyyyMMdd")}-TEMP`)

  const [details, setDetails] = React.useState<(Partial<TobaccoPurchaseDetail> & { tempId: string })[]>([])
  const [returns, setReturns] = React.useState<ReturnItemType[]>([])

  const initialized = React.useRef(false)

  const { data: vendors = [], isLoading: isVendorsLoading } = useQuery({
    queryKey: ["vendors", buyer],
    queryFn: () => apiClient.getVendorsByBuyer(accessToken, Number(buyer)),
    enabled: !!buyer && !!accessToken,
  })

  // Synchronize vendor search text when vendors load (e.g. on edit mode populate)
  React.useEffect(() => {
    if (vendor && vendors.length > 0 && vendorSearch && !vendorSearch.includes("|")) {
      const match = vendors.find(v => String(v.mf_id) === String(vendor))
      if (match) {
        const t = setTimeout(() => setVendorSearch(`${match.name} | ${match.mf_code}`), 0)
        return () => clearTimeout(t)
      }
    }
  }, [vendor, vendors, vendorSearch])

  const resetForm = React.useCallback(() => {
    setBuyer("")
    setBuyerSearch("")
    setVendor(null)
    setVendorSearch("")
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
    setReturns([])
  }, [ovens])

  const populateForm = React.useCallback(async (data: TobaccoPurchase) => {
    setBuyer(data.buyer?.toString() || "")
    setVendor(data.vendor_id || null)
    setVendorSearch(data.vendor_name || "")
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
    const genId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setDetails(data.details?.map((d: Partial<TobaccoPurchaseDetail>) => ({ ...d, tempId: genId() })) || [])
    setReturns(data.returns?.map((r: Partial<TobaccoReturnCreate>) => ({ ...r, tempId: genId() })) || [])

    const b = purchasers.find(p => p.p_id === data.buyer)
    if (b) setBuyerSearch(`${b.p_name} | ${b.p_name_kh || ""}`)

    const r = regions.find(item => item.reg_id === data.region)
    if (r) setRegionSearch(`${r.reg_name} | ${r.reg_name_kh || ""}`)

    const o = ovens.find(item => item.id === data.oven)
    if (o) setOvenSearch(`${o.name_en} | ${o.name_kh || ""}`)
  }, [purchasers, regions, ovens])

  // Populate or reset whenever the dialog opens or the record being edited changes.
  // Using initialData directly as the dependency (not a ref guard) so switching
  // from record A â†’ record B always re-populates correctly.
  React.useEffect(() => {
    if (!open) {
      initialized.current = false
      return
    }
    if (initialized.current) return
    initialized.current = true
    if (initialData) {
      queueMicrotask(() => populateForm(initialData))
    } else {
      queueMicrotask(() => resetForm())
    }
  }, [open, initialData, populateForm, resetForm])

  // Auto-fetch sack weight only when creating a NEW record (no initialData).
  // Skip this for edit mode â€” we must preserve the sack_in_kg values from the DB.
  React.useEffect(() => {
    if (!vendor || isReadOnly || initialData) return

    let active = true
    async function fetchSackWeight() {
      try {
        const { sack_in_kg } = await apiClient.getVendorSack(accessToken, vendor as number)
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

  const { data: vendorContracts = [] } = useQuery({
    queryKey: ["vendorContracts", vendor],
    queryFn: () => apiClient.getVendorContracts(accessToken, Number(vendor)),
    enabled: !!vendor && !Number.isNaN(Number(vendor)),
  })

  const handleAddDetail = React.useCallback(() => {
    const tempId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setDetails(prev => [...prev, { tempId, tobacco_name: undefined, gross_weight: 0, price: 0, sack_in_kg: 0 }])
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

  const handleAddReturn = React.useCallback(() => {
    const tempId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setReturns(prev => [...prev, { tempId, con_id: undefined, tobac_type: undefined, qty_repay: '' as unknown as number }])
  }, [])

  const handleRemoveReturn = React.useCallback((index: number) => {
    setReturns(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleReturnChange = React.useCallback((index: number, field: string, val: string | number) => {
    setReturns(prev => {
      const newReps = [...prev]
      const item = newReps[index]
      if (item) newReps[index] = { ...item, [field]: val }
      return newReps
    })
  }, [])

  const handleBuyerSelect = React.useCallback((pId: number) => {
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

    setVendor(null)
    setVendorSearch("")
  }, [purchasers, regions])

  const buildPayload = React.useCallback((): TobaccoPurchaseCreate => {
    return {
      buyer: buyer ? Number.parseInt(buyer, 10) : undefined,
      vendor_id: vendor ?? undefined,
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
        picture: d.picture || null,
      })) as TobaccoPurchaseDetail[],
      returns: returns.length > 0 ? returns.map(r => ({
        con_id: Number(r.con_id),
        con_num: r.con_num || "",
        tobac_type: Number(r.tobac_type),
        qty_repay: Number(r.qty_repay) || 0
      })) : undefined
    }
  }, [buyer, vendor, v_addr, region, tpDate, tpNote, oven, rate, details, returns])

  const handlePostSavePrint = React.useCallback(async (savedRecord: TobaccoPurchase | null, shouldPrint: boolean) => {
    if ((shouldPrint || printAfterSave) && savedRecord) {
      if (onPrint) {
        const selectedV = vendors.find(v => String(v.mf_id) === String(savedRecord?.vendor_id))
        setVendorSearch(selectedV ? `${selectedV.name} | ${selectedV.mf_code}` : "")
        onPrint(savedRecord)
      } else {
        const selectedV = vendors.find(v => String(v.mf_id) === String(savedRecord?.vendor_id))
        await printInvoice({ record: savedRecord, purchasers, regions, ovens, tobaccoTypes, mfCode: selectedV?.mf_code })
      }
    }
  }, [printAfterSave, onPrint, vendors, purchasers, regions, ovens, tobaccoTypes])

  const handleSubmit = async (e: React.BaseSyntheticEvent, shouldPrint = false) => {
    e.preventDefault()
    if (!validatePurchaseForm(buyer, vendor, region, rate, details)) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      let savedRecord: TobaccoPurchase | null = null
      if (initialData?.tp_id) {
        savedRecord = await apiClient.updateTobaccoPurchase(accessToken, initialData.tp_id, payload)
        toast.success("Purchase updated successfully")
      } else {
        savedRecord = await apiClient.createTobaccoPurchase(accessToken, payload)
        toast.success("Purchase recorded successfully")
      }
      onSuccess()
      onClose()
      await handlePostSavePrint(savedRecord, shouldPrint)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
      setPrintAfterSave(false)
    }
  }

  const isBuyerSelected = purchasers.some(p => p.p_id.toString() === buyer)



  // Computed totals for mobile/tablet summary
  const totalNetWeight = details.reduce((sum, item) => {
    return sum + Math.max(0, (Number(item.gross_weight) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
  }, 0)
  const totalRepayWeight = returns.reduce((sum, item) => sum + (Number(item.qty_repay) || 0), 0)
  const grandTotal = details.reduce((sum, item) => {
    const net = Math.max(0, (Number(item.gross_weight) || 0) - (Number(item.remork_in_kg) || 0) - (Number(item.sack_in_kg) || 0))
    return sum + net * (Number(item.price) || 0)
  }, 0)

  const { title, mobileTitle, description } = getDialogLabels(isReadOnly, initialData)

  const selectedVendorItem = vendors.find((v) => String(v.mf_id) === String(vendor))
  const displayTobacNum =
    selectedVendorItem?.tobac_num !== undefined &&
      selectedVendorItem?.tobac_num !== null
      ? selectedVendorItem.tobac_num * 0.8
      : null

  const displayPurchasedWeight = selectedVendorItem?.purchased_weight ?? 0
  const displayRemainingQuota = typeof displayTobacNum === "number"
    ? displayTobacNum - displayPurchasedWeight
    : null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-sm border-black/20">
          <DialogHeader className="mb-0  shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="space-y-1">
                <DialogTitle className="text-[18px] font-medium text-foreground">
                  <span className="md:hidden">{mobileTitle}</span>
                  <span className="hidden md:inline">{title}</span>
                </DialogTitle>
                <DialogDescription className="hidden md:block text-sm font-medium text-gray-600">{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className={cn("flex flex-col flex-1 min-h-0", isReadOnly && "[&_input:disabled]:bg-white [&_input:disabled]:opacity-100 [&_input:disabled]:text-foreground [&_input:disabled]:border-black/20 [&_input:disabled]:cursor-default")}>
            <div className="flex-1 overflow-y-auto space-y-5">

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                FORM FIELDS — shared across all breakpoints
                grid: cols-1 (mobile) → cols-2 (tablet) → cols-4 (desktop)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="bg-white mt-3 py-3 px-3 md:py-5 md:px-6 lg:px-7 lg:py-4 rounded-md border border-black/20 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-x-4 gap-y-3">

                {/* Invoice No. */}
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Invoice</Label>
                  <div className="relative">
                    <IconFileInvoice className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                    <Input
                      value={tpCode}
                      readOnly
                      className="pl-8 h-8 text-[13px] rounded-sm font-normal bg-input/50 border-black/20 cursor-default"
                    />
                  </div>
                </div>

                {/* Buyer */}
                <div className="md:col-span-1 lg:col-span-4 space-y-1.5">
                  <Label className="text-sm">Buyer</Label>
                  <Popover open={isBuyerOpen} onOpenChange={(open) => {
                    setIsBuyerOpen(open)
                    if (!open) {
                      const b = purchasers.find(p => p.p_id.toString() === buyer)
                      setBuyerSearch(b ? `${b.p_name} | ${b.p_name_kh || ""}` : "")
                    }
                  }}>
                    <PopoverAnchor asChild>
                      <div className="relative group">
                        <IconUser className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
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
                          className="pl-8 pr-10 h-8 text-sm rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0 border-black/20 z-100"
                      align="start"
                      sideOffset={4}
                      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
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
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
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
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Region</Label>
                  <Popover open={isRegionOpen} onOpenChange={setIsRegionOpen}>
                    <PopoverAnchor asChild>
                      <div className="relative group">
                        <IconMapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
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
                          className="pl-8 pr-10 h-8 text-[13px] rounded-sm bg-white border border-black/20  focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0 border-black/20 z-100"
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
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
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
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
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Vendor</Label>
                  <Popover open={isVendorOpen} onOpenChange={(open) => {
                    setIsVendorOpen(open)
                    if (!open) {
                      const selectedV = vendors.find(v => String(v.mf_id) === String(vendor));
                      setVendorSearch(selectedV ? `${selectedV.name} | ${selectedV.mf_code}` : "")
                    }
                  }}>
                    <PopoverAnchor asChild>
                      <div className="relative group">
                        <IconBuildingStore className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
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
                          className="pl-8 pr-10 h-8 text-[13px] rounded-sm bg-white border border-black/20  focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0 border-black/20 z-100"
                      align="start"
                      sideOffset={4}
                      onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
                        <VendorListContent
                          isVendorsLoading={isVendorsLoading}
                          vendors={vendors}
                          buyer={buyer}
                          vendorSearch={vendorSearch}
                          vendor={vendor}
                          setVendor={setVendor}
                          setVendorSearch={setVendorSearch}
                          setVAddr={setVAddr}
                          setIsVendorOpen={setIsVendorOpen}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Vendor Address */}
                <div className="md:col-span-2 lg:col-span-4 space-y-1.5">
                  <Label className="text-sm">Address</Label>
                  <div className="relative">
                    <IconHome className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                    <Input
                      value={v_addr}
                      onChange={(e) => setVAddr(e.target.value)}
                      disabled={isReadOnly || !isBuyerSelected}
                      placeholder="Enter address..."
                      className="pl-8 h-8 text-[13px] rounded-sm bg-white border border-black/20  focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                    />
                  </div>
                </div>

                {/* Oven */}
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Oven</Label>
                  <Popover open={isOvenOpen} onOpenChange={setIsOvenOpen}>
                    <PopoverAnchor asChild>
                      <div className="relative group">
                        <IconFlame className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
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
                          className="pl-8 pr-10 h-8 text-[13px] rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                        />
                        <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 group-focus-within:opacity-60 transition-opacity pointer-events-none" />
                      </div>
                    </PopoverAnchor>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) p-0  border-black/20 z-100"
                      align="start"
                      sideOffset={4}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onInteractOutside={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('.group')) e.preventDefault()
                      }}
                    >
                      <div className="max-h-75 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
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
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-hidden hover:bg-accent hover:text-accent-foreground",
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

                {/* Exchange Rate */}
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Exchange Rate</Label>
                  <div className="relative group">
                    <IconCurrencyDollar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                    <Input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      required
                      disabled={isReadOnly}
                      className="pl-8 h-8 text-[13px] rounded-sm font-semibold bg-white border border-black/20 text-medium focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                    />
                    <div className="absolute rounded-sm right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold opacity-40">៛</div>
                  </div>
                </div>

                {/* Remark */}
                <div className="md:col-span-1 lg:col-span-4 space-y-1.5">
                  <Label className="text-sm">Remark (Optional)</Label>
                  <div className="relative">
                    <IconNote className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                    <Input
                      value={tpNote}
                      onChange={(e) => setTpNote(e.target.value)}
                      placeholder="Type notes here..."
                      disabled={isReadOnly}
                      className="pl-8 h-8 text-[13px] rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                    />
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-sm">Purchase Date</Label>
                  <div className="relative">
                    <IconCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
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
                      className="pl-8 h-8 text-[13px] rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 transition-all"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                MOBILE ITEMS — (< 768px / below md)
                Card-per-row, full-width stacked
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="md:hidden border border-black/20 rounded-sm">
              <div className="flex py-1 px-1 items-center justify-between rounded-t-sm bg-green-600">
                <h3 className="flex items-center gap-2 py-2 px-4 text-white">Tobacco Purchase</h3>
                <TobaccoQuotaDisplay displayRemainingQuota={displayRemainingQuota} />
              </div>
              <div className="space-y-3">
                {details.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-sm border border-dashed border-black/20 bg-slate-50/50">
                    <div className="size-12 rounded-full bg-white flex items-center justify-center border border-dashed border-black/20">
                      <IconPlus className="size-5 text-muted-foreground/20" />
                    </div>
                    <p className="text-[13px] font-bold text-foreground">No items yet</p>
                    <p className="text-[12px] text-muted-foreground/60 text-center max-w-56">Add tobacco items to build the purchase invoice.</p>
                    {!isReadOnly && (
                      <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                        className="mt-1 h-8 px-5 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5">
                        <IconPlus className="mr-1.5 size-3.5" /> Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-0">
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
                {details.length > 0 && (
                  <div className="bg-green-600 ml-auto rounded-b-sm py-3 px-5 flex flex-row justify-between items-center w-full md:w-[46%]">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-left">Total</span>
                      <span className="text-base font-semibold text-white text-left">{details.length} Item</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase">Total Weight</span>
                      <span className="text-base font-semibold text-white text-right">{totalNetWeight.toFixed(2)} Kg</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[11px] font-medium text-white uppercase">Grand Total</span>
                      <span className="text-base font-semibold text-white text-right">{Math.round(grandTotal).toLocaleString()} ៛</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                TABLET ITEMS — (768px – 1023px / md → lg)
                2-column card grid
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="hidden md:block lg:hidden border border-black/20 rounded-sm">
              <div className="flex py-1 px-1 items-center justify-between rounded-t-sm bg-green-600">
                <h3 className="flex items-center gap-2 py-2 px-4 text-white">Tobacco Purchase</h3>
                <TobaccoQuotaDisplay displayRemainingQuota={displayRemainingQuota} />
              </div>
              {details.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 rounded-sm border border-dashed border-black/20 bg-slate-50/50">
                  <div className="size-12 rounded-full bg-white flex items-center justify-center border border-dashed border-black/20">
                    <IconPlus className="size-5 text-muted-foreground/20" />
                  </div>
                  <p className="text-[13px] font-bold text-foreground">No items yet</p>
                  <p className="text-[12px] text-muted-foreground/60 text-center max-w-56">Add tobacco items to build the purchase invoice.</p>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                      className="mt-1 h-8 px-5 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5">
                      <IconPlus className="mr-1.5 size-3.5" /> Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2">
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
              {details.length > 0 && (
                <div className="bg-green-600 rounded-b-sm flex flex-row justify-between items-center px-5 py-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white uppercase text-left">Total</span>
                    <span className="text-base font-semibold text-white text-left">{details.length} Item</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white uppercase text-center">Total Weight</span>
                    <span className="text-base font-semibold text-white text-center">{totalNetWeight.toFixed(2)} Kg</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-medium text-white uppercase text-right">Grand Total</span>
                    <span className="text-base font-semibold text-white text-right">{Math.round(grandTotal).toLocaleString()} ៛</span>
                  </div>
                </div>
              )}
            </div>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                DESKTOP ITEMS — (≥ 1024px / lg and above)
                Full 9-column table, horizontally scrollable
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div className="hidden lg:block">
              {details.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 rounded-sm border border-dashed border-black/20 bg-slate-50/50 mt-4">
                  <div className="size-16 rounded-full bg-white flex items-center justify-center border border-dashed border-black/20">
                    <IconPlus className="size-6 text-muted-foreground/20" />
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-[14px] font-bold text-foreground">No tobacco items recorded yet</p>
                    <p className="text-[12px] text-muted-foreground/60 max-w-64">Start building your purchase invoice by adding tobacco items.</p>
                  </div>
                  {!isReadOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddDetail}
                      className="mt-2 h-8 px-6 text-[12px] font-bold rounded-full border-primary/20 text-primary hover:bg-primary/5 transition-all">
                      <IconPlus className="mr-2 size-3.5" /> Add First Item
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-black/20 mb-2">
                  <div className="flex py-1 px-1 items-center justify-between rounded-t-sm bg-green-600">
                    <div className="flex items-center gap-2 py-2 px-4">
                      <h3 className="text-base font-medium text-white">Tobacco Purchase</h3>
                    </div>
                    <TobaccoQuotaDisplay displayRemainingQuota={displayRemainingQuota} />
                  </div>
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
                  <div className="bg-green-600 rounded-b-sm flex flex-row justify-between items-center px-5 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-left">Total</span>
                      <span className="text-base font-semibold text-white">{details.length} Item</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-center">Total Weight</span>
                      <span className="text-base font-semibold text-white text-center">{totalNetWeight.toFixed(2)} Kg</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-right">Grand Total</span>
                      <span className="text-base font-semibold text-white text-right">{Math.round(grandTotal).toLocaleString()} ៛</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {returns.length > 0 && (       
              //  pt-2 px-4 md:pt-4 md:px-6 lg:pt-5 lg:px-6
              <div className="mt-3 mb-2 rounded-md border border-black/20">
                <div className="flex py-1 px-1 items-center justify-between rounded-t-sm bg-green-700">
                  <div className="flex items-center gap-2 py-2 px-4">
                    <h3 className="text-base font-medium text-white">Tobacco Repay</h3>
                  </div>
                </div>

                {/* Mobile & Tablet View */}
                <div className="lg:hidden space-y-0">
                  {returns.map((item, idx) => (
                    <ReturnDetailCard
                      key={item.tempId}
                      item={item}
                      index={idx}
                      isReadOnly={isReadOnly}
                      tobaccoTypes={tobaccoTypes}
                      vendorContracts={vendorContracts}
                      onRemove={handleRemoveReturn}
                      onChange={handleReturnChange}
                    />
                  ))}
                </div>

                {/* Mobile & Tablet Summary Bar */}
                <div className="flex lg:hidden bg-green-700 rounded-b-sm py-3 px-5 flex-row justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white uppercase text-left">Total</span>
                    <span className="text-base font-semibold text-white text-left">{returns.length} Item</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-medium text-white uppercase">Total Weight</span>
                    <span className="text-base font-semibold text-white text-right">{totalRepayWeight.toFixed(2)} Kg</span>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block space-y-3">
                  {returns.map((item, idx) => (
                    <ReturnDetailDesktopCard
                      key={item.tempId}
                      item={item}
                      index={idx}
                      isReadOnly={isReadOnly}
                      tobaccoTypes={tobaccoTypes}
                      vendorContracts={vendorContracts}
                      onRemove={handleRemoveReturn}
                      onChange={handleReturnChange}
                    />
                  ))}

                  {/* Desktop Summary Bar */}
                  <div className="bg-green-700 rounded-b-sm flex flex-row justify-between items-center px-5 py-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-left">Total</span>
                      <span className="text-base font-semibold text-white text-left">{returns.length} Item</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white uppercase text-right">Total Weight</span>
                      <span className="text-base font-semibold text-white text-right">{totalRepayWeight.toFixed(2)} Kg</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

            <DialogFooter className="mt-0 shrink-0 flex flex-row justify-between items-center gap-2 px-0 py-4 bg-background sm:space-x-0">
              {/* Left: Add Row + Return */}
              <div className="flex gap-2">
                {!isReadOnly && (
                  <>
                    <Button type="button" onClick={handleAddDetail}
                      className="h-8.5 px-2 md:px-3 justify-center bg-white border border-black/20 text-foreground hover:bg-slate-50 rounded-sm text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-1.5">
                      <IconSquareRoundedPlus className="size-3.5 hidden md:block" /> Purchase
                    </Button>
                    <Button type="button" onClick={handleAddReturn}
                      className="h-8.5 px-2 md:px-3 justify-center bg-white border border-black/20 text-foreground hover:bg-slate-50 rounded-sm text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-1.5">
                      <IconSquareRoundedPlus className="size-3.5 hidden md:block" /> Repay
                    </Button>
                  </>
                )}
              </div>
              {/* Right: Cancel + Save & Print + Save Purchase */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}
                  className="h-8.5 px-2 md:px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200">
                  {isReadOnly ? "Close" : "Cancel"}
                </Button>
                {!isReadOnly && (
                  <>
                    {!initialData && (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={(e) => {
                          setPrintAfterSave(true)
                          handleSubmit(e, true)
                        }}
                        className="h-8.5 px-2 md:px-4 bg-white border border-black/20 text-foreground rounded-sm text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-2"
                      >
                        {isSubmitting && printAfterSave ? (
                          <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <IconPrinter className="h-3.5 w-3.5 hidden md:block" />
                        )}
                        Save &amp; Print
                      </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}
                      className="h-8.5 px-2 md:px-5 bg-[#009640] hover:bg-[#008a3b] text-white rounded-sm text-[13px] font-medium transition-all duration-200 active:scale-95 flex items-center gap-2">
                      {isSubmitting && !printAfterSave ? (
                        <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <IconCheck className="h-3.5 w-3.5 hidden md:block" />
                      )}
                      <span className="md:hidden">{initialData ? "Update" : "Save"}</span>
                      <span className="hidden md:inline">{initialData ? "Update Purchase" : "Save Purchase"}</span>
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-0 bg-transparent border-none flex items-center justify-center z-120 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 [&>button]:hidden">
            <DialogTitle className="sr-only">Tobacco Purchase Detail Image Preview</DialogTitle>
            <DialogDescription className="sr-only">Preview of the uploaded image for the tobacco purchase detail.</DialogDescription>
            <div className="relative max-h-[85vh] max-w-full overflow-hidden rounded-sm bg-black/90 p-1.5 flex items-center justify-center group/preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Tobacco Purchase Detail"
                className="max-h-[80vh] max-w-full object-contain rounded-sm select-none"
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

// ━━━ PurchaseDetailCard — mobile & tablet card layout ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
    <div className="border border-black/20 bg-white overflow-hidden">

      {/* Tobacco Type — full width, X button on label row */}
      <div className="px-4 pt-3 md:px-6 md:pt-4">
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm">Tobacco Type</Label>
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
        <Popover open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) {
            const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
            setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
          }
        }}>
          <PopoverAnchor asChild>
            <div className="relative group">
              <IconLeaf className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
              <Input
                placeholder="Search item..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
                onFocus={() => { setSearch(""); setOpen(true) }}
                onClick={() => { setSearch(""); setOpen(true) }}
                disabled={isReadOnly}
                className="pl-8 h-8 text-[13px] rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-10"
              />
              <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0 border-black/20 z-100"
            align="start"
            sideOffset={4}
            onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('.group')) e.preventDefault()
            }}
          >
            <div className="max-h-62.5 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
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
                      <span className="text-sm font-normal">{t.t_name}</span>
                      <span className="text-sm font-normal text-gray-700">{t.t_name_kh || "-"}</span>
                    </div>
                  </button>
                ))
              }
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Middle: 2-col grid — all 5 cells are direct children so auto-placement is correct
            Col 1          | Col 2
            Image (r-span-3)| Gross Weight   ← row 1
                           | Remork          ← row 2
            Price/Kg       | Sack            ← row 3 (aligned)
      */}
      <div className="grid grid-cols-2 border-b border-black/20 px-1 py-1 md:px-3 md:py-2">

        {/* Col 1 rows 1-2: Image */}
        <div className="row-span-2 px-3 py-2 flex flex-col">
          <span className="text-sm font-semibold text-foreground mb-1">Item {index + 1}</span>
          <div>
          <Popover>
            <PopoverTrigger asChild>
              {detail.picture ? (
                <button
                  type="button"
                  className="w-full h-20 bg-white rounded-sm border border-black/20 overflow-hidden group/img relative flex items-center justify-center p-0 outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPictureUrl(detail.picture)}
                    alt="Tobacco item detail"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-all duration-200"
                  />
                  {!isReadOnly && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <IconPlus className="size-6 text-white" />
                    </div>
                  )}
                </button>
              ) : (
                <button type="button" disabled={isReadOnly} className="w-full h-28 bg-slate-50/50 rounded-sm border border-dashed border-black/20 flex flex-col items-center justify-center hover:border-primary/40 transition-all group/img overflow-hidden relative cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed">
                  <IconPlus className="size-8 text-muted-foreground/20 group-hover/img:text-primary/40" />
                </button>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-52 p-1 border-black/20 z-100" align="center" sideOffset={8}>
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
                      <input type="file" accept="image/*" capture="environment" className="hidden rounded-sm"
                        onChange={async (e) => { const file = e.target.files?.[0]; if (file) onChange(index, "picture", await processImageFile(file)) }}
                      />
                    </label>
                    <label className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-slate-100 rounded cursor-pointer font-medium outline-none focus-within:ring-1 focus-within:ring-primary">
                      <IconPhoto className="size-4 text-emerald-600" /> Upload Existing
                      <input type="file" accept="image/*" className="hidden rounded-sm"
                        onChange={async (e) => { const file = e.target.files?.[0]; if (file) onChange(index, "picture", await processImageFile(file)) }}
                      />
                    </label>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          </div>
        </div>

        {/* Col 2 row 1: Gross Weight */}
        <div className="px-3 pt-2 space-y-1">
          <Label className="text-sm">Gross Weight</Label>
          <div className="relative">
            <IconWeight className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
            <Input type="number" step="1"
              className="pl-8 h-8 text-[13px] rounded-sm font-medium bg-transparent border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
              value={detail.gross_weight ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "gross_weight", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
          </div>
        </div>

        {/* Col 2 row 2: Remork */}
        <div className=" px-3 pt-2 space-y-1">
          <Label className="text-sm">Remork</Label>
          <div className="relative">
            <IconTruck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
            <Input type="number" step="1"
              className="pl-8 h-8 text-[13px] rounded-sm bg-transparent border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
              value={detail.remork_in_kg ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
          </div>
        </div>

        {/* Col 1 row 3: Price/Kg */}
        <div className="px-3 pt-2 pb-2 space-y-1">
          <Label className="text-sm">Price/Kg</Label>
          <div className="relative">
            <IconCurrencyDollar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
            <Input type="number"
              className="pl-8 h-8 text-[13px] rounded-sm font-bold bg-transparent border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-5"
              value={detail.price ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold opacity-25">៛</span>
          </div>
        </div>

        {/* Col 2 row 3: Sack */}
        <div className="px-3 pt-2 pb-2 space-y-1">
          <Label className="text-sm">Sack</Label>
          <div className="relative">
            <IconPackage className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
            <Input type="number" step="0.01"
              className="pl-8 h-8 text-[13px] rounded-sm bg-transparent border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
              value={detail.sack_in_kg ?? ""} disabled={isReadOnly}
              onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
          </div>
        </div>

      </div>

      {/* Footer: Net Weight | Total */}
      <div className="grid grid-cols-2">
        <div className="px-6 py-3 space-y-0.5 bg-input/50">
          <Label className="text-sm text-left">Net Weight</Label>
          <p className="text-sm font-bold tabular-nums text-left">{netWeight.toFixed(2)}</p>
        </div>
        <div className="px-6 py-3 space-y-0.5 bg-input/50">
          <Label className="block text-sm text-right">Total</Label>
          <p className="text-sm font-bold tabular-nums text-right">
            ៛{total.toLocaleString()}
          </p>
        </div>
      </div>

    </div>
  )
})

PurchaseDetailCard.displayName = "PurchaseDetailCard"

// ━━━ PurchaseDetailDesktopCard — desktop spacious horizontal card layout ━━━

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
      "relative pl-4 pr-4 pt-3 pb-2 border-b border-black/20",
      index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
    )}>

      {/* Delete button — top-right of the card */}
      {!isReadOnly && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute top-0 right-0 p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
        >
          <IconX className="size-3.5" />
        </button>
      )}

      {/* Body: Image (left) + Fields (right, 2 rows) */}
      <div className="flex gap-5 items-stretch mb-2">

        {/* Image column — "Item N" label sits above image like other field labels */}
        <div className="shrink-0 w-24 flex flex-col">
          <div className="mb-1">
            <Label className="text-sm font-medium tracking-wider">Item {index + 1}</Label>
          </div>
          {detail.picture ? (
            <div className="w-full flex-1 min-h-20 bg-white rounded-sm border border-black/20 overflow-hidden group/img relative">
              <button
                type="button"
                onClick={() => onPreviewImage(getPictureUrl(detail.picture))}
                className="w-full flex-1 p-0 border-none outline-none bg-transparent cursor-zoom-in focus-visible:ring-1 focus-visible:ring-primary"
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
                  <IconPlus className="size-7 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) onChange(index, "picture", await processImageFile(file))
                    }}
                  />
                </label>
              )}
            </div>
          ) : (
            <label className={cn(
              "w-full flex-1 min-h-20 bg-slate-50/50 rounded-sm border border-dashed border-black/20 flex flex-col items-center justify-center transition-all group/img",
              isReadOnly ? "cursor-default" : "cursor-pointer hover:border-primary/40"
            )}>
              <IconSeedling className="size-8 text-muted-foreground/20 group-hover/img:text-primary/40" />
              {!isReadOnly && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) onChange(index, "picture", await processImageFile(file))
                  }}
                />
              )}
            </label>
          )}
        </div>

        {/* Fields — 2 rows */}
        <div className="flex-1 flex flex-col gap-2.5">

          {/* Row 1: Tobacco Type 50% | Gross Weight 25% | Price/Kg 25% */}
          <div className="flex">
            <div className="w-[50%] pr-4 space-y-1">
              <Label className="text-sm">Tobacco Type</Label>
              <Popover open={open} onOpenChange={(isOpen) => {
                setOpen(isOpen)
                if (!isOpen) {
                  const t = tobaccoTypes.find(item => item.t_id === detail.tobacco_name)
                  setSearch(t ? `${t.t_name} | ${t.t_name_kh || ""}` : "")
                }
              }}>
                <PopoverAnchor asChild>
                  <div className="relative group">
                    <IconLeaf className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                    <Input
                      placeholder="Search and select tobacco type..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true) }}
                      onFocus={() => { setSearch(""); setOpen(true) }}
                      onClick={() => { setSearch(""); setOpen(true) }}
                      disabled={isReadOnly}
                      className="pl-8 h-8 text-[13px] rounded-sm bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
                    />
                    <IconSearch className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30 pointer-events-none group-focus-within:opacity-60 transition-opacity" />
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-80 p-0 border-black/20 z-100"
                  align="start"
                  sideOffset={4}
                  onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) e.preventDefault() }}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('.group')) e.preventDefault()
                  }}
                >
                  <div className="max-h-62.5 overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
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
                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[12px] outline-hidden hover:bg-accent border-b border-border/70",
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
                            <span className="text-sm font-normal">{t.t_name}</span>
                            <span className="text-sm font-normal text-gray-700">{t.t_name_kh || "-"}</span>
                          </div>
                        </button>
                      ))
                    }
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-[25%] pr-4 space-y-1">
              <Label className="text-sm">Gross Weight</Label>
              <div className="relative">
                <IconWeight className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                <Input type="number" step="1"
                  className="pl-8 h-8 text-[13px] rounded-sm font-medium bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
                  value={detail.gross_weight ?? ""} disabled={isReadOnly}
                  onChange={(e) => onChange(index, "gross_weight", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
              </div>
            </div>

            <div className="w-[25%] space-y-1">
              <Label className="text-sm">Price/Kg</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] font-bold opacity-60 pointer-events-none">៛</span>
                <Input type="number"
                  className="pl-6 h-8 text-[13px] rounded-sm font-bold bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-2.5"
                  value={detail.price ?? ""} disabled={isReadOnly}
                  onChange={(e) => onChange(index, "price", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Remork 25% | Sack 25% | Net Weight 25% | Total Amount 25% */}
          <div className="flex">
            <div className="w-[25%] pr-4 space-y-1">
              <Label className="text-sm">Remork</Label>
              <div className="relative">
                <IconTruck className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                <Input type="number" step="1"
                  className="pl-8 h-8 text-[13px] rounded-sm font-medium bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
                  value={detail.remork_in_kg ?? ""} disabled={isReadOnly}
                  onChange={(e) => onChange(index, "remork_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
              </div>
            </div>

            <div className="w-[25%] pr-4 space-y-1">
              <Label className="text-sm">Sack</Label>
              <div className="relative">
                <IconPackage className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/80 pointer-events-none" />
                <Input type="number" step="0.01"
                  className="pl-8 h-8 text-[13px] rounded-sm font-medium bg-white border border-black/20 focus-visible:ring-1 focus-visible:ring-black/20 pr-8"
                  value={detail.sack_in_kg ?? ""} disabled={isReadOnly}
                  onChange={(e) => onChange(index, "sack_in_kg", e.target.value === "" ? 0 : Number.parseFloat(e.target.value))}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold opacity-40 pointer-events-none">Kg</span>
              </div>
            </div>

            <div className="w-[25%] pr-4 space-y-1">
              <Label className="text-sm">Net Weight</Label>
              <div className="h-8 border border-black/20 rounded-sm px-2.5 flex items-center justify-between bg-input/50">
                <div className="flex items-center gap-1.5">
                  <IconWeight className="h-3.5 w-3.5 text-foreground/80 shrink-0" />
                  <span className="text-sm font-bold tabular-nums">{netWeight.toFixed(2)}</span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">Kg</span>
              </div>
            </div>

            <div className="w-[25%] space-y-1">
              <Label className="text-sm">Total Amount</Label>
              <div className="h-8 border border-black/20 rounded-sm px-2.5 flex items-center justify-between bg-input/50">
                <span className="text-sm font-bold">៛</span>
                <span className="text-sm font-bold tabular-nums">{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
})

PurchaseDetailDesktopCard.displayName = "PurchaseDetailDesktopCard"
