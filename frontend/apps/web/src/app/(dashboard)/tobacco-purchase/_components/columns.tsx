"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header"
import { Button } from "@workspace/ui/components/button"
import { IconEye, IconPencil, IconTrash, IconDots, IconPrinter, IconFileTypePdf } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { TobaccoPurchase, PurchaserItem, RegionItem } from "@/services/api-client"
import { formatPurchaseDate } from "./utils"

interface ColumnHelpers {
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  onView: (rec: TobaccoPurchase) => void
  onEdit: (rec: TobaccoPurchase) => void
  onDelete: (id: number) => void
  onPrint: (rec: TobaccoPurchase) => void
  onDownload: (rec: TobaccoPurchase) => void
}

export function getColumns({ purchasers, regions, onView, onEdit, onDelete, onPrint, onDownload }: ColumnHelpers): ColumnDef<TobaccoPurchase>[] {
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Representative" />,
      cell: ({ row }) => {
        const buyerId = row.getValue("buyer") as number
        const purchaser = purchasers.find(p => p.p_id === buyerId)
        return <div className="tabular-nums font-sm">{purchaser?.p_name_kh || purchaser?.p_name || "-"}</div>
      },
    },
    {
      accessorKey: "vendor_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Farmer" />,
      cell: ({ row }) => <div className="truncate min-w-20 max-w-37.5">{row.original.vendor_name || "-"}</div>,
    },
    {
      id: "region",
      accessorFn: (row) => row.region,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Region" />,
      cell: ({ row }) => {
        const regionId = row.getValue("region") as number | null
        const region = regions.find(r => r.reg_id === regionId)
        return <div className="tabular-nums font-sm">{region?.reg_name_kh || region?.reg_name || "-"}</div>
      },
    },
    {
      accessorKey: "tobacco_item_count",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
      cell: ({ row }) => {
        const val = row.getValue("tobacco_item_count") as number | null
        if (val == null) return <span className="text-[#9CA3AF] text-xs">-</span>
        return (
          <span className="inline-flex items-center justify-center min-w-6 px-2 rounded-full bg-[#F3F4F6] text-[#374151] text-sm font-medium">
            {val}
          </span>
        )
      },
    },
    {
      accessorKey: "rate",
      id: "rate",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
      cell: ({ row }) => {
        const val = row.original.rate
        return (
          <div className="tabular-nums font-sm">
            {val == null ? "-" : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
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
          <div className="tabular-nums font-bold text-[#009640]">
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
              <DropdownMenuItem onClick={() => onPrint(rec)}>
                <IconPrinter className="mr-2 h-4 w-4 text-muted-foreground/70" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload(rec)}>
                <IconFileTypePdf className="mr-2 h-4 w-4 text-muted-foreground/70" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(rec.tp_id)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
