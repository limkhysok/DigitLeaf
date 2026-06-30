"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  IconLoader2,
  IconActivity,
  IconLockSquare,
  IconCirclePlus,
  IconCheck,
  IconX,
  IconEye,
} from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, type AuditLog } from "@/services/api-client"
import { hasScope } from "@/utils/rbac"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useInView } from "react-intersection-observer"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"

const PAGE_SIZE = 20
const ACTION_OPTIONS = ["DELETE", "UPDATE"]

export default function MonitorLogsPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  const canViewLogs = hasScope(tokens, "view_audit_logs")

  const [actionFilter, setActionFilter] = React.useState<string[]>([])

  const toggleActionFilter = React.useCallback((value: string) => {
    setActionFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }, [])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["audit-logs", actionFilter],
    queryFn: ({ pageParam }) =>
      apiClient.getAuditLogs(tokens!.access_token, {
        page: pageParam,
        limit: PAGE_SIZE,
        action: actionFilter.length > 0 ? actionFilter : undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.length + 1 : undefined,
    enabled: !!tokens?.access_token && !isAuthLoading && canViewLogs,
    staleTime: 30_000,
  })

  const logs = React.useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])

  const { ref: sentinelRef, inView } = useInView({ rootMargin: "200px" })
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)

  const toggleRow = React.useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const isAllSelected = logs.length > 0 && logs.every((l) => selectedIds.has(l.id))
  const isSomeSelected = !isAllSelected && logs.some((l) => selectedIds.has(l.id))

  const toggleAllRows = React.useCallback((checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) logs.forEach((l) => next.add(l.id))
      else logs.forEach((l) => next.delete(l.id))
      return next
    })
  }, [logs])

  if (!mounted) return null

  if (!canViewLogs) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 gap-2 text-muted-foreground text-sm">
        <IconLockSquare className="h-8 w-8 stroke-[1.5]" />
        <span>{t.monitorLogs.accessDenied}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">{t.monitorLogs.title}</h1>
          <p className="text-muted-foreground text-sm md:text-sm lg:text-base sm:text-balance md:max-w-full line-clamp-1">
            {t.monitorLogs.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button suppressHydrationWarning variant="outline" size="sm" className="h-8 border-dashed">
              <IconCirclePlus className="mr-2 h-4 w-4" />
              {t.monitorLogs.filters.action}
              {actionFilter.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <div className="hidden space-x-1 lg:flex">
                    {actionFilter.length > 2 ? (
                      <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                        {actionFilter.length}
                      </Badge>
                    ) : (
                      actionFilter.map((a) => (
                        <Badge key={a} variant="secondary" className="rounded-sm px-1 font-normal">
                          {a}
                        </Badge>
                      ))
                    )}
                  </div>
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                    {actionFilter.length}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup>
                  {ACTION_OPTIONS.map((a) => {
                    const isSelected = actionFilter.includes(a)
                    return (
                      <CommandItem
                        key={a}
                        onSelect={() => toggleActionFilter(a)}
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
                        <span>{a}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {actionFilter.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => setActionFilter([])}
                        className="justify-center text-center"
                      >
                        {t.monitorLogs.filters.clearFilter}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {actionFilter.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setActionFilter([])} className="h-8 px-2">
            {t.common.reset}
            <IconX className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
          <IconActivity className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{t.monitorLogs.noRecordsFound}</span>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="rounded-md border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllSelected || (isSomeSelected && "indeterminate")}
                      onCheckedChange={(value) => toggleAllRows(!!value)}
                      aria-label="Select all"
                      className="translate-y-0.5"
                    />
                  </TableHead>
                  <TableHead>{t.monitorLogs.columns.page}</TableHead>
                  <TableHead>{t.monitorLogs.columns.action}</TableHead>
                  <TableHead>{t.monitorLogs.columns.field}</TableHead>
                  <TableHead>{t.monitorLogs.columns.oldValue}</TableHead>
                  <TableHead>{t.monitorLogs.columns.newValue}</TableHead>
                  <TableHead>{t.monitorLogs.columns.user}</TableHead>
                  <TableHead>{t.monitorLogs.columns.ipAddress}</TableHead>
                  <TableHead>{t.monitorLogs.columns.date}</TableHead>
                  <TableHead className="w-10 text-right">{t.monitorLogs.columns.details}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {logs.map((log) => (
                  <TableRow key={log.id} data-state={selectedIds.has(log.id) && "selected"}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(log.id)}
                        onCheckedChange={(value) => toggleRow(log.id, !!value)}
                        aria-label="Select row"
                        className="translate-y-0.5"
                      />
                    </TableCell>
                    <TableCell className="max-w-50 truncate" title={log.page_name ?? ""}>
                      {log.page_name?.replace(/^\/api\/v1/, "")}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-50 truncate" title={log.field_type ?? ""}>
                      {log.field_type}
                    </TableCell>
                    <TableCell>{log.old_value}</TableCell>
                    <TableCell>{log.new_value}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.ip_address}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.date), "dd-MM-yyyy/h:mm:ss a")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setSelectedLog(log)}
                        aria-label={t.monitorLogs.columns.details}
                      >
                        <IconEye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEye className="h-5 w-5 text-[#009640]" />
              {t.monitorLogs.detailsDialog.title}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="rounded-lg border border-border divide-y divide-border text-sm overflow-hidden">
              {[
                { label: t.monitorLogs.columns.date, value: format(new Date(selectedLog.date), "dd-MM-yyyy/h:mm:ss a") },
                { label: t.monitorLogs.columns.page, value: selectedLog.page_name },
                { label: t.monitorLogs.columns.action, value: selectedLog.action },
                { label: t.monitorLogs.columns.field, value: selectedLog.field_type },
                { label: t.monitorLogs.columns.oldValue, value: selectedLog.old_value },
                { label: t.monitorLogs.columns.newValue, value: selectedLog.new_value },
                { label: t.monitorLogs.columns.user, value: selectedLog.user },
                { label: t.monitorLogs.columns.ipAddress, value: selectedLog.ip_address },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-0.5 px-3.5 py-2.5">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-medium break-all">{row.value || "—"}</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => setSelectedLog(null)}>
              {t.monitorLogs.detailsDialog.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
