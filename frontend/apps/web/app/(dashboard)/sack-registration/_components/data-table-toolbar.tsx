"use client"

import { Table } from "@tanstack/react-table"
import { IconX } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DataTableViewOptions } from "@workspace/ui/components/data-table-view-options"

import { DataTableFacetedFilter } from "@workspace/ui/components/data-table-faceted-filter"
import { useLanguage } from "@/hooks/use-language"
import { ExportButton } from "./export-button"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  action?: React.ReactNode
  searchInput: string
  setSearchInput: (v: string) => void
}

export function DataTableToolbar<TData>({
  table,
  action,
  searchInput,
  setSearchInput,
}: Readonly<DataTableToolbarProps<TData>>) {
  const isFiltered = table.getState().columnFilters.length > 0 || searchInput !== ""
  const { t } = useLanguage()

  const statuses = [
    {
      value: "0",
      label: t.sackRegistration.filters.statusPending,
    },
    {
      value: "1",
      label: t.sackRegistration.filters.statusConfirmed,
    },
    {
      value: "2",
      label: t.sackRegistration.filters.statusRejected,
    },
  ]

  return (
    <div className="flex w-full items-center justify-between gap-2">
      {/* Left Group */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden lg:flex items-center">
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
              registered_at: t.sackRegistration.table.date,
              actions: t.sackRegistration.table.actions,
              notes: t.sackRegistration.table.notes,
            }}
          />
        </div>
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
            onClick={() => {
              table.resetColumnFilters()
              setSearchInput("")
            }}
            className="h-8 px-2 lg:px-3 shrink-0"
          >
            {t.common.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
        <ExportButton />
      </div>

      {/* Center Group (Search) */}
      <div className="flex-1 flex justify-center lg:justify-end">
        <Input
          placeholder={t.sackRegistration.filters.searchPlaceholder}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="rounded-md! h-8 w-full lg:max-w-none lg:w-[250px] text-xs md:text-sm  placeholder:text-sm"
        />
      </div>

      {/* Right Group (Create Button) */}
      <div className="flex items-center gap-2 shrink-0">
        {action}
      </div>
    </div>
  )
}
