"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { IconLoader2, IconCash } from "@tabler/icons-react"
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
import { apiClient, TobaccoRepayItem } from "@/services/api-client"

interface CreateRepayDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  record: TobaccoRepayItem | null
  selectedYear: string
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function CreateRepayDialog({
  open,
  onOpenChange,
  token,
  record,
  selectedYear,
}: Readonly<CreateRepayDialogProps>) {
  const queryClient = useQueryClient()

  const [repayNum, setRepayNum] = React.useState<string>("")
  const [repayDate, setRepayDate] = React.useState(todayIso)
  const [quantity, setQuantity] = React.useState<string>("")
  const [ovenId, setOvenId] = React.useState<string>("")
  const [note, setNote] = React.useState<string>("")

  const remaining =
    record?.Quantity != null && record?.total_repaid != null
      ? record.Quantity - record.total_repaid
      : null

  // Auto-generate repay number when dialog opens
  const { data: nextRepayNum } = useQuery({
    queryKey: ["next-repay-num"],
    queryFn: () => apiClient.getNextRepayNum(token),
    enabled: open,
    staleTime: 0,
  })

  React.useEffect(() => {
    if (open && nextRepayNum) setRepayNum(nextRepayNum)
  }, [open, nextRepayNum])

  // Pre-fill quantity with remaining when dialog opens or record changes
  React.useEffect(() => {
    if (open && remaining != null) setQuantity(String(remaining))
  }, [open, record])

  // Fetch ovens — reuses existing tobacco-purchase endpoint
  const { data: ovens = [] } = useQuery({
    queryKey: ["ovens"],
    queryFn: () => apiClient.getOvens(token),
    enabled: open,
  })

  const effectiveOvenId = ovens.length === 1 ? String(ovens[0]?.id) : ovenId

  const parsedQty = parseFloat(quantity)

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      apiClient.createTobaccoRepay(token, {
        con_id: record!.id!,
        con_num: record!.contract_number!,
        f_id: record!.f_id!,
        repay_num: repayNum.trim() || undefined,
        repay_date: repayDate,
        qty_repay: parsedQty,
        oven: effectiveOvenId ? Number(effectiveOvenId) : undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Repayment recorded successfully")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record repayment")
    },
  })

  function handleClose() {
    setRepayNum("")
    setRepayDate(todayIso())
    setQuantity("")
    setOvenId("")
    setNote("")
    onOpenChange(false)
  }

  function handleSubmit() {
    if (!record?.id || !record?.f_id || !record?.contract_number) return
    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast.error("Enter a valid quantity to repay")
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

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          className="flex flex-col gap-4 py-2"
        >
          {/* Quantity summary */}
          {record && (
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
          )}

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
              value={record?.contract_number ?? ""}
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
              value={record?.farmer_name ?? ""}
              readOnly
              placeholder="—"
              className="bg-muted/40 cursor-default"
            />
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
              disabled={isPending || !record?.f_id || isNaN(parsedQty) || parsedQty <= 0}
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
