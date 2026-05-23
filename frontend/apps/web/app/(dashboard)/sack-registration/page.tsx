"use client"

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
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "./_components/data-table"
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

  if (!mounted) return null

  const columns = getColumns({
    t,
    localizeNumber,
    localizeDateString,
    total,
    onView: setViewTarget,
    onEdit: setEditTarget,
    onDelete: (rec, index) => setDeleteTarget({ id: rec.id, no: index })
  })

  return (
    <div className="flex flex-col gap-4">

      {/* ════════════════════════════════════════════════════════════════════
          HEADER — shared across all breakpoints
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="scroll-m-24 text-4xl font-semibold tracking-tight sm:text-2xl">{t.sackRegistration.title}</h1>
          <p className="text-[1.05rem] text-muted-foreground sm:text-base sm:text-balance md:max-w-[100%]">
            {t.sackRegistration.subtitle}
          </p>
        </div>
        <Button size="icon" onClick={() => setRegisterOpen(true)} className="shrink-0 lg:hidden">
          <IconPlus stroke={2} />
        </Button>
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
          MOBILE CONTENT — (< 768px / below md)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="grid md:hidden grid-cols-1 gap-3">
          {records.map((rec, idx) => (
            <SackRegistrationCard
              key={rec.id}
              rec={rec}
              index={total - idx - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
            />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TABLET CONTENT — (768px – 1023px / md → lg)
      ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && records.length > 0 && (
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
          {records.map((rec, idx) => (
            <SackRegistrationCard
              key={rec.id}
              rec={rec}
              index={total - idx - 1}
              onView={setViewTarget}
              onEdit={setEditTarget}
              onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
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
            <Card>
              <CardContent className="p-4 pt-4">
                <DataTable 
                  columns={columns} 
                  data={records} 
                  noRecordsText={t.sackRegistration.table.noRecords}
                  action={
                    <Button size="sm" onClick={() => setRegisterOpen(true)} className="h-8 gap-1.5">
                      <IconPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.sackRegistration.filters.add}</span>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
              {records.map((rec, idx) => (
                <SackRegistrationCard
                  key={rec.id}
                  rec={rec}
                  index={total - idx - 1}
                  onView={setViewTarget}
                  onEdit={setEditTarget}
                  onDelete={(rec) => setDeleteTarget({ id: rec.id, no: total - idx })}
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
