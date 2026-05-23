"use client"

import { Table } from "@tanstack/react-table"
import { IconAdjustmentsHorizontal } from "@tabler/icons-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  readonly table: Table<TData>
  readonly title?: string
  readonly label?: string
  readonly columnLabels?: Record<string, string>
}

export function DataTableViewOptions<TData>({
  table,
  title = "View",
  label = "Toggle columns",
  columnLabels = {},
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <IconAdjustmentsHorizontal className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              column.accessorFn !== undefined && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnLabels[column.id] || column.id.replaceAll("_", " ")}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
