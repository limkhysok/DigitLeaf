"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { IconLoader2, IconEye } from "@tabler/icons-react"
import { apiClient } from "@/services/api-client"
import { useLanguage } from "@/hooks/use-language"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table"

interface ContractDetailDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  token: string
  conId: number | null
}

export function ContractDetailDialog({
  open,
  onOpenChange,
  token,
  conId,
}: Readonly<ContractDetailDialogProps>) {
  const { t } = useLanguage()
  const cd = t.tobaccoRepay.contractDetail
  const { data: detail, isLoading } = useQuery({
    queryKey: ["contract-repay-detail", conId],
    queryFn: () => apiClient.getContractRepayDetail(token, conId ?? 0),
    enabled: open && !!conId && !!token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconEye className="h-5 w-5 text-[#009640]" />
            {cd.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !detail ? (
          <div className="flex items-center justify-center h-40">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border divide-y text-sm">
              <div className="grid grid-cols-2 gap-2 p-2 divide-x">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{cd.contractNo}</span>
                  <span className="font-medium">{detail.contract_number || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-muted-foreground">{cd.representative}</span>
                  <span className="font-medium">{detail.representative || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 divide-x">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{cd.farmer}</span>
                  <span className="font-medium">{detail.contract_contractor_name || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-muted-foreground">{cd.tobaccoType}</span>
                  <span className="font-medium">{detail.tobacco_type || "—"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 divide-x">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{cd.year}</span>
                  <span className="font-medium">{detail.contract_year ?? "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-muted-foreground">{cd.amountKg}</span>
                  <span className="font-medium">{detail.Quantity == null ? "—" : detail.Quantity.toLocaleString()}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2 divide-x">
                <div />
                <div className="flex flex-col gap-0.5 pl-2">
                  <span className="text-muted-foreground">{cd.deliveryKg}</span>
                  <span className="font-medium text-[#009640]">
                    {detail.total_repaid == null ? "—" : detail.total_repaid.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{cd.invoice}</TableHead>
                    <TableHead>{cd.date}</TableHead>
                    <TableHead className="text-left">{cd.deliveryKg}</TableHead>
                    <TableHead>{cd.note}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.repays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {cd.noRepayRecords}
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.repays.map((r) => (
                      <TableRow key={r.repay_id}>
                        <TableCell className="font-medium">{r.repay_num || "—"}</TableCell>
                        <TableCell>{r.repay_date || "—"}</TableCell>
                        <TableCell className="text-left">
                          {r.qty_repay == null ? "—" : r.qty_repay.toLocaleString()}
                        </TableCell>
                        <TableCell className="truncate max-w-32">{r.note || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {cd.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
