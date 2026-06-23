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
  onView: (rec: RepayHistoryItem) => void
  onEdit: (rec: RepayHistoryItem) => void
  onPrint: (rec: RepayHistoryItem) => void
  onDownload: (rec: RepayHistoryItem) => void
  onDelete: (id: number) => void
  isPrinting: boolean
  isDownloading: boolean
}

export function getColumns({
  onView,
  onEdit,
  onPrint,
  onDownload,
  onDelete,
  isPrinting,
  isDownloading,
}: ColumnHelpers): ColumnDef<RepayHistoryItem>[] {
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
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      header: () => "No.",
      cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "repay_num",
      accessorKey: "repay_num",
      header: () => "Repay No.",
      cell: ({ row }) => <div className="font-medium">{row.getValue("repay_num") || "—"}</div>,
    },
    {
      id: "con_num",
      accessorKey: "con_num",
      header: () => "Contract No.",
      cell: ({ row }) => <div>{row.getValue("con_num") || "—"}</div>,
    },
    {
      id: "representative",
      accessorKey: "representative",
      header: () => "Representative",
      cell: ({ row }) => <div>{row.getValue("representative") || "—"}</div>,
    },
    {
      id: "farmer_name",
      accessorKey: "farmer_name",
      header: () => "Contractor",
      cell: ({ row }) => <div>{row.getValue("farmer_name") || "—"}</div>,
    },
    {
      id: "tobacco_type",
      accessorKey: "tobacco_type",
      header: () => "Tobacco",
      cell: ({ row }) => <div>{row.getValue("tobacco_type") || "—"}</div>,
    },
    {
      id: "qty_repay",
      accessorKey: "qty_repay",
      header: () => <div className="text-right">Quantity</div>,
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
      header: () => <div className="text-center">Year</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("contract_year") || "—"}</div>,
    },
    {
      id: "repay_date",
      accessorKey: "repay_date",
      header: () => "Date",
      cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("repay_date") || "—"}</div>,
      enableHiding: false,
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const rec = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Open menu</span>
                  <IconDots className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onView(rec)}>
                  <IconEye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(rec)}>
                  <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrint(rec)} disabled={isPrinting}>
                  <IconPrinter className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(rec)} disabled={isDownloading}>
                  <IconFileTypePdf className="mr-2 h-4 w-4 text-muted-foreground/70" />
                  Download as PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(rec.repay_id)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <IconTrash className="mr-2 h-4 w-4" />
                  Delete
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
