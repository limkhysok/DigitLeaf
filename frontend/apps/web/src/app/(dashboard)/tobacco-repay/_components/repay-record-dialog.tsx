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

function titleForMode(mode: RepayRecordDialogMode) {
  if (mode === "add") return "Add Repay Record"
  if (mode === "view") return "View Repay Record"
  return "Edit Repay Record"
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
      <Label htmlFor="contract_select">Contract</Label>
      <Select
        value={selectedContract ? String(selectedContract.con_id) : ""}
        onValueChange={(v) => {
          const c = vendorContracts.find((c) => String(c.con_id) === v)
          onSelectContract(c ?? null)
        }}
        disabled={isFetchingContracts}
      >
        <SelectTrigger id="contract_select" className="w-full">
          <SelectValue placeholder={isFetchingContracts ? "Loading contracts..." : "Select a contract..."} />
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
          <span>Remaining</span>
          <span className="font-medium text-foreground">
            {remaining == null ? "—" : `${remaining.toLocaleString()} kg`}
          </span>
        </div>
      )}
    </div>
  )
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
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
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
      toast.success("Repayment recorded successfully")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record repayment")
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
      toast.success("Repay record updated successfully")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["repay-detail", repayId] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update repay record")
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Enter a valid quantity")
      return
    }
    if (isAddMode) {
      if (!selectedFarmer) {
        toast.error("Please select a farmer")
        return
      }
      if (!selectedContract) {
        toast.error("Please select a contract")
        return
      }
      createRepay()
    } else {
      updateRepay()
    }
  }

  const isPending = isCreating || isUpdating
  const isLoading = !isAddMode && isLoadingDetail

  const titleText = titleForMode(mode)
  const readOnlyInputClass = isViewMode ? "bg-muted/40 cursor-default" : undefined

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

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
            {/* Repay Number */}
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

            {/* Add mode: Farmer search */}
            {isAddMode && (
              <div className="space-y-1 flex flex-col">
                <Label className="text-sm font-medium">Farmer</Label>
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

            {/* Edit/View mode: readonly contract context */}
            {!isAddMode && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="con_num">Contract</Label>
                  <Input id="con_num" value={conNumDisplay} readOnly className="bg-muted/40 cursor-default" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="farmer">Farmer</Label>
                  <Input id="farmer" value={farmerNameDisplay} readOnly className="bg-muted/40 cursor-default" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tobacco_type">Tobacco Type</Label>
                  <Input id="tobacco_type" value={tobaccoTypeDisplay} readOnly className="bg-muted/40 cursor-default" />
                </div>
              </>
            )}

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                min={0.01}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity..."
                readOnly={isViewMode}
                className={readOnlyInputClass}
                required
              />
            </div>

            {/* Oven */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="oven">
                Oven <span className="text-muted-foreground">(optional)</span>
              </Label>
              <OvenSelect ovens={ovens} value={ovenId} onChange={setOvenId} disabled={isViewMode} />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repay_date">Date</Label>
              <Input
                id="repay_date"
                type="date"
                value={repayDate}
                onChange={(e) => setRepayDate(e.target.value)}
                readOnly={isViewMode}
                className={readOnlyInputClass}
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
                readOnly={isViewMode}
                className={readOnlyInputClass}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#009640] hover:bg-[#007a33] text-white"
                >
                  {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
