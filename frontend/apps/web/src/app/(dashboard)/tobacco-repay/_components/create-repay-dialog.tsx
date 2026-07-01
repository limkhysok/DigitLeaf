"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { toast } from "sonner"
import { IconLoader2, IconCash, IconFilePlus, IconChevronDown, IconCheck } from "@tabler/icons-react"
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
import { apiClient, TobaccoRepayItem, MemberFarmerItem, ConTobaccoItem } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"

interface CreateRepayDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  record: TobaccoRepayItem | null
  selectedYear: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

function FarmerSearchField({
  token,
  selectedFarmer,
  onSelectFarmer,
}: Readonly<{
  token: string
  selectedFarmer: MemberFarmerItem | null
  onSelectFarmer: (farmer: MemberFarmerItem | null) => void
}>) {
  const { t } = useLanguage()
  const cc = t.tobaccoRepay.createContract
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [debouncedFarmerQuery] = useDebounce(farmerQuery, 350)

  const { data: farmers = [], isFetching: isFetchingFarmers } = useQuery({
    queryKey: ["tobacco-repay-farmer-search", debouncedFarmerQuery],
    queryFn: () => apiClient.queryMemberFarmers(token, debouncedFarmerQuery, undefined, 20),
    enabled: farmerOpen && !!token,
    staleTime: 30_000,
  })

  return (
    <div className="space-y-1 flex flex-col">
      <Label className="text-md font-medium">{cc.farmer}</Label>
      <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
        <Popover
          open={farmerOpen}
          onOpenChange={(o) => {
            setFarmerOpen(o)
            if (!o && selectedFarmer) setFarmerQuery(`${selectedFarmer.name} | ${selectedFarmer.mf_code}`)
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
                placeholder={cc.farmerSearchPlaceholder}
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
                <CommandEmpty>{cc.noFarmerFound}</CommandEmpty>
              )}
              <CommandGroup>
                {farmers.map((f) => (
                  <CommandItem
                    key={f.mf_id}
                    value={`${f.name} ${f.mf_code}`}
                    onSelect={() => {
                      onSelectFarmer(f)
                      setFarmerQuery(`${f.name} | ${f.mf_code}`)
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
    </div>
  )
}

function formatTobaccoLabel(t: ConTobaccoItem): string {
  return `${t.group_name ?? "-"} | ${t.tobacco ?? ""}`
}

function TobaccoSearchField({
  tobaccoTypes,
  isFetchingTobacco,
  selectedTobacco,
  onSelectTobacco,
}: Readonly<{
  tobaccoTypes: ConTobaccoItem[]
  isFetchingTobacco: boolean
  selectedTobacco: ConTobaccoItem | null
  onSelectTobacco: (tobacco: ConTobaccoItem | null) => void
}>) {
  const { t } = useLanguage()
  const cc = t.tobaccoRepay.createContract
  const [tobaccoOpen, setTobaccoOpen] = React.useState(false)
  const [tobaccoSearch, setTobaccoSearch] = React.useState("")

  const filteredTobacco = React.useMemo(() => {
    if (!tobaccoSearch.trim()) return tobaccoTypes
    const q = tobaccoSearch.toLowerCase()
    return tobaccoTypes.filter((item) =>
      item.tobacco?.toLowerCase().includes(q) || item.group_name?.toLowerCase().includes(q)
    )
  }, [tobaccoTypes, tobaccoSearch])

  return (
    <div className="space-y-1 flex flex-col">
      <Label className="text-sm font-medium">{cc.tobaccoType}</Label>
      <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
        <Popover
          open={tobaccoOpen}
          onOpenChange={(o) => {
            setTobaccoOpen(o)
            if (!o && selectedTobacco) setTobaccoSearch(formatTobaccoLabel(selectedTobacco))
          }}
        >
          <PopoverTrigger asChild>
            <div className="relative">
              <CommandPrimitive.Input
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={tobaccoSearch}
                onValueChange={(val) => {
                  setTobaccoSearch(val)
                  setTobaccoOpen(true)
                  if (selectedTobacco) onSelectTobacco(null)
                }}
                onFocus={() => setTobaccoOpen(true)}
                onClick={(e) => {
                  e.stopPropagation()
                  setTobaccoOpen(true)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder={cc.tobaccoSearchPlaceholder}
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
              {isFetchingTobacco ? (
                <div className="flex items-center justify-center py-3">
                  <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CommandEmpty>{cc.noTobaccoFound}</CommandEmpty>
              )}
              <CommandGroup>
                {filteredTobacco.map((item) => (
                  <CommandItem
                    key={item.t_id}
                    value={formatTobaccoLabel(item)}
                    onSelect={() => {
                      onSelectTobacco(item)
                      setTobaccoSearch(formatTobaccoLabel(item))
                      setTobaccoOpen(false)
                    }}
                  >
                    <IconCheck
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTobacco?.t_id === item.t_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{formatTobaccoLabel(item)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>
    </div>
  )
}

function CreateContractDialog({
  open,
  onOpenChange,
  token,
  selectedYear,
}: Readonly<{
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  selectedYear: string
}>) {
  const { t } = useLanguage()
  const cc = t.tobaccoRepay.createContract
  const queryClient = useQueryClient()

  const [conNum, setConNum] = React.useState<string>("")
  const [conDate, setConDate] = React.useState(todayIso)
  const [conQty, setConQty] = React.useState<string>("")
  const [conPrice, setConPrice] = React.useState<string>("")
  const [conRate, setConRate] = React.useState<string>("4000")
  const [conNote, setConNote] = React.useState<string>("")
  const [representId, setRepresentId] = React.useState<string>("")
  const [selectedFarmer, setSelectedFarmer] = React.useState<MemberFarmerItem | null>(null)
  const [selectedTobacco, setSelectedTobacco] = React.useState<ConTobaccoItem | null>(null)

  const { data: nextContractNum } = useQuery({
    queryKey: ["next-contract-num"],
    queryFn: () => apiClient.getNextContractNum(token),
    enabled: open,
    staleTime: 0,
  })

  React.useEffect(() => {
    if (open && nextContractNum) {
      const timer = setTimeout(() => setConNum(nextContractNum), 0)
      return () => clearTimeout(timer)
    }
  }, [open, nextContractNum])

  const { data: tobaccoTypes = [], isFetching: isFetchingTobacco } = useQuery({
    queryKey: ["contract-tobacco-types"],
    queryFn: () => apiClient.getContractTobaccoTypes(token),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const { data: represents = [] } = useQuery({
    queryKey: ["represents"],
    queryFn: () => apiClient.getRepresents(token),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const parsedConQty = Number.parseFloat(conQty)
  const parsedConPrice = Number.parseFloat(conPrice)

  function resetForm() {
    setConNum("")
    setConDate(todayIso())
    setConQty("")
    setConPrice("")
    setConRate("4000")
    setConNote("")
    setRepresentId("")
    setSelectedFarmer(null)
    setSelectedTobacco(null)
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  const { mutate: createContract, isPending: isCreatingContract } = useMutation({
    mutationFn: () =>
      apiClient.createContract(token, {
        con_num: conNum.trim() || undefined,
        contractor: selectedFarmer!.name,
        f_id: selectedFarmer!.mf_id,
        tobac_type: selectedTobacco!.t_id,
        qty: parsedConQty,
        price: parsedConPrice,
        con_date: conDate,
        rate: conRate.trim() ? Number.parseFloat(conRate) : undefined,
        represent: representId || undefined,
        note: conNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(cc.toastSuccess)
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || cc.toastError)
    },
  })

  function validateCreateSubmit() {
    if (!selectedFarmer) return cc.errSelectFarmer
    if (!selectedTobacco) return cc.errSelectTobacco
    if (Number.isNaN(parsedConQty) || parsedConQty <= 0) return cc.errInvalidQty
    if (Number.isNaN(parsedConPrice) || parsedConPrice <= 0) return cc.errInvalidPrice
    return null
  }

  function handleCreateSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    const error = validateCreateSubmit()
    if (error) {
      toast.error(error)
      return
    }
    createContract()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFilePlus className="h-5 w-5 text-[#009640]" />
            {cc.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 py-2">
          {/* Row: Representative | Farmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="represent">{cc.representative}</Label>
              <Select value={representId} onValueChange={setRepresentId}>
                <SelectTrigger id="represent" className="w-full">
                  <SelectValue placeholder={cc.selectRepresentativePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {represents.map((r) => (
                    <SelectItem key={r.represent_id} value={String(r.represent_id)}>
                      {r.represent_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FarmerSearchField
              token={token}
              selectedFarmer={selectedFarmer}
              onSelectFarmer={(farmer) => {
                setSelectedFarmer(farmer)
                if (farmer?.represent_id != null) {
                  setRepresentId(String(farmer.represent_id))
                }
              }}
            />
          </div>

          {/* Row: Contract Number | Tobacco Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_num">{cc.contractNumber}</Label>
              <Input
                id="con_num"
                value={conNum}
                readOnly
                placeholder={cc.generating}
                className="bg-muted/40 cursor-default font-mono"
              />
            </div>

            <TobaccoSearchField
              tobaccoTypes={tobaccoTypes}
              isFetchingTobacco={isFetchingTobacco}
              selectedTobacco={selectedTobacco}
              onSelectTobacco={setSelectedTobacco}
            />
          </div>

          {/* Row: Date | Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_date">{cc.date}</Label>
              <Input
                id="con_date"
                type="date"
                value={conDate}
                onChange={(e) => setConDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_qty">{cc.quantityKg}</Label>
              <Input
                id="con_qty"
                type="number"
                min={0.01}
                step="any"
                value={conQty}
                onChange={(e) => setConQty(e.target.value)}
                placeholder={cc.quantityPlaceholder}
                required
              />
            </div>
          </div>

          {/* Row: Rate | Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_rate">{cc.rate}</Label>
              <Input
                id="con_rate"
                type="number"
                min={0}
                step="any"
                value={conRate}
                onChange={(e) => setConRate(e.target.value)}
                placeholder={cc.ratePlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_price">{cc.price}</Label>
              <Input
                id="con_price"
                type="number"
                min={0.01}
                step="any"
                value={conPrice}
                onChange={(e) => setConPrice(e.target.value)}
                placeholder={cc.pricePlaceholder}
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="con_note">
              {cc.note} <span className="text-muted-foreground">{cc.optional}</span>
            </Label>
            <Input
              id="con_note"
              placeholder={cc.notePlaceholder}
              value={conNote}
              onChange={(e) => setConNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreatingContract}>
              {cc.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isCreatingContract}
              className="bg-[#009640] hover:bg-[#007a33] text-white"
            >
              {isCreatingContract && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {cc.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RecordRepaymentDialog({
  open,
  onOpenChange,
  token,
  record,
  selectedYear,
}: Readonly<{
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  record: TobaccoRepayItem
  selectedYear: string
}>) {
  const { t } = useLanguage()
  const rr = t.tobaccoRepay.recordRepay
  const queryClient = useQueryClient()

  const [repayNum, setRepayNum] = React.useState<string>("")
  const [repayDate, setRepayDate] = React.useState(todayIso)
  const [quantity, setQuantity] = React.useState<string>("")
  const [ovenId, setOvenId] = React.useState<string>("")
  const [note, setNote] = React.useState<string>("")

  const remaining =
    record.Quantity == null || record.total_repaid == null
      ? null
      : record.Quantity - record.total_repaid

  const { data: nextRepayNum } = useQuery({
    queryKey: ["next-repay-num"],
    queryFn: () => apiClient.getNextRepayNum(token),
    enabled: open,
    staleTime: 0,
  })

  React.useEffect(() => {
    if (open && nextRepayNum) {
      const timer = setTimeout(() => setRepayNum(nextRepayNum), 0)
      return () => clearTimeout(timer)
    }
  }, [open, nextRepayNum])

  React.useEffect(() => {
    if (open && remaining != null) {
      const timer = setTimeout(() => setQuantity(String(remaining)), 0)
      return () => clearTimeout(timer)
    }
  }, [open, remaining])

  const { data: ovens = [] } = useQuery({
    queryKey: ["ovens"],
    queryFn: () => apiClient.getOvens(token),
    enabled: open,
  })

  const effectiveOvenId = ovens.length === 1 ? String(ovens[0]?.id) : ovenId
  const parsedQty = Number.parseFloat(quantity)

  function resetForm() {
    setRepayNum("")
    setRepayDate(todayIso())
    setQuantity("")
    setOvenId("")
    setNote("")
  }

  function handleClose() {
    resetForm()
    onOpenChange(false)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiClient.createTobaccoRepay(token, {
        con_id: record.id!,
        con_num: record.contract_number!,
        f_id: record.f_id!,
        repay_num: repayNum.trim() || undefined,
        repay_date: repayDate,
        qty_repay: parsedQty,
        oven: effectiveOvenId ? Number(effectiveOvenId) : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(rr.toastSuccess)
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["vendorContracts"] })
      queryClient.invalidateQueries({ queryKey: ["repay-record-vendor-contracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || rr.toastError)
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!record.id || !record.f_id || !record.contract_number) return
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      toast.error(rr.errInvalidQty)
      return
    }
    if (remaining != null && parsedQty > remaining) {
      toast.error(rr.errExceedsRemaining.replace("{remaining}", remaining.toLocaleString()))
      return
    }
    mutate()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconCash className="h-5 w-5 text-[#009640]" />
            {rr.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Quantity summary */}
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>{rr.tobaccoType}</span>
              <span className="font-medium text-foreground">{record.tobacco_type ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>{rr.totalQuantity}</span>
              <span className="font-medium text-foreground">
                {record.Quantity == null ? "—" : `${record.Quantity.toLocaleString()} kg`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{rr.alreadyRepaid}</span>
              <span className="font-medium text-foreground">
                {record.total_repaid == null ? "—" : `${record.total_repaid.toLocaleString()} kg`}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-0.5">
              <span>{rr.remaining}</span>
              <span className={`font-semibold ${remaining == null || remaining > 0 ? "text-[#009640]" : "text-red-500"}`}>
                {remaining == null ? "—" : `${remaining.toLocaleString()} kg`}
              </span>
            </div>
          </div>

          {/* Repay Number — auto-generated, read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repay_num">{rr.repayNumber}</Label>
            <Input
              id="repay_num"
              value={repayNum}
              readOnly
              placeholder={rr.generating}
              className="bg-muted/40 cursor-default font-mono"
            />
          </div>

          {/* Contract — read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract">{rr.contract}</Label>
            <Input
              id="contract"
              value={record.contract_number ?? ""}
              readOnly
              placeholder="—"
              className="bg-muted/40 cursor-default"
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">{rr.quantityKg}</Label>
            <Input
              id="quantity"
              type="number"
              min={0.01}
              max={remaining ?? undefined}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={rr.quantityPlaceholder}
              required
            />
          </div>

          {/* Farmer — read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="farmer">{rr.farmer}</Label>
            <Input
              id="farmer"
              value={record.farmer_name ?? ""}
              readOnly
              placeholder="—"
              className="bg-muted/40 cursor-default"
            />
          </div>

          {/* Oven */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="oven">
              {rr.oven} <span className="text-muted-foreground">{rr.optional}</span>
            </Label>
            <Select value={effectiveOvenId} onValueChange={setOvenId} disabled={ovens.length === 1}>
              <SelectTrigger id="oven" className="w-full">
                <SelectValue placeholder={rr.selectOvenPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {ovens.map((ov) => (
                  <SelectItem key={ov.id} value={String(ov.id)}>
                    {ov.name_en}{ov.name_kh ? ` | ${ov.name_kh}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repay_date">{rr.date}</Label>
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
              {rr.note} <span className="text-muted-foreground">{rr.optional}</span>
            </Label>
            <Input
              id="note"
              placeholder={rr.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              {rr.cancel}
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                !record.f_id ||
                Number.isNaN(parsedQty) ||
                parsedQty <= 0 ||
                (remaining != null && parsedQty > remaining)
              }
              className="bg-[#009640] hover:bg-[#007a33] text-white"
            >
              {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {rr.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateRepayDialog({
  open,
  onOpenChange,
  token,
  record,
  selectedYear,
}: Readonly<CreateRepayDialogProps>) {
  if (!record) {
    return (
      <CreateContractDialog open={open} onOpenChange={onOpenChange} token={token} selectedYear={selectedYear} />
    )
  }
  return (
    <RecordRepaymentDialog
      open={open}
      onOpenChange={onOpenChange}
      token={token}
      record={record}
      selectedYear={selectedYear}
    />
  )
}
