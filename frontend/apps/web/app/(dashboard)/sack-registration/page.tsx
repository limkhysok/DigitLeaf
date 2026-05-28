"use client"
"use no memo"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import {
  apiClient,
  SackRegistrationItem,
} from "@/lib/api-client"

import { IconPlus } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { useReactTable } from "@/lib/table-utils"
import { DataTable } from "./_components/data-table"
import { DataTableToolbar } from "./_components/data-table-toolbar"
import { getColumns } from "./_components/columns"
import { buildFetchParams } from "./_components/constants"
import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { ViewDialog } from "./_components/view-dialog"
import { RegisterDialog } from "./_components/register-dialog"
import { SackRegistrationCard } from "./_components/sack-registration-card"

// ── NEW IMPORTS ──
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useQueryState, parseAsString } from "nuqs"
import { useDebounce } from "use-debounce"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function SackRegistrationPage() {


  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, localizeNumber, localizeDateString } = useLanguage()
  const queryClient = useQueryClient()

  // ── Filters ───────────────────────────────────────────────────────────────
  const [view] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  // ── Search & Nuqs ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useQueryState("search", parseAsString.withDefault(""))
  const [debouncedSearch] = useDebounce(searchInput, 400)

  // ── Data (React Query) ─────────────────────────────────────────────────────
  const { data: represents = [] } = useQuery({
    queryKey: ["represents"],
    queryFn: () => apiClient.getRepresents(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const { data: fetchResult, isLoading } = useQuery({
    queryKey: ["sack-registrations"],
    queryFn: () => {
      const params = buildFetchParams(0, "", null, "all", null)
      params.limit = 10000
      return apiClient.getSackRegistrations(tokens!.access_token, params)
    },
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const records = fetchResult?.items ?? []
  const total = fetchResult?.total ?? 0

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["sack-registrations"] })
  }

  const columns = getColumns({
    t,
    localizeNumber,
    localizeDateString,
    total,
    onView: setViewTarget,
    onEdit: setEditTarget,
    onDelete: (rec, index) => setDeleteTarget({ id: rec.id, no: index })
  })

  // ── Table State ───────────────────────────────────────────────────────────
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter: debouncedSearch,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const represent = String(row.getValue("represent_name") || "").toLowerCase()
      const farmer = String(row.getValue("member_farmer_name") || "").toLowerCase()
      return represent.includes(search) || farmer.includes(search)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const actionNode = (
    <Button size="sm" onClick={() => setRegisterOpen(true)} className="h-8 gap-1.5 flex">
      <IconPlus className="h-4 w-4" />
      <span className="hidden sm:inline">{t.sackRegistration.filters.add}</span>
    </Button>
  )



  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-semibold tracking-tight md:text-xl lg:text-2xl">{t.sackRegistration.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-sm sm:text-balance md:max-w-[100%]">
            {t.sackRegistration.subtitle}
          </p>
        </div>
      </div>



      {/* ════════════════════════════════════════════════════════════════════
          LOADING / EMPTY STATES — shared
      ════════════════════════════════════════════════════════════════════ */}
      {isLoading && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-8 w-[100px]" />
            </div>
            <Skeleton className="h-8 w-[250px]" />
          </div>
          <div className="rounded-md border mt-2">
            <div className="h-10 border-b bg-muted/20" />
            {[1, 2, 3, 4, 5].map((id) => (
              <div key={id} className="flex items-center p-4 border-b last:border-0">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
      {!isLoading && records.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t.sackRegistration.table.noRecords}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TOOLBAR — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <DataTableToolbar 
          table={table} 
          action={actionNode} 
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {table.getRowModel().rows.map((row) => (
            <SackRegistrationCard
              key={row.original.id}
              rec={row.original}
              index={total - row.index - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-4">
          {table.getRowModel().rows.map((row) => (
            <SackRegistrationCard
              key={row.original.id}
              rec={row.original}
              index={total - row.index - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP CONTENT — (≥ 1024px / lg and above)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="hidden lg:block">
          {view === "list" ? (
            <DataTable
              table={table}
              noRecordsText={t.sackRegistration.table.noRecords}
            />
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
              {table.getRowModel().rows.map((row) => (
                <SackRegistrationCard
                  key={row.original.id}
                  rec={row.original}
                  index={total - row.index - 1}
                  onView={setViewTarget}
                  onEdit={setEditTarget}
                  onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <EditDialog target={editTarget} onClose={() => setEditTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <ViewDialog
        target={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={setEditTarget}
        onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - records.findIndex(r => r.id === rec.id) })}
      />
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
    </div>
  )
}
