"use client"
"use no memo"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import {
  apiClient,
  RepresentItem,
  SackRegistrationItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2, IconPlus } from "@tabler/icons-react"
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

export default function SackRegistrationPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, localizeNumber, localizeDateString } = useLanguage()

  // ── Data ──────────────────────────────────────────────────────────────────
  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [total, setTotal] = React.useState(0)
  const [refetchKey, setRefetchKey] = React.useState(0)
  const refetch = React.useCallback(() => setRefetchKey((k) => k + 1), [])

  // ── Filters ───────────────────────────────────────────────────────────────
  const [view] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  // ── Fetch represents once ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => { })
  }, [isAuthLoading, tokens])



  // ── Fetch records ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let cancelled = false
    const timer = setTimeout(() => setIsLoading(true), 0)
    // Fetch a large limit so TanStack table can handle client-side sorting and pagination correctly
    const params = buildFetchParams(0, "", null, "all", null)
    params.limit = 10000
    apiClient.getSackRegistrations(tokens.access_token, params)
      .then((res) => {
        if (cancelled) return
        setRecords(res.items)
        setTotal(res.total)
      })
      .catch((err) => { toast.error((err as Error).message) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isAuthLoading, tokens, refetchKey])

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
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data: records,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
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

  if (!mounted) return null

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
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        <DataTableToolbar table={table} action={actionNode} />
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
