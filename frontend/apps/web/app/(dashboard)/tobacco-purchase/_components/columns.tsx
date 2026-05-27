"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header"
import { Button } from "@workspace/ui/components/button"
import { IconEye, IconPencil, IconTrash, IconDots, IconPrinter } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { TobaccoPurchase, PurchaserItem } from "@/lib/api-client"
import { formatPurchaseDate } from "./utils"

interface ColumnHelpers {
  purchasers: PurchaserItem[]
  onView: (rec: TobaccoPurchase) => void
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
  onPrint: (rec: TobaccoPurchase) => void
}

export function getColumns({ purchasers, onView, onEdit, onDelete, onPrint }: ColumnHelpers): ColumnDef<TobaccoPurchase>[] {
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
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      header: ({ column }) => <DataTableColumnHeader column={column} title="No." />,
      cell: ({ row }) => <div className="font-medium text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoice_num",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice No" />,
      cell: ({ row }) => <div className="tabular-nums font-sm">{row.getValue("invoice_num")}</div>,
    },
    {
      id: "buyer",
      accessorFn: (row) => row.buyer,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Buyer" />,
      cell: ({ row }) => {
        const buyerId = row.getValue("buyer") as number
        const purchaser = purchasers.find(p => p.p_id === buyerId)
        return <div className="tabular-nums font-sm">{purchaser?.p_name_kh || purchaser?.p_name || "-"}</div>
      },
    },
    {
      accessorKey: "vendor_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
      cell: ({ row }) => <div className="truncate min-w-[80px] max-w-[150px]">{row.original.vendor_name || "-"}</div>,
    },
    {
      accessorKey: "tobacco_item_count",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
      cell: ({ row }) => {
        const val = row.getValue("tobacco_item_count") as number | null
        if (val == null) return <span className="text-[#9CA3AF] text-xs">-</span>
        return (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-[#F3F4F6] text-[#374151] text-[11px] font-sm">
            {val}
          </span>
        )
      },
    },
    {
      accessorKey: "total_net_weight",
      // ID must be net_weight for the server-side sorting logic if we map it
      id: "net_weight",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Weight" />,
      cell: ({ row }) => {
        const val = row.original.total_net_weight
        return (
          <div className="tabular-nums font-sm text-[#111827]">
            {val == null ? "-" : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )
      },
    },
    {
      accessorKey: "grand_total",
      id: "grand_total",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Grand Total" />,
      cell: ({ row }) => {
        const val = row.original.grand_total
        return (
          <div className="tabular-nums font-sm text-[#009640]">
            {val == null ? "-" : `៛${Math.round(val).toLocaleString()}`}
          </div>
        )
      },
    },
    {
      id: "purchase_date",
      accessorFn: (row) => row.tp_date,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => {
        const rec = row.original
        return <div className="tabular-nums font-sm">{formatPurchaseDate(rec.tp_date)}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const rec = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onView(rec)}>
                <IconEye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(rec)}>
                <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPrint(rec)}>
                <IconPrinter className="mr-2 h-4 w-4 text-muted-foreground/70" />
                Print Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(rec.tp_id)}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                <IconTrash className="mr-2 h-4 w-4 text-destructive/70 group-focus:text-destructive-foreground" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
