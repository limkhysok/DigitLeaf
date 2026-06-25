"use client"
"use no memo"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import {
  apiClient,
  SackRegistrationItem,
} from "@/services/api-client"

import { IconLoader2, IconCirclePlusFilled } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table"
import { useReactTable } from "@/utils/table-utils"
import { DataTable } from "./_components/data-table"
import { DataTableToolbar } from "./_components/data-table-toolbar"
import { getColumns } from "./_components/columns"
import { EditDialog } from "./_components/edit-dialog"
import { DeleteDialog } from "./_components/delete-dialog"
import { ViewDialog } from "./_components/view-dialog"
import { RegisterDialog } from "./_components/register-dialog"
import { SackRegistrationCard } from "./_components/sack-registration-card"

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { useQueryState, parseAsString } from "nuqs"
import { useDebounce } from "use-debounce"
import { useInView } from "react-intersection-observer"
import { Skeleton } from "@workspace/ui/components/skeleton"

const PAGE_SIZE = 20

export default function SackRegistrationPage() {

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, localizeNumber, localizeDateString } = useLanguage()
  const queryClient = useQueryClient()

  const [view] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [viewTargetNo, setViewTargetNo] = React.useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  const [searchInput, setSearchInput] = useQueryState("search", parseAsString.withDefault(""))
  const [debouncedSearch] = useDebounce(searchInput, 400)

  const { data: represents = [] } = useQuery({
    queryKey: ["represents"],
    queryFn: () => apiClient.getRepresents(tokens!.access_token),
    enabled: !!tokens?.access_token && !isAuthLoading,
  })

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["sack-registrations", debouncedSearch],
    queryFn: ({ pageParam }) =>
      apiClient.getSackRegistrations(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!tokens?.access_token && !isAuthLoading,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  const records = React.useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])
  const total = data?.pages[0]?.total ?? 0

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "200px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const refetch = () => {
    queryClient.resetQueries({ queryKey: ["sack-registrations"] })
  }

  const handleView = (rec: SackRegistrationItem, no: number) => {
    setViewTarget(rec)
    setViewTargetNo(no)
  }

  const columns = getColumns({
    t,
    localizeNumber,
    localizeDateString,
    total,
    onView: handleView,
    onEdit: setEditTarget,
    onDelete: (rec, index) => setDeleteTarget({ id: rec.id, no: index })
  })

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: records,
    columns,
    state: {
      columnVisibility,
      rowSelection,
      sorting,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  })

  const actionNode = (
    <Button size="sm" onClick={() => setRegisterOpen(true)} className="h-8 px-2 flex gap-1.5 rounded-sm">
      <IconCirclePlusFilled className="h-4 w-4" />
      <span className="hidden sm:inline">{t.sackRegistration.filters.add}</span>
    </Button>
  )

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.sackRegistration.title}</h1>
          <p className="text-muted-foreground text-xs md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
            {t.sackRegistration.subtitle}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-25" />
              <Skeleton className="h-8 w-25" />
            </div>
            <Skeleton className="h-8 w-62.5" />
          </div>
          <div className="rounded-sm border mt-2">
            <div className="h-10 border-b bg-muted/20" />
            {[1, 2, 3, 4, 5].map((id) => (
              <div key={id} className="flex items-center p-4 border-b last:border-0">
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && (
        <DataTableToolbar
          table={table}
          action={actionNode}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        />
      )}

      {!isLoading && records.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t.sackRegistration.table.noRecords}
        </div>
      )}

      {!isLoading && records.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {table.getRowModel().rows.map((row) => (
            <SackRegistrationCard
              key={row.original.id}
              rec={row.original}
              index={total - row.index - 1}
              onView={handleView}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
            />
          ))}
        </div>
      )}

      {!isLoading && records.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-3 gap-4">
          {table.getRowModel().rows.map((row) => (
            <SackRegistrationCard
              key={row.original.id}
              rec={row.original}
              index={total - row.index - 1}
              onView={handleView}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
            />
          ))}
        </div>
      )}

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
                  onView={handleView}
                  onEdit={setEditTarget}
                  onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - row.index })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <EditDialog target={editTarget} onClose={() => setEditTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <ViewDialog
        target={viewTarget}
        onClose={() => { setViewTarget(null); setViewTargetNo(null) }}
        onEdit={setEditTarget}
        onDelete={(rec) => setDeleteTarget({ id: rec.id, no: viewTargetNo ?? total })}
      />
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
    </div>
  )
}
