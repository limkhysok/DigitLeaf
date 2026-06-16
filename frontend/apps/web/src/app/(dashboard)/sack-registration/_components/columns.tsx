"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DataTableColumnHeader } from "@workspace/ui/components/data-table-column-header"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { IconEye, IconPencil, IconTrash, IconDots } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SackRegistrationItem } from "@/services/api-client"


interface ColumnHelpers {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      id: "sack_in_kg",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.sackWeight} />,
      cell: ({ row }) => {
        const registered = row.original.sack_in_kg
        if (registered === null || registered === undefined) {
          return <span className="text-muted-foreground/50">—</span>
        }
        return (
          <div className="tabular-nums font-sm">
            {localizeNumber(registered)}
          </div>
        )
      },
    },
    {
      id: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.status} />,
      cell: ({ row }) => {
        const isConfirmed = row.original.sack_in_kg === 0
        return isConfirmed ? (
          <Badge variant="outline" className=" bg-green-500/15 text-green-700 dark:border-green-400/50 dark:bg-green-400/15 dark:text-green-300 px-3 py-1 text-[13px] font-semibold">
            {t.sackRegistration.filters.statusConfirmed}
          </Badge>
        ) : (
          <Badge variant="outline" className=" bg-yellow-500/15 text-yellow-700 dark:border-yellow-400/50 dark:bg-yellow-400/15 dark:text-yellow-300 px-3 py-1 text-sm font-semibold tracking-wide">
            {t.sackRegistration.filters.statusPending}
          </Badge>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "registered_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title={t.sackRegistration.table.date} />,
      cell: ({ row }) => (
        <div className="tabular-nums font-sm">
          {localizeDateString(format(new Date(row.getValue("registered_at")), "dd/MM/yyyy"))}
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
              <Button variant="ghost" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <IconDots className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
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
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                {t.sackRegistration.dialog.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
