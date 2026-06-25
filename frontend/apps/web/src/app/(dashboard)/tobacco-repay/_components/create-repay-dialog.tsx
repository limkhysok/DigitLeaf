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
      <Label className="text-sm font-medium">Farmer</Label>
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
                placeholder="Search farmer..."
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
                <CommandEmpty>No farmer found.</CommandEmpty>
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

      {selectedFarmer && !farmerOpen && (
        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between mt-1">
          <div className="flex flex-col">
            <span className="font-medium text-green-700 dark:text-green-400">{selectedFarmer.name}</span>
            <span className="text-muted-foreground text-xs">ID: {selectedFarmer.mf_code}</span>
          </div>
          <IconCheck className="h-4 w-4 text-green-500" />
        </div>
      )}
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
  const [tobaccoOpen, setTobaccoOpen] = React.useState(false)
  const [tobaccoSearch, setTobaccoSearch] = React.useState("")

  const filteredTobacco = React.useMemo(() => {
    if (!tobaccoSearch.trim()) return tobaccoTypes
    const q = tobaccoSearch.toLowerCase()
    return tobaccoTypes.filter((t) =>
      t.tobacco?.toLowerCase().includes(q) || t.group_name?.toLowerCase().includes(q)
    )
  }, [tobaccoTypes, tobaccoSearch])

  return (
    <div className="space-y-1 flex flex-col">
      <Label className="text-sm font-medium">Tobacco Type</Label>
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
                placeholder="Search tobacco type..."
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
                <CommandEmpty>No tobacco type found.</CommandEmpty>
              )}
              <CommandGroup>
                {filteredTobacco.map((t) => (
                  <CommandItem
                    key={t.t_id}
                    value={formatTobaccoLabel(t)}
                    onSelect={() => {
                      onSelectTobacco(t)
                      setTobaccoSearch(formatTobaccoLabel(t))
                      setTobaccoOpen(false)
                    }}
                  >
                    <IconCheck
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTobacco?.t_id === t.t_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{formatTobaccoLabel(t)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </PopoverContent>
        </Popover>
      </Command>

      {selectedTobacco && !tobaccoOpen && (
        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between mt-1">
          <span className="font-medium text-green-700 dark:text-green-400">{formatTobaccoLabel(selectedTobacco)}</span>
          <IconCheck className="h-4 w-4 text-green-500" />
        </div>
      )}
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
  const queryClient = useQueryClient()

  const [conNum, setConNum] = React.useState<string>("")
  const [conDate, setConDate] = React.useState(todayIso)
  const [conQty, setConQty] = React.useState<string>("")
  const [conPrice, setConPrice] = React.useState<string>("")
  const [conRate, setConRate] = React.useState<string>("")
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
      const t = setTimeout(() => setConNum(nextContractNum), 0)
      return () => clearTimeout(t)
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
    setConRate("")
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
      toast.success("Contract created successfully")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create contract")
    },
  })

  function validateCreateSubmit() {
    if (!selectedFarmer) return "Please select a farmer"
    if (!selectedTobacco) return "Please select a tobacco type"
    if (Number.isNaN(parsedConQty) || parsedConQty <= 0) return "Enter a valid quantity"
    if (Number.isNaN(parsedConPrice) || parsedConPrice <= 0) return "Enter a valid price"
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
            Create Contract
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 py-2">
          {/* Row: Farmer | Tobacco Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FarmerSearchField token={token} selectedFarmer={selectedFarmer} onSelectFarmer={setSelectedFarmer} />
            <TobaccoSearchField
              tobaccoTypes={tobaccoTypes}
              isFetchingTobacco={isFetchingTobacco}
              selectedTobacco={selectedTobacco}
              onSelectTobacco={setSelectedTobacco}
            />
          </div>

          {/* Row: Contract Number | Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_num">Contract Number</Label>
              <Input
                id="con_num"
                value={conNum}
                readOnly
                placeholder="Generating..."
                className="bg-muted/40 cursor-default font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="represent">
                Representative <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Select value={representId} onValueChange={setRepresentId}>
                <SelectTrigger id="represent" className="w-full">
                  <SelectValue placeholder="Select a representative..." />
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
          </div>

          {/* Row: Quantity | Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_qty">Quantity (kg)</Label>
              <Input
                id="con_qty"
                type="number"
                min={0.01}
                step="any"
                value={conQty}
                onChange={(e) => setConQty(e.target.value)}
                placeholder="Enter quantity..."
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_price">Price</Label>
              <Input
                id="con_price"
                type="number"
                min={0.01}
                step="any"
                value={conPrice}
                onChange={(e) => setConPrice(e.target.value)}
                placeholder="Enter price..."
                required
              />
            </div>
          </div>

          {/* Row: Rate | Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_rate">
                Rate <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="con_rate"
                type="number"
                min={0}
                step="any"
                value={conRate}
                onChange={(e) => setConRate(e.target.value)}
                placeholder="Enter rate..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="con_date">Date</Label>
              <Input
                id="con_date"
                type="date"
                value={conDate}
                onChange={(e) => setConDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="con_note">
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="con_note"
              placeholder="Add a note..."
              value={conNote}
              onChange={(e) => setConNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isCreatingContract}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreatingContract}
              className="bg-[#009640] hover:bg-[#007a33] text-white"
            >
              {isCreatingContract && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
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
      const t = setTimeout(() => setRepayNum(nextRepayNum), 0)
      return () => clearTimeout(t)
    }
  }, [open, nextRepayNum])

  React.useEffect(() => {
    if (open && remaining != null) {
      const t = setTimeout(() => setQuantity(String(remaining)), 0)
      return () => clearTimeout(t)
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
      toast.success("Repayment recorded successfully")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["vendorContracts"] })
      queryClient.invalidateQueries({ queryKey: ["repay-record-vendor-contracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record repayment")
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!record.id || !record.f_id || !record.contract_number) return
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Enter a valid quantity to repay")
      return
    }
    if (remaining != null && parsedQty > remaining) {
      toast.error(`Quantity exceeds remaining balance (${remaining.toLocaleString()} kg)`)
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
            Record Repayment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          {/* Quantity summary */}
          <div className="rounded-md border bg-muted/30 px-3 py-2.5 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Tobacco Type</span>
              <span className="font-medium text-foreground">{record.tobacco_type ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Quantity</span>
              <span className="font-medium text-foreground">
                {record.Quantity == null ? "—" : `${record.Quantity.toLocaleString()} kg`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Already Repaid</span>
              <span className="font-medium text-foreground">
                {record.total_repaid == null ? "—" : `${record.total_repaid.toLocaleString()} kg`}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-0.5">
              <span>Remaining</span>
              <span className={`font-semibold ${remaining == null || remaining > 0 ? "text-[#009640]" : "text-red-500"}`}>
                {remaining == null ? "—" : `${remaining.toLocaleString()} kg`}
              </span>
            </div>
          </div>

          {/* Repay Number — auto-generated, read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repay_num">Repay Number</Label>
            <Input
              id="repay_num"
              value={repayNum}
              readOnly
              placeholder="Generating..."
              className="bg-muted/40 cursor-default font-mono"
            />
          </div>

          {/* Contract — read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contract">Contract</Label>
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
            <Label htmlFor="quantity">Quantity (kg)</Label>
            <Input
              id="quantity"
              type="number"
              min={0.01}
              max={remaining ?? undefined}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity..."
              required
            />
          </div>

          {/* Farmer — read-only */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="farmer">Farmer</Label>
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
              Oven <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Select value={effectiveOvenId} onValueChange={setOvenId} disabled={ovens.length === 1}>
              <SelectTrigger id="oven" className="w-full">
                <SelectValue placeholder="Select an oven..." />
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
            <Label htmlFor="repay_date">Date</Label>
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
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="note"
              placeholder="Add a note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
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
              Save
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
