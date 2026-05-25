"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header"
import { Button } from "@workspace/ui/components/button"
import { IconEye, IconPencil, IconTrash, IconDots } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SackRegistrationItem } from "@/lib/api-client"
import { cn } from "@workspace/ui/lib/utils"
import { STATUS_MAP } from "./constants"


interface ColumnHelpers {
  t: any
  localizeNumber: (num: number | string | null | undefined) => string
  localizeDateString: (formattedDate: string) => string
  total: number
  onView: (rec: SackRegistrationItem) => void
  onEdit: (rec: SackRegistrationItem) => void
  onDelete: (rec: SackRegistrationItem, index: number) => void
}

export function getColumns({ t, localizeNumber, localizeDateString, total, onView, onEdit, onDelete }: ColumnHelpers): ColumnDef<SackRegistrationItem>[] {
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
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.no} />,
      cell: ({ row }) => <div className="font-medium">{localizeNumber(total - row.index)}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "represent_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.representative} />,
      cell: ({ row }) => <div className="font-medium">{row.getValue("represent_name")}</div>,
    },
    {
      accessorKey: "member_farmer_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.farmer} />,
      cell: ({ row }) => <div className="font-medium">{row.getValue("member_farmer_name")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.status} />,
      cell: ({ row }) => {
        const statusVal = row.getValue("status") as number
        const status = STATUS_MAP[statusVal] ?? { className: "bg-muted text-muted-foreground" }

        const getStatusLabel = (val: number) => {
          switch (val) {
            case 0: return t.sackRegistration.filters.statusPending
            case 1: return t.sackRegistration.filters.statusConfirmed
            case 2: return t.sackRegistration.filters.statusRejected
            default: return String(val)
          }
        }

        return (
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-regular border", status.className)}>
            {getStatusLabel(statusVal)}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(String(row.getValue(id)))
      },
    },
    {
      accessorKey: "sack_in_kg",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.sackWeight} />,
      cell: ({ row }) => {
        const val = row.getValue("sack_in_kg") as number | null
        return (
          <div className="tabular-nums font-sm">
            {val !== null && val !== undefined ? localizeNumber(val) : <span className="text-muted-foreground/50">—</span>}
          </div>
        )
      },
    },
    {
      accessorKey: "registered_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.date} />,
      cell: ({ row }) => (
        <div className="tabular-nums font-sm">
          {localizeNumber(format(new Date(row.getValue("registered_at")), "dd/MM/yyyy"))}
        </div>
      ),
      sortingFn: "datetime",
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
                {t.sackRegistration.dialog.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(rec)}>
                <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                {t.sackRegistration.dialog.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(rec, total - row.index)}
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              >
                <IconTrash className="mr-2 h-4 w-4 text-destructive/70 group-focus:text-destructive-foreground" />
                {t.sackRegistration.dialog.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
