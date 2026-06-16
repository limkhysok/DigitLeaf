"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { IconX } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DataTableViewOptions } from "@workspace/ui/components/data-table-view-options"
import dynamic from "next/dynamic"
import { useLanguage } from "@/hooks/use-language"

const ExportButton = dynamic(
  () => import("./export-button").then((m) => ({ default: m.ExportButton })),
  { ssr: false }
)

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
  const [localInput, setLocalInput] = React.useState(searchInput)
  const isFiltered = table.getState().columnFilters.length > 0 || localInput !== ""
  const { t } = useLanguage()

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
              member_farmer_mf_code: t.sackRegistration.table.farmerId,
              sack_in_kg: t.sackRegistration.table.sackWeight,
              status: t.sackRegistration.table.status,
              registered_by: t.sackRegistration.table.registeredBy,
              registered_at: t.sackRegistration.table.date,
              actions: t.sackRegistration.table.actions,
            }}
          />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              setLocalInput("")
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
          value={localInput}
          onChange={(event) => {
            setLocalInput(event.target.value)
            setSearchInput(event.target.value)
          }}
          className="rounded-sm! h-8 w-full lg:max-w-none lg:w-58.5 text-xs md:text-sm  placeholder:text-sm"
        />
      </div>

      {/* Right Group (Create Button) */}
      <div className="flex items-center gap-2 shrink-0">
        {action}
      </div>
    </div>
  )
}
