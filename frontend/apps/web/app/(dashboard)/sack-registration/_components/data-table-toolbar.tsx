"use client"

import { Table } from "@tanstack/react-table"
import { IconX } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DataTableViewOptions } from "@workspace/ui/components/data-table-view-options"

import { DataTableFacetedFilter } from "@workspace/ui/components/data-table-faceted-filter"
import { useLanguage } from "@/hooks/use-language"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  action?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  action,
}: Readonly<DataTableToolbarProps<TData>>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const { t } = useLanguage()

  const statuses = [
    {
      value: "0",
      label: t.sackRegistration.filters.statusPending,
    },
    {
      value: "1",
      label: t.sackRegistration.filters.statusApproved,
    },
    {
      value: "2",
      label: t.sackRegistration.filters.statusRejected,
    },
  ]

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t.sackRegistration.filters.searchPlaceholder}
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) =>
            table.setGlobalFilter(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title={t.sackRegistration.filters.status}
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {action}
        <DataTableViewOptions 
          table={table} 
          title={t.common.view}
          label={t.common.toggleColumns}
          columnLabels={{
            no: t.sackRegistration.table.no,
            represent_name: t.sackRegistration.table.representative,
            member_farmer_name: t.sackRegistration.table.farmer,
            status: t.sackRegistration.table.status,
            sack_in_kg: t.sackRegistration.table.sackWeight,
            registered_at: t.sackRegistration.table.registeredAt,
            actions: t.sackRegistration.table.actions,
            notes: t.sackRegistration.table.notes,
          }}
        />
      </div>
    </div>
  )
}
