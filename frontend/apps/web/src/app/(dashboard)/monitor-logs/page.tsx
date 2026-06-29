"use client"

import * as React from "react"
import { format } from "date-fns"
import { IconLoader2, IconActivity, IconLockSquare, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient } from "@/services/api-client"
import { hasScope } from "@/utils/rbac"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

const PAGE_SIZE = 20

export default function MonitorLogsPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  const canViewLogs = hasScope(tokens, "view_audit_logs")

  const [page, setPage] = React.useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => apiClient.getAuditLogs(tokens!.access_token, page, PAGE_SIZE),
    enabled: !!tokens?.access_token && !isAuthLoading && canViewLogs,
  })

  const logs = data?.items ?? []
  const total = data?.total ?? 0

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
                  <TableHead>{t.monitorLogs.columns.date}</TableHead>
                  <TableHead>{t.monitorLogs.columns.page}</TableHead>
                  <TableHead>{t.monitorLogs.columns.action}</TableHead>
                  <TableHead>{t.monitorLogs.columns.field}</TableHead>
                  <TableHead>{t.monitorLogs.columns.oldValue}</TableHead>
                  <TableHead>{t.monitorLogs.columns.newValue}</TableHead>
                  <TableHead>{t.monitorLogs.columns.user}</TableHead>
                  <TableHead>{t.monitorLogs.columns.ipAddress}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-black">
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.date), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="max-w-50 truncate" title={log.page_name ?? ""}>
                      {log.page_name}
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="max-w-50 truncate" title={log.field_type ?? ""}>
                      {log.field_type}
                    </TableCell>
                    <TableCell>{log.old_value}</TableCell>
                    <TableCell>{log.new_value}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>{log.ip_address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5">
            <span className="text-muted-foreground text-sm">{total}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <IconChevronLeft className="h-3.5 w-3.5" />
                {t.monitorLogs.prev}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-sm"
                disabled={!data?.has_more}
                onClick={() => setPage((p) => p + 1)}
              >
                {t.monitorLogs.next}
                <IconChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
