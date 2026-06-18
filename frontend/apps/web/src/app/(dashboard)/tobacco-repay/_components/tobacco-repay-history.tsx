"use client"

import * as React from "react"
import { apiClient, RepayHistoryItem } from "@/services/api-client"
import { toast } from "sonner"
import {
  IconLoader2,
  IconClockHour4,
  IconCirclePlus,
  IconCirclePlusFilled,
  IconDots,
  IconEye,
  IconPencil,
  IconTrash,
  IconPrinter,
  IconFileExport,
  IconFileSpreadsheet,
} from "@tabler/icons-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { Input } from "@workspace/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
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
import { printRepayInvoice } from "./repay-invoice-print"

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
  const [searchInput, setSearchInput] = React.useState("")
  const [yearOpen, setYearOpen] = React.useState(false)
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogMode, setDialogMode] = React.useState<RepayRecordDialogMode>("add")
  const [selectedRepayId, setSelectedRepayId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  const handleAdd = () => {
    setDialogMode("add")
    setSelectedRepayId(null)
    setDialogOpen(true)
  }

  const handleView = (rec: RepayHistoryItem) => {
    setDialogMode("view")
    setSelectedRepayId(rec.repay_id)
    setDialogOpen(true)
  }

  const handleEdit = (rec: RepayHistoryItem) => {
    setDialogMode("edit")
    setSelectedRepayId(rec.repay_id)
    setDialogOpen(true)
  }

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

  const { mutate: exportHistory, isPending: isExporting } = useMutation({
    mutationFn: () => apiClient.exportTobaccoRepayHistory(token, { year: selectedYear }),
    onSuccess: (blob) => {
      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tobacco_repay_history_${selectedYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      globalThis.URL.revokeObjectURL(url)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to export repay history")
    },
  })

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["tobacco-repay-history", selectedYear],
    queryFn: ({ pageParam }) =>
      apiClient.getTobaccoRepayHistory(token, {
        page: pageParam,
        limit: PAGE_SIZE,
        year: selectedYear,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!token,
  })

  const allRecords = React.useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  )

  const filteredRecords = React.useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return allRecords
    return allRecords.filter(
      (rec) =>
        rec.con_num?.toLowerCase().includes(term) ||
        rec.repay_num?.toLowerCase().includes(term) ||
        rec.farmer_name?.toLowerCase().includes(term)
    )
  }, [allRecords, searchInput])

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "100px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

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
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Input
            placeholder="Search Contract, Repay No..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-md h-8 w-64 text-xs placeholder:text-sm bg-white"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting} className="h-8 px-2 flex gap-1.5 rounded-sm bg-white">
                {isExporting ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconFileExport className="h-4 w-4" />}
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => exportHistory()} disabled={isExporting}>
                <IconFileSpreadsheet className="mr-2 h-4 w-4 text-muted-foreground/70" />
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <div className="rounded-md border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Repay No.</TableHead>
                  <TableHead>Contract No.</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Tobacco</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {filteredRecords.map((rec, idx) => (
                  <TableRow key={rec.repay_id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{rec.repay_num || "—"}</TableCell>
                    <TableCell>{rec.con_num || "—"}</TableCell>
                    <TableCell>{rec.representative || "—"}</TableCell>
                    <TableCell>{rec.farmer_name || "—"}</TableCell>
                    <TableCell>{rec.tobacco_type || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-[#009640]">
                      {rec.qty_repay !== null && rec.qty_repay !== undefined
                        ? `${rec.qty_repay.toLocaleString()} kg`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center font-medium">{rec.contract_year || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{rec.repay_date || "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0">
                            <span className="sr-only">Open menu</span>
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleView(rec)}>
                            <IconEye className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(rec)}>
                            <IconPencil className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => printRecord(rec)} disabled={isPrinting}>
                            <IconPrinter className="mr-2 h-4 w-4 text-muted-foreground/70" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(rec.repay_id)}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
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
