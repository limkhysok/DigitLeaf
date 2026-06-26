"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import { IconDots, IconEye, IconPencil, IconTrash, IconPrinter, IconFileTypePdf } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { RepayHistoryItem } from "@/services/api-client"

interface ColumnHelpers {
  t: any
  onView: (rec: RepayHistoryItem) => void
  onEdit: (rec: RepayHistoryItem) => void
  onPrint: (rec: RepayHistoryItem) => void
  onDownload: (rec: RepayHistoryItem) => void
  onDelete: (id: number) => void
  isPrinting: boolean
  isDownloading: boolean
}

export function getColumns({
  t,
  onView,
  onEdit,
  onPrint,
  onDownload,
  onDelete,
  isPrinting,
  isDownloading,
}: ColumnHelpers): ColumnDef<RepayHistoryItem>[] {
  const tbl = t.tobaccoRepay.historyTable
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={tbl.selectAll}
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={tbl.selectRow}
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      header: () => tbl.no,
      cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "repay_num",
      accessorKey: "repay_num",
      header: () => tbl.invoice,
      cell: ({ row }) => <div className="font-medium">{row.getValue("repay_num") || "—"}</div>,
    },
    {
      id: "con_num",
      accessorKey: "con_num",
      header: () => tbl.contractNo,
      cell: ({ row }) => <div>{row.getValue("con_num") || "—"}</div>,
    },
    {
      id: "representative",
      accessorKey: "representative",
      header: () => tbl.representative,
      cell: ({ row }) => <div>{row.getValue("representative") || "—"}</div>,
    },
    {
      id: "farmer_name",
      accessorKey: "farmer_name",
      header: () => tbl.farmer,
      cell: ({ row }) => <div>{row.getValue("farmer_name") || "—"}</div>,
    },
    {
      id: "tobacco_type",
      accessorKey: "tobacco_type",
      header: () => tbl.tobacco,
      cell: ({ row }) => <div>{row.getValue("tobacco_type") || "—"}</div>,
    },
    {
      id: "qty_repay",
      accessorKey: "qty_repay",
      header: () => <div className="text-right">{tbl.deliveryKg}</div>,
      cell: ({ row }) => {
        const val = row.getValue("qty_repay") as number | null
        return (
          <div className="text-right font-medium text-[#009640]">
            {val !== null && val !== undefined ? `${val.toLocaleString()} kg` : "—"}
          </div>
        )
      },
    },
    {
      id: "contract_year",
      accessorKey: "contract_year",
      header: () => <div className="text-center">{tbl.year}</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("contract_year") || "—"}</div>,
    },
    {
      id: "repay_date",
      accessorKey: "repay_date",
      header: () => tbl.date,
      cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("repay_date") || "—"}</div>,
      enableHiding: false,
    },
    {
      id: "actions",
      header: () => <div className="text-center">{tbl.actions}</div>,
      cell: ({ row }) => {
        const rec = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">{tbl.openMenu}</span>
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onView(rec)}>
                  <IconEye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  {tbl.view}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(rec)}>
                  <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  {tbl.edit}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(rec)} disabled={isPrinting}>
                  <IconPrinter className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  {tbl.print}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(rec)} disabled={isDownloading}>
                  <IconFileTypePdf className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  {tbl.downloadPdf}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(rec.repay_id)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  {tbl.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableHiding: false,
    },
  ]
}
