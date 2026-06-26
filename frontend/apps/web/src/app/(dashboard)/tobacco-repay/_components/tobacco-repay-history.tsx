"use client"

import * as React from "react"
import { apiClient, RepayHistoryItem } from "@/services/api-client"
import { toast } from "sonner"
import {
  IconLoader2,
  IconClockHour4,
  IconCirclePlus,
  IconCirclePlusFilled,
} from "@tabler/icons-react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { useDebounce } from "use-debounce"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { getCoreRowModel, RowSelectionState } from "@tanstack/react-table"
import { useReactTable } from "@/utils/table-utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { RepayRecordDialog, RepayRecordDialogMode } from "./repay-record-dialog"
import { printRepayInvoice, downloadRepayInvoicePdf } from "./repay-invoice-print"
import { RepayExportButton } from "./repay-export-button"
import { useLanguage } from "@/hooks/use-language"

const PAGE_SIZE = 20

interface TobaccoRepayHistoryProps {
  token: string
  selectedYear: string
  setSelectedYear: (v: string) => void
  availableYears: string[]
}

export function TobaccoRepayHistory({
  token,
  selectedYear,
  setSelectedYear,
  availableYears,
}: Readonly<TobaccoRepayHistoryProps>) {
  const { t } = useLanguage()
  const hist = t.tobaccoRepay.history
  const [searchInput, setSearchInput] = React.useState("")
  const [search] = useDebounce(searchInput, 400)
  const [yearOpen, setYearOpen] = React.useState(false)
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<RepayRecordDialogMode>("add")
  const [selectedRepayId, setSelectedRepayId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const handleAdd = () => {
    setDialogMode("add")
    setSelectedRepayId(null)
    setDialogOpen(true)
  }

  const handleView = React.useCallback((rec: RepayHistoryItem) => {
    setDialogMode("view")
    setSelectedRepayId(rec.repay_id)
    setDialogOpen(true)
  }, [])

  const handleEdit = React.useCallback((rec: RepayHistoryItem) => {
    setDialogMode("edit")
    setSelectedRepayId(rec.repay_id)
    setDialogOpen(true)
  }, [])

  const { mutate: deleteRepay, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => apiClient.deleteTobaccoRepay(token, id),
    onSuccess: () => {
      toast.success("Repay record deleted")
      queryClient.invalidateQueries({ queryKey: ["tobacco-repay-history", selectedYear] })
      queryClient.invalidateQueries({ queryKey: ["tobacco-repays", selectedYear] })
      setDeleteId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete repay record")
    },
  })

  const { mutate: printRecord, isPending: isPrinting } = useMutation({
    mutationFn: (rec: RepayHistoryItem) => apiClient.getRepayDetail(token, rec.repay_id),
    onSuccess: (detail) => {
      printRepayInvoice({ record: detail }).catch(() => toast.error("Failed to print repay record"))
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to load repay record for printing")
    },
  })

  const { mutate: downloadRecordPdf, isPending: isDownloadingRecordPdf } = useMutation({
    mutationFn: (rec: RepayHistoryItem) => apiClient.getRepayDetail(token, rec.repay_id),
    onSuccess: (detail) => {
      downloadRepayInvoicePdf({ record: detail }).catch(() => toast.error("Failed to download repay record"))
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to load repay record for download")
    },
  })

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["tobacco-repay-history", selectedYear, search],
    queryFn: ({ pageParam }) =>
      apiClient.getTobaccoRepayHistory(token, {
        page: pageParam,
        limit: PAGE_SIZE,
        year: selectedYear,
        search: search || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!token,
  })

  const filteredRecords = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const columns = React.useMemo(() => getColumns({
    onView: handleView,
    onEdit: handleEdit,
    onPrint: (rec) => printRecord(rec),
    onDownload: (rec) => downloadRecordPdf(rec),
    onDelete: (id) => setDeleteId(id),
    isPrinting,
    isDownloading: isDownloadingRecordPdf,
  }), [handleView, handleEdit, printRecord, downloadRecordPdf, isPrinting, isDownloadingRecordPdf])

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => String(row.repay_id),
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualSorting: true,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Year filter */}
          <Popover open={yearOpen} onOpenChange={setYearOpen}>
            <PopoverTrigger asChild>
              <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed bg-white">
                <IconCirclePlus className="mr-2 h-4 w-4" />
                Year
                <Separator orientation="vertical" className="mx-2 h-4" />
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedYear}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-28 p-1" align="start">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => { setSelectedYear(yr); setYearOpen(false) }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                    selectedYear === yr && "font-medium bg-accent"
                  )}
                >
                  {yr}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <RepayExportButton token={token} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            placeholder="Search Contract, Repay No..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-md h-8 w-64 text-xs placeholder:text-sm bg-white"
          />
          <Button size="sm" onClick={handleAdd} className="h-8 px-2 flex gap-1.5 rounded-sm">
            <IconCirclePlusFilled className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40 mt-4">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && filteredRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="bg-gray-100 p-4 rounded-full ring-8 ring-gray-50">
            <IconClockHour4 className="h-10 w-10 text-gray-400 stroke-[1.5]" />
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <h3 className="text-xl font-medium text-gray-900">No History Records</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              There are no tobacco repay history records for {selectedYear} currently.
            </p>
          </div>
        </div>
      )}

      {!isLoading && filteredRecords.length > 0 && (
        <DataTable table={table} noRecordsText="No results." />
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <RepayRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        token={token}
        mode={dialogMode}
        repayId={selectedRepayId}
        selectedYear={selectedYear}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the repay record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 sm:space-x-0">
            <AlertDialogCancel disabled={isDeleting} className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (deleteId != null) deleteRepay(deleteId)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
