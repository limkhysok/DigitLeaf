"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { IconX, IconCirclePlus, IconCheck } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"
import { DataTableViewOptions } from "@workspace/ui/components/data-table-view-options"
import dynamic from "next/dynamic"
import { useLanguage } from "@/hooks/use-language"
import type { RepresentItem } from "@/services/api-client"

const ExportButton = dynamic(
  () => import("./export-button").then((m) => ({ default: m.ExportButton })),
  { ssr: false }
)

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  action?: React.ReactNode
  searchInput: string
  setSearchInput: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  represents: RepresentItem[]
  representFilter: number | null
  setRepresentFilter: (v: number | null) => void
}

export function DataTableToolbar<TData>({
  table,
  action,
  searchInput,
  setSearchInput,
  statusFilter,
  setStatusFilter,
  represents,
  representFilter,
  setRepresentFilter,
}: Readonly<DataTableToolbarProps<TData>>) {
  const [localInput, setLocalInput] = React.useState(searchInput)
  const { t } = useLanguage()
  const f = t.sackRegistration.filters

  const STATUS_LABELS: Record<"pending" | "confirmed", string> = {
    pending: f.statusPending,
    confirmed: f.statusConfirmed,
  }

  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    localInput !== "" ||
    statusFilter !== "all" ||
    representFilter !== null

  const clearAll = () => {
    table.resetColumnFilters()
    setLocalInput("")
    setSearchInput("")
    setStatusFilter("all")
    setRepresentFilter(null)
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      {/* Left Group */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
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
              created_at: t.sackRegistration.table.date,
              actions: t.sackRegistration.table.actions,
            }}
          />
        </div>

        {/* Status Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {f.status}
              {statusFilter !== "all" && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                    1
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                      {STATUS_LABELS[statusFilter as "pending" | "confirmed"]}
                    </Badge>
                  </div>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {(Object.keys(STATUS_LABELS) as Array<"pending" | "confirmed">).map((s) => {
                    const isSelected = statusFilter === s
                    return (
                      <CommandItem
                        key={s}
                        onSelect={() => setStatusFilter(isSelected ? "all" : s)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <IconCheck className="h-4 w-4" />
                        </div>
                        <span>{STATUS_LABELS[s]}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {statusFilter !== "all" && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setStatusFilter("all")}
                        className="justify-center text-center"
                      >
                        {f.clearFilter}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Representative Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {f.representative}
              {representFilter !== null && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                    1
                  </Badge>
                  <div className="hidden space-x-1 lg:flex">
                    <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                      {represents.find((r) => r.represent_id === representFilter)?.represent_name}
                    </Badge>
                  </div>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>{f.noRepresentativesFound}</CommandEmpty>
                <CommandGroup>
                  {represents.map((r) => {
                    const isSelected = representFilter === r.represent_id
                    return (
                      <CommandItem
                        key={r.represent_id}
                        onSelect={() => setRepresentFilter(isSelected ? null : r.represent_id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible"
                          )}
                        >
                          <IconCheck className="h-4 w-4" />
                        </div>
                        <span>{r.represent_name}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {representFilter !== null && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setRepresentFilter(null)}
                        className="justify-center text-center"
                      >
                        {f.clearFilter}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={clearAll}
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
