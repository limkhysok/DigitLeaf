"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { IconLoader2, IconCash, IconChevronDown, IconCheck, IconEye } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@workspace/ui/lib/utils"
import { apiClient, MemberFarmerItem, OvenItem, RepayHistoryDetail, VendorContractItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"

export type RepayRecordDialogMode = "add" | "edit" | "view"

interface RepayRecordDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  mode: RepayRecordDialogMode
  repayId: number | null
  selectedYear: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

function titleForMode(mode: RepayRecordDialogMode, rd: any) {
  if (mode === "add") return rd.titleAdd
  if (mode === "view") return rd.titleView
  return rd.titleEdit
}

function FarmerCombobox({
  token,
  selectedFarmer,
  onSelectFarmer,
}: Readonly<{
  token: string
  selectedFarmer: MemberFarmerItem | null
  onSelectFarmer: (farmer: MemberFarmerItem | null) => void
}>) {
  const { t } = useLanguage()
  const rd = t.tobaccoRepay.repayRecordDialog
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [farmerQuery, setFarmerQuery] = React.useState(selectedFarmer?.name ?? "")
  const [debouncedFarmerQuery] = useDebounce(farmerQuery, 350)

  const { data: farmers = [], isFetching: isFetchingFarmers } = useQuery({
    queryKey: ["repay-record-farmer-search", debouncedFarmerQuery],
    queryFn: () => apiClient.queryMemberFarmers(token, debouncedFarmerQuery, undefined, 20),
    enabled: farmerOpen && !!token,
    staleTime: 30_000,
  })

  return (
    <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
      <Popover
        open={farmerOpen}
        onOpenChange={(o) => {
          setFarmerOpen(o)
          if (!o && selectedFarmer) setFarmerQuery(selectedFarmer.name)
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative">
            <CommandPrimitive.Input
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={farmerQuery}
              onValueChange={(val) => {
                setFarmerQuery(val)
                setFarmerOpen(true)
                if (selectedFarmer) onSelectFarmer(null)
              }}
              onFocus={() => setFarmerOpen(true)}
              onClick={(e) => {
                e.stopPropagation()
                setFarmerOpen(true)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder={rd.farmerSearchPlaceholder}
            />
            <IconChevronDown className="absolute right-3 top-2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList>
            {isFetchingFarmers ? (
              <div className="flex items-center justify-center py-3">
                <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CommandEmpty>{rd.noFarmerFound}</CommandEmpty>
            )}
            <CommandGroup>
              {farmers.map((f) => (
                <CommandItem
                  key={f.mf_id}
                  value={`${f.name} ${f.mf_code}`}
                  onSelect={() => {
                    onSelectFarmer(f)
                    setFarmerQuery(f.name)
                    setFarmerOpen(false)
                  }}
                >
                  <IconCheck
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedFarmer?.mf_id === f.mf_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>
                    {f.name} <span className="text-muted-foreground">({f.mf_code})</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  )
}

function ContractSelectField({
  token,
  selectedFarmer,
  selectedContract,
  onSelectContract,
}: Readonly<{
  token: string
  selectedFarmer: MemberFarmerItem
  selectedContract: VendorContractItem | null
  onSelectContract: (contract: VendorContractItem | null) => void
}>) {
  const { t } = useLanguage()
  const rd = t.tobaccoRepay.repayRecordDialog
  const { data: vendorContracts = [], isFetching: isFetchingContracts } = useQuery({
    queryKey: ["repay-record-vendor-contracts", selectedFarmer.mf_id],
    queryFn: () => apiClient.getVendorContracts(token, selectedFarmer.mf_id),
  })

  const remaining =
    selectedContract?.qty == null
      ? null
      : selectedContract.qty - (selectedContract.total_returned ?? 0)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="contract_select">{rd.contract}</Label>
      <Select
        value={selectedContract ? String(selectedContract.con_id) : ""}
        onValueChange={(v) => {
          const c = vendorContracts.find((c) => String(c.con_id) === v)
          onSelectContract(c ?? null)
        }}
        disabled={isFetchingContracts}
      >
        <SelectTrigger id="contract_select" className="w-full">
          <SelectValue placeholder={isFetchingContracts ? rd.loadingContracts : rd.selectContractPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {vendorContracts.map((c) => (
            <SelectItem key={c.con_id} value={String(c.con_id)}>
              {c.con_num} {c.tobacco ? `— ${c.group_name ?? "-"} | ${c.tobacco}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedContract && (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex justify-between">
          <span>{rd.remaining}</span>
          <span className="font-medium text-foreground">
            {remaining == null ? "—" : `${remaining.toLocaleString()} kg`}
          </span>
        </div>
      )}
    </div>
  )
}

function formatOvenLabel(oven: OvenItem): string {
  if (!oven.name_kh) return oven.name_en
  return `${oven.name_en} | ${oven.name_kh}`
}

function OvenSelect({
  ovens,
  value,
  onChange,
  disabled,
}: Readonly<{
  ovens: OvenItem[]
  value: string
  onChange: (v: string) => void
  disabled: boolean
}>) {
  const { t } = useLanguage()
  const rd = t.tobaccoRepay.repayRecordDialog
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id="oven" className="w-full">
        <SelectValue placeholder={rd.selectOvenPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {ovens.map((ov) => (
          <SelectItem key={ov.id} value={String(ov.id)}>
            {formatOvenLabel(ov)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function useAutoRepayNumber(open: boolean, isAddMode: boolean, token: string, setRepayNum: (v: string) => void) {
  const { data: nextRepayNum } = useQuery({
    queryKey: ["next-repay-num"],
    queryFn: () => apiClient.getNextRepayNum(token),
    enabled: open && isAddMode,
    staleTime: 0,
  })

  React.useEffect(() => {
    if (open && isAddMode && nextRepayNum) {
      const t = setTimeout(() => setRepayNum(nextRepayNum), 0)
      return () => clearTimeout(t)
    }
  }, [open, isAddMode, nextRepayNum, setRepayNum])
}

interface RepayDetailSetters {
  setRepayNum: (v: string) => void
  setRepayDate: (v: string) => void
  setQuantity: (v: string) => void
  setOvenId: (v: string) => void
  setNote: (v: string) => void
  setConNumDisplay: (v: string) => void
  setFarmerNameDisplay: (v: string) => void
  setTobaccoTypeDisplay: (v: string) => void
}

function useRepayDetailSync(open: boolean, detail: RepayHistoryDetail | undefined, setters: RepayDetailSetters) {
  const {
    setRepayNum,
    setRepayDate,
    setQuantity,
    setOvenId,
    setNote,
    setConNumDisplay,
    setFarmerNameDisplay,
    setTobaccoTypeDisplay,
  } = setters

  React.useEffect(() => {
    if (open && detail) {
      const t = setTimeout(() => {
        setRepayNum(detail.repay_num ?? "")
        setRepayDate(detail.repay_date ?? todayIso())
        setQuantity(detail.qty_repay == null ? "" : String(detail.qty_repay))
        setOvenId(detail.oven == null ? "" : String(detail.oven))
        setNote(detail.note ?? "")
        setConNumDisplay(detail.con_num ?? "")
        setFarmerNameDisplay(detail.farmer_name ?? "")
        setTobaccoTypeDisplay(detail.tobacco_type ?? "")
      }, 0)
      return () => clearTimeout(t)
    }
  }, [
    open,
    detail,
    setRepayNum,
    setRepayDate,
    setQuantity,
    setOvenId,
    setNote,
    setConNumDisplay,
    setFarmerNameDisplay,
    setTobaccoTypeDisplay,
  ])
}

export function RepayRecordDialog({
  open,
  onOpenChange,
  token,
  mode,
  repayId,
  selectedYear,
}: Readonly<RepayRecordDialogProps>) {
  const { t } = useLanguage()
  const rd = t.tobaccoRepay.repayRecordDialog
  const queryClient = useQueryClient()
  const isAddMode = mode === "add"
  const isViewMode = mode === "view"

  const [repayNum, setRepayNum] = React.useState<string>("")
  const [repayDate, setRepayDate] = React.useState(todayIso)
  const [quantity, setQuantity] = React.useState<string>("")
  const [ovenId, setOvenId] = React.useState<string>("")
  const [note, setNote] = React.useState<string>("")

  // ── Readonly display fields (populated from detail or selected contract) ──
  const [conNumDisplay, setConNumDisplay] = React.useState<string>("")
  const [farmerNameDisplay, setFarmerNameDisplay] = React.useState<string>("")
  const [tobaccoTypeDisplay, setTobaccoTypeDisplay] = React.useState<string>("")

  // ── Add mode: farmer + contract selection ──
  const [selectedFarmer, setSelectedFarmer] = React.useState<MemberFarmerItem | null>(null)
  const [selectedContract, setSelectedContract] = React.useState<VendorContractItem | null>(null)

  // ── Auto-generate repay number when the Add dialog opens ──
  useAutoRepayNumber(open, isAddMode, token, setRepayNum)

  // ── Fetch detail for edit/view ──
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["repay-detail", repayId],
    queryFn: () => apiClient.getRepayDetail(token, repayId!),
    enabled: open && !isAddMode && !!repayId && !!token,
  })

  useRepayDetailSync(open, detail, {
    setRepayNum,
    setRepayDate,
    setQuantity,
    setOvenId,
    setNote,
    setConNumDisplay,
    setFarmerNameDisplay,
    setTobaccoTypeDisplay,
  })

  // ── Ovens ──
  const { data: ovens = [] } = useQuery({
    queryKey: ["ovens"],
    queryFn: () => apiClient.getOvens(token),
    enabled: open,
  })

  const parsedQty = Number.parseFloat(quantity)

  const remaining =
    isAddMode && selectedContract?.qty != null
      ? selectedContract.qty - (selectedContract.total_returned ?? 0)
      : null

  function resetForm() {
    setRepayNum("")
    setRepayDate(todayIso())
    setQuantity("")
    setOvenId("")
    setNote("")
    setConNumDisplay("")
    setFarmerNameDisplay("")
    setTobaccoTypeDisplay("")
    setSelectedFarmer(null)
    setSelectedContract(null)
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  const { mutate: createRepay, isPending: isCreating } = useMutation({
    mutationFn: () =>
      apiClient.createTobaccoRepay(token, {
        con_id: selectedContract!.con_id,
        con_num: selectedContract!.con_num,
        f_id: selectedFarmer!.mf_id,
        repay_num: repayNum.trim() || undefined,
        repay_date: repayDate,
        qty_repay: parsedQty,
        oven: ovenId ? Number(ovenId) : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(rd.toastCreateSuccess)
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["repay-record-vendor-contracts"] })
      queryClient.invalidateQueries({ queryKey: ["vendorContracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || rd.toastCreateError)
    },
  })

  const { mutate: updateRepay, isPending: isUpdating } = useMutation({
    mutationFn: () =>
      apiClient.updateTobaccoRepay(token, repayId!, {
        repay_date: repayDate,
        qty_repay: parsedQty,
        oven: ovenId ? Number(ovenId) : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(rd.toastUpdateSuccess)
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["repay-detail", repayId] })
      queryClient.invalidateQueries({ queryKey: ["repay-record-vendor-contracts"] })
      queryClient.invalidateQueries({ queryKey: ["vendorContracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || rd.toastUpdateError)
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      toast.error(rd.errInvalidQty)
      return
    }
    if (isAddMode) {
      if (!selectedFarmer) {
        toast.error(rd.errSelectFarmer)
        return
      }
      if (!selectedContract) {
        toast.error(rd.errSelectContract)
        return
      }
      if (remaining != null && parsedQty > remaining) {
        toast.error(rd.errExceedsRemaining.replace("{remaining}", remaining.toLocaleString()))
        return
      }
      createRepay()
    } else {
      updateRepay()
    }
  }

  const isPending = isCreating || isUpdating
  const isLoading = !isAddMode && isLoadingDetail

  const titleText = titleForMode(mode, rd)

  const ovenDisplay = ovens.find((o) => String(o.id) === ovenId)
  const ovenName = ovenDisplay ? formatOvenLabel(ovenDisplay) : null
  const parsedViewQty = Number.parseFloat(quantity)

  let dialogBody: React.ReactNode
  if (isLoading) {
    dialogBody = (
      <div className="flex items-center justify-center h-40">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  } else if (isViewMode) {
    dialogBody = (
      <div className="flex flex-col gap-4">
        <div className="rounded-md border divide-y text-sm">
          <div className="grid grid-cols-2 gap-2 p-3 divide-x">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{rd.viewInvoice}</span>
              <span className="font-medium">{repayNum || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-muted-foreground">{rd.viewContractNo}</span>
              <span className="font-medium">{conNumDisplay || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 divide-x">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{rd.viewFarmer}</span>
              <span className="font-medium">{farmerNameDisplay || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-muted-foreground">{rd.viewTobaccoType}</span>
              <span className="font-medium">{tobaccoTypeDisplay || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 divide-x">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{rd.viewDeliveryKg}</span>
              <span className="font-medium text-[#009640]">
                {Number.isNaN(parsedViewQty) ? "—" : `${parsedViewQty.toLocaleString()} kg`}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-muted-foreground">{rd.viewOven}</span>
              <span className="font-medium">{ovenName || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3 divide-x">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{rd.viewDate}</span>
              <span className="font-medium">{repayDate || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-muted-foreground">{rd.viewNote}</span>
              <span className="font-medium">{note || "—"}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            {rd.close}
          </Button>
        </DialogFooter>
      </div>
    )
  } else {
    dialogBody = (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {/* Repay Number */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="repay_num">{rd.repayNumber}</Label>
          <Input
            id="repay_num"
            value={repayNum}
            readOnly
            placeholder={rd.generating}
            className="bg-muted/40 cursor-default font-mono"
          />
        </div>

        {/* Add mode: Farmer search */}
        {isAddMode && (
          <div className="space-y-1 flex flex-col">
            <Label className="text-sm font-medium">{rd.farmer}</Label>
            <FarmerCombobox
              token={token}
              selectedFarmer={selectedFarmer}
              onSelectFarmer={(f) => {
                setSelectedFarmer(f)
                setSelectedContract(null)
              }}
            />
          </div>
        )}

        {/* Add mode: Contract selection */}
        {isAddMode && selectedFarmer && (
          <ContractSelectField
            token={token}
            selectedFarmer={selectedFarmer}
            selectedContract={selectedContract}
            onSelectContract={setSelectedContract}
          />
        )}

        {/* Edit mode: readonly contract context */}
        {!isAddMode && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_num">{rd.contract}</Label>
              <Input id="con_num" value={conNumDisplay} readOnly className="bg-muted/40 cursor-default" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="farmer">{rd.farmer}</Label>
              <Input id="farmer" value={farmerNameDisplay} readOnly className="bg-muted/40 cursor-default" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tobacco_type">{rd.tobaccoType}</Label>
              <Input id="tobacco_type" value={tobaccoTypeDisplay} readOnly className="bg-muted/40 cursor-default" />
            </div>
          </>
        )}

        {/* Quantity */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">{rd.quantityKg}</Label>
          <Input
            id="quantity"
            type="number"
            min={0.01}
            max={remaining ?? undefined}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={rd.quantityPlaceholder}
            required
          />
        </div>

        {/* Oven */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oven">
            {rd.oven} <span className="text-muted-foreground">{rd.optional}</span>
          </Label>
          <OvenSelect ovens={ovens} value={ovenId} onChange={setOvenId} disabled={false} />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="repay_date">{rd.date}</Label>
          <Input
            id="repay_date"
            type="date"
            value={repayDate}
            onChange={(e) => setRepayDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">
            {rd.note} <span className="text-muted-foreground">{rd.optional}</span>
          </Label>
          <Input
            id="note"
            placeholder={rd.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
            {rd.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#009640] hover:bg-[#007a33] text-white"
          >
            {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rd.save}
          </Button>
        </DialogFooter>
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isViewMode ? (
              <IconEye className="h-5 w-5 text-[#009640]" />
            ) : (
              <IconCash className="h-5 w-5 text-[#009640]" />
            )}
            {titleText}
          </DialogTitle>
        </DialogHeader>

        {dialogBody}
      </DialogContent>
    </Dialog>
  )
}
