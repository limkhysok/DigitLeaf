"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  RepresentItem,
  MemberFarmerItem,
  SackRegistrationItem,
  SackRegistrationListParams,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconArrowsSort, IconCheck, IconChevronDown, IconCalendar, IconEye, IconLayoutGrid, IconLayoutList, IconLoader2, IconMoneybag, IconPencil, IconPlus, IconSearch, IconSortAscending, IconSortDescending, IconTrash, IconUser, IconUsers } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  1: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

const STATUS_FILTER_OPTIONS: { label: string; value: number | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: 0 },
  { label: "Approved", value: 1 },
  { label: "Rejected", value: 2 },
]

const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "Last 30 Days", value: "last30" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "12 Months", value: "12m" },
  { label: "All", value: "all" },
]

function getDateRange(preset: string): { date_from?: string; date_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, "yyyy-MM-dd")
  switch (preset) {
    case "today": return { date_from: fmt(today), date_to: fmt(today) }
    case "week": return { date_from: fmt(subDays(today, 6)), date_to: fmt(today) }
    case "last30": return { date_from: fmt(subDays(today, 29)), date_to: fmt(today) }
    case "3m": return { date_from: fmt(subDays(today, 89)), date_to: fmt(today) }
    case "6m": return { date_from: fmt(subDays(today, 179)), date_to: fmt(today) }
    case "12m": return { date_from: fmt(subDays(today, 364)), date_to: fmt(today) }
    default: return {}
  }
}

type SortOrder = "default" | "asc" | "desc"

function RegistrationDetail({ target }: Readonly<{ target: SackRegistrationItem }>) {
  const status = STATUS_MAP[target.status] ?? { label: String(target.status), className: "bg-gray-100 text-gray-800" }
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Status</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
      </div>
      <div className="rounded-lg border border-border divide-y divide-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUsers className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">Representative</span>
            <span className="text-xs font-medium truncate">{target.represent_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">Farmer</span>
            <span className="text-xs font-medium truncate">{target.member_farmer_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconMoneybag className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">Sack Weight</span>
            <span className="text-xs font-medium">{target.sack_in_kg} kg</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconCalendar className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">Registered At</span>
            <span className="text-xs font-medium">{new Date(target.registered_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 py-2">
          <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-muted-foreground">Registered By</span>
            <span className="text-xs font-medium">{target.dl_user_name}</span>
          </div>
        </div>
        {target.notes && (
          <div className="px-3 py-2">
            <span className="text-[10px] text-muted-foreground block mb-0.5">Notes</span>
            <span className="text-xs">{target.notes}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function filterRepresents(represents: readonly RepresentItem[], query: string): readonly RepresentItem[] {
  if (!query.trim()) return represents
  const q = query.toLowerCase()
  return represents.filter((r) => r.represent_name.toLowerCase().includes(q))
}

const SORT_CYCLE: Record<SortOrder, SortOrder> = { default: "asc", asc: "desc", desc: "default" }

function buildFetchParams(
  skip: number,
  search: string,
  statusFilter: number | null,
  sortOrder: SortOrder,
  datePreset: string
): SackRegistrationListParams {
  const params: SackRegistrationListParams = { skip, limit: 200 }
  if (search.trim()) params.search = search.trim()
  if (statusFilter !== null) params.status = statusFilter
  if (sortOrder !== "default") { params.sort_by = "sack_in_kg"; params.order = sortOrder }
  return { ...params, ...getDateRange(datePreset) }
}

// ── Sub-components ──────────────────────────────────────────────────────────

function EditDialog({
  target,
  onClose,
  onSuccess,
  accessToken,
}: {
  readonly target: SackRegistrationItem | null
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
}) {
  const [sackInKg, setSackInKg] = React.useState("1")
  const [status, setStatus] = React.useState("0")
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [farmerResults, setFarmerResults] = React.useState<MemberFarmerItem[]>([])
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [isFarmerSearching, setIsFarmerSearching] = React.useState(false)
  const farmerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (target) {
      const timer = setTimeout(() => {
        setSackInKg(String(target.sack_in_kg))
        setStatus(String(target.status))
        setNotes(target.notes ?? "")
        setFarmerQuery(target.member_farmer_name)
        setFarmerResult(null)
        setFarmerResults([])
        setFarmerOpen(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [target])

  const handleFarmerSearch = React.useCallback(async (query: string) => {
    if (!accessToken) return
    setIsFarmerSearching(true)
    try {
      const results = await apiClient.queryMemberFarmers(accessToken, query)
      setFarmerResults(results)
    } catch {
      setFarmerResults([])
    } finally {
      setIsFarmerSearching(false)
    }
  }, [accessToken])

  React.useEffect(() => {
    if (!farmerQuery.trim() || farmerResult?.name === farmerQuery) {
      const timer = setTimeout(() => setFarmerResults([]), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => handleFarmerSearch(farmerQuery), 300)
    return () => clearTimeout(timer)
  }, [farmerQuery, handleFarmerSearch, farmerResult])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (farmerRef.current && !farmerRef.current.contains(e.target as Node)) {
        setFarmerOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!accessToken || !target) return
    setIsSubmitting(true)
    try {
      await apiClient.updateSackRegistration(accessToken, target.id, {
        ...(farmerResult ? { member_farmer_identity_card: farmerResult.mf_code } : {}),
        sack_in_kg: Number(sackInKg),
        status: Number(status),
        notes: notes.trim() || undefined,
      })
      toast.success("Registration updated")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
          <DialogDescription>
            Make changes to the sack registration details here.
          </DialogDescription>
        </DialogHeader>
        {target && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Farmer Member</Label>
              <div ref={farmerRef} className="relative">
                <div className={cn(
                  "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                  farmerOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                )}>
                  {isFarmerSearching ? <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" /> : <IconSearch className="size-4 shrink-0 opacity-50" />}
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search by Name or ID Card..."
                    value={farmerQuery}
                    onFocus={() => setFarmerOpen(true)}
                    onChange={(e) => {
                      setFarmerQuery(e.target.value)
                      if (farmerResult) setFarmerResult(null)
                      setFarmerOpen(true)
                    }}
                  />
                  <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", farmerOpen && "rotate-180")} />
                </div>
                {farmerOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {!farmerQuery.trim() && <p className="py-6 text-center text-xs text-muted-foreground">Type to search farmers...</p>}
                    {farmerQuery.trim() && farmerResults.length === 0 && !isFarmerSearching && <p className="py-6 text-center text-xs text-muted-foreground">No farmers found.</p>}
                    {farmerResults.map((f) => (
                      <button
                        key={f.mf_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFarmerResult(f)
                          setFarmerQuery(f.name)
                          setFarmerOpen(false)
                        }}
                        className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        {farmerResult?.mf_id === f.mf_id && <span className="absolute left-2 flex size-4 items-center justify-center"><IconCheck className="size-3.5" /></span>}
                        <div className="flex flex-col items-start">
                          <span>{f.name}</span>
                          <span className="text-[10px] text-muted-foreground">ID: {f.mf_code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {farmerResult && !farmerOpen && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col">
                    <span className="font-medium text-green-700 dark:text-green-400">{farmerResult.name}</span>
                    <span className="text-muted-foreground">ID Card: {farmerResult.mf_code}</span>
                  </div>
                  <IconCheck className="size-3.5 text-green-500" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Sack (kg)</Label>
              <Input className="h-9 text-sm" type="number" min={1} value={sackInKg} onChange={(e) => setSackInKg(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Status</Label>
              <div className="flex gap-2">
                {Object.entries(STATUS_MAP).map(([val, { label, className }]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    className={cn(
                      "flex-1 rounded-full py-1 text-xs font-medium border transition-all",
                      status === val ? cn(className, "border-transparent") : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Notes <span className="font-normal text-muted-foreground/60">(optional)</span></Label>
              <Input className="h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-full h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
                {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  target,
  onClose,
  onSuccess,
  accessToken,
}: {
  readonly target: { readonly id: number; readonly no: number } | null
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const confirmDelete = async () => {
    if (!accessToken || !target) return
    setIsDeleting(true)
    try {
      await apiClient.deleteSackRegistration(accessToken, target.id)
      toast.success("Registration deleted")
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Registration</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete row{" "}
            <span className="font-medium text-foreground">No. {target?.no}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-full h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button type="button" onClick={confirmDelete} disabled={isDeleting} className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-600 hover:bg-red-700 text-white border-transparent">
            {isDeleting && <IconLoader2 className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ViewDialog({
  target,
  onClose,
  onEdit,
}: {
  readonly target: SackRegistrationItem | null
  readonly onClose: () => void
  readonly onEdit: (rec: SackRegistrationItem) => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registration Detail</DialogTitle>
          <DialogDescription>
            Full details for this sack registration record.
          </DialogDescription>
        </DialogHeader>
        {target && <RegistrationDetail target={target} />}
        <DialogFooter>
          <Button variant="outline" className="rounded-full h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose}>Close</Button>
          <Button
            className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
            onClick={() => { if (target) { onClose(); onEdit(target) } }}
          >
            <IconPencil className="size-3.5" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RegisterDialog({
  open,
  onClose,
  onSuccess,
  accessToken,
  represents,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess: () => void
  readonly accessToken?: string
  readonly represents: readonly RepresentItem[]
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [representId, setRepresentId] = React.useState("")
  const [representOpen, setRepresentOpen] = React.useState(false)
  const [representSearch, setRepresentSearch] = React.useState("")
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [farmerResults, setFarmerResults] = React.useState<MemberFarmerItem[]>([])
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [isFarmerSearching, setIsFarmerSearching] = React.useState(false)
  const [sackInKg, setSackInKg] = React.useState("1")
  const [registeredAt, setRegisteredAt] = React.useState<Date | null>(null)
  React.useEffect(() => {
    const timer = setTimeout(() => setRegisteredAt(new Date()), 0)
    return () => clearTimeout(timer)
  }, [])
  const [registeredAtOpen, setRegisteredAtOpen] = React.useState(false)
  const [notes, setNotes] = React.useState("")

  const representRef = React.useRef<HTMLDivElement>(null)
  const farmerRef = React.useRef<HTMLDivElement>(null)

  const filteredRepresents = React.useMemo(() => filterRepresents(represents, representSearch), [represents, representSearch])
  const selectedRepresent = represents.find((r) => String(r.represent_id) === representId)

  const handleFarmerSearch = React.useCallback(async (query: string) => {
    if (!accessToken) return
    setIsFarmerSearching(true)
    try {
      const results = await apiClient.queryMemberFarmers(accessToken, query, Number(representId) || undefined)
      setFarmerResults(results)
    } catch {
      setFarmerResults([])
    } finally {
      setIsFarmerSearching(false)
    }
  }, [accessToken, representId])

  React.useEffect(() => {
    if (farmerResult?.name === farmerQuery || (!representId && !farmerQuery.trim())) {
      const timer = setTimeout(() => setFarmerResults([]), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => handleFarmerSearch(farmerQuery), 300)
    return () => clearTimeout(timer)
  }, [farmerQuery, handleFarmerSearch, farmerResult, representId])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (representRef.current && !representRef.current.contains(e.target as Node)) {
        setRepresentOpen(false)
        setRepresentSearch(selectedRepresent?.represent_name ?? "")
      }
      if (farmerRef.current && !farmerRef.current.contains(e.target as Node)) {
        setFarmerOpen(false)
        setFarmerQuery(farmerResult?.name ?? "")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [selectedRepresent, farmerResult])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!accessToken) return
    if (!representId) { toast.error("Please select a represent"); return }
    if (!farmerResult) { toast.error("Please search and select a member farmer"); return }
    if (!registeredAt) { toast.error("Please select a date"); return }
    setIsSubmitting(true)
    try {
      await apiClient.createSackRegistration(accessToken, {
        represent_id: Number(representId),
        member_farmer_identity_card: farmerResult.mf_code,
        sack_in_kg: Number(sackInKg),
        registered_at: format(registeredAt, "yyyy-MM-dd"),
        notes: notes.trim() || undefined,
      })
      toast.success("Sack registered successfully")
      onSuccess()
      onClose()
      // reset
      setRepresentId(""); setRepresentSearch(""); setFarmerQuery(""); setFarmerResult(null); setSackInKg("1"); setNotes(""); setRegisteredAt(new Date())
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register Sack</DialogTitle>
          <DialogDescription>Fill in the details to register a new sack for a farmer.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Representative</Label>
            <div ref={representRef} className="relative">
              <div className={cn("flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30", representOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40")}>
                <IconSearch className="size-4 shrink-0 opacity-50" />
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search by Name"
                  value={representSearch}
                  onFocus={() => setRepresentOpen(true)}
                  onChange={(e) => {
                    setRepresentSearch(e.target.value)
                    if (representId) { setRepresentId("") }
                    setRepresentOpen(true)
                  }}
                />
                <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", representOpen && "rotate-180")} />
              </div>
              {representOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                  {filteredRepresents.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No results found.</p>}
                  {filteredRepresents.map((r) => (
                    <button
                      key={r.represent_id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setRepresentId(String(r.represent_id))
                        setRepresentSearch(r.represent_name)
                        setRepresentOpen(false)
                        setFarmerQuery("")
                        setFarmerResult(null)
                        setFarmerResults([])
                      }}
                      className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      {representId === String(r.represent_id) && <span className="absolute left-2 flex size-4 items-center justify-center"><IconCheck className="size-3.5" /></span>}
                      {r.represent_name}<span className="text-muted-foreground text-[13px] ml-1">({r.farmer_count} Members)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Farmer Member</Label>
            <div ref={farmerRef} className="relative">
              <div className={cn("flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30", farmerOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40")}>
                {isFarmerSearching ? <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" /> : <IconSearch className="size-4 shrink-0 opacity-50" />}
                <input
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder="Search by Name/ID Card"
                  value={farmerQuery}
                  onFocus={() => { setFarmerOpen(true); if (representId && !farmerResult) handleFarmerSearch(farmerQuery) }}
                  onChange={(e) => {
                    setFarmerQuery(e.target.value)
                    if (farmerResult) { setFarmerResult(null) }
                    setFarmerOpen(true)
                  }}
                />
                <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", farmerOpen && "rotate-180")} />
              </div>
              {farmerOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                  {isFarmerSearching && farmerResults.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Searching...</p>}
                  {!isFarmerSearching && farmerResults.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">{representId ? "No farmers found." : "Select a representative first."}</p>}
                  {farmerResults.map((f) => (
                    <button
                      key={f.mf_id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setFarmerResult(f); setFarmerQuery(f.name); setFarmerOpen(false) }}
                      className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      {farmerResult?.mf_id === f.mf_id && <span className="absolute left-2 flex size-4 items-center justify-center"><IconCheck className="size-3.5" /></span>}
                      <div className="flex flex-col items-start"><span>{f.name}</span><span className="text-[10px] text-muted-foreground">ID: {f.mf_code}</span></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {farmerResult && !farmerOpen && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex flex-col"><span className="font-medium text-green-700 dark:text-green-400">{farmerResult.name}</span><span className="text-muted-foreground">ID Card: {farmerResult.mf_code}</span></div>
                <IconCheck className="size-3.5 text-green-500" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Registration Date</Label>
            <Popover open={registeredAtOpen} onOpenChange={setRegisteredAtOpen}>
              <PopoverTrigger asChild>
                <button type="button" className={cn("flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 text-sm transition-all duration-200 dark:bg-input/30", registeredAtOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40")}>
                  <IconCalendar className="size-4 shrink-0 opacity-50" />
                  <span className="flex-1 text-left">{registeredAt ? format(registeredAt, "PPP") : "Select date..."}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={registeredAt ?? undefined} onSelect={(date) => { if (date) { setRegisteredAt(date); setRegisteredAtOpen(false) } }} autoFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Sack (kg)</Label>
            <Input className="h-9 text-sm" type="number" min={1} value={sackInKg} onChange={(e) => setSackInKg(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Notes <span className="font-normal text-muted-foreground/60">(optional)</span></Label>
            <Input className="h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full h-8 px-4 text-xs capitalize tracking-wide" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
              {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function SackRegistrationPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()

  // ── Data ────────────────────────────────────────────────────────────────────
  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [skip, setSkip] = React.useState(0)
  const [refetchKey, setRefetchKey] = React.useState(0)
  const refetch = React.useCallback(() => setRefetchKey((k) => k + 1), [])
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<number | null>(null)
  const [statusFilterOpen, setStatusFilterOpen] = React.useState(false)
  const [datePreset, setDatePreset] = React.useState("last30")
  const [datePresetOpen, setDatePresetOpen] = React.useState(false)
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("default")

  const [view, setView] = React.useState<"list" | "grid">("list")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [viewTarget, setViewTarget] = React.useState<SackRegistrationItem | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)

  // ── Search debounce ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // ── Fetch represents once ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => {})
  }, [isAuthLoading, tokens])

  // ── Fetch records (reset on filter/refetch change) ────────────────────────
  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let cancelled = false
    const timer = setTimeout(() => setIsLoading(true), 0)

    const params = buildFetchParams(0, search, statusFilter, sortOrder, datePreset)

    apiClient.getSackRegistrations(tokens.access_token, params)
      .then((res) => {
        if (cancelled) return
        setRecords(res.items)
        setHasMore(res.has_more)
        setSkip(res.items.length)
      })
      .catch((err) => { if (!cancelled) toast.error((err as Error).message) })
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true; clearTimeout(timer) }
  }, [isAuthLoading, tokens, search, statusFilter, sortOrder, datePreset, refetchKey])

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (!tokens?.access_token || !hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    const currentSkip = skip
    const params = buildFetchParams(currentSkip, search, statusFilter, sortOrder, datePreset)
    try {
      const res = await apiClient.getSackRegistrations(tokens.access_token, params)
      setRecords((prev) => [...prev, ...res.items])
      setHasMore(res.has_more)
      setSkip(currentSkip + res.items.length)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoadingMore(false)
    }
  }, [tokens, hasMore, isLoadingMore, isLoading, skip, search, statusFilter, sortOrder, datePreset])

  // ── IntersectionObserver ──────────────────────────────────────────────────
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) loadMore() },
      { rootMargin: "100px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const cycleSortOrder = () => setSortOrder((prev) => SORT_CYCLE[prev])

  if (!mounted) return null

  const SORT_CONFIG: Record<"default" | "asc" | "desc", { icon: typeof IconArrowsSort; label: string }> = {
    default: { icon: IconArrowsSort, label: "Newest First" },
    asc: { icon: IconSortAscending, label: "Sack kg ↑" },
    desc: { icon: IconSortDescending, label: "Sack kg ↓" },
  }
  const { icon: SortIcon, label: sortLabel } = SORT_CONFIG[sortOrder]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">Sack Registration</h1>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">Register and manage sacks.</p>
        </div>
        <Button
          onClick={() => setRegisterOpen(true)}
          className="shrink-0 rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          <span className="hidden sm:inline">New</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status dropdown */}
        <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
              statusFilter === null
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                : cn(STATUS_MAP[statusFilter]?.className, "border-transparent font-medium")
            )}>
              {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? "All"}
              <IconChevronDown className={cn("size-3.5 transition-transform duration-200", statusFilterOpen && "rotate-180")} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="start">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => { setStatusFilter(opt.value); setStatusFilterOpen(false) }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                  statusFilter === opt.value && "font-medium bg-accent"
                )}
              >
                {opt.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Date preset */}
        <Popover open={datePresetOpen} onOpenChange={setDatePresetOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
              datePreset === "last30" ? "text-muted-foreground hover:text-foreground hover:bg-muted/30" : "font-medium text-foreground bg-muted/50"
            )}>
              <IconCalendar className="size-3.5" />
              {DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? "Last 30 Days"}
              <IconChevronDown className={cn("size-3.5 transition-transform duration-200", datePresetOpen && "rotate-180")} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1" align="start">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setDatePreset(p.value); setDatePresetOpen(false) }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-accent",
                  datePreset === p.value && "font-medium bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <button
          onClick={cycleSortOrder}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs transition-colors",
            sortOrder === "default" ? "text-muted-foreground hover:text-foreground hover:bg-muted/30" : "font-medium text-foreground bg-muted/50"
          )}
        >
          <SortIcon className="size-3.5" />
          {sortLabel}
        </button>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative flex items-center h-8 min-w-40 max-w-xs rounded-full border border-border bg-muted/30 px-3 gap-2 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
          <IconSearch className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button onClick={() => setSearchInput("")} className="text-muted-foreground hover:text-foreground text-xs leading-none">✕</button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-full border border-border p-0.5 gap-0.5">
          <button
            onClick={() => setView("list")}
            className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "list" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <IconLayoutList className="size-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn("flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200", view === "grid" ? "bg-[#009640] text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && records.length === 0 && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No registrations found.
        </div>
      )}

      {/* List View */}
      {!isLoading && records.length > 0 && view === "list" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Represent</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered At</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => {
                    const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
                    return (
                      <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">{rec.represent_name}</td>
                        <td className="px-4 py-3">{rec.member_farmer_name}</td>
                        <td className="px-4 py-3">{rec.sack_in_kg}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{rec.dl_user_name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(rec.registered_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewTarget(rec)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditTarget(rec)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconPencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                              className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && records.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {records.map((rec, idx) => {
            const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
            return (
              <div
                key={rec.id}
                className="group relative flex flex-col gap-2 rounded-sm border border-border bg-card px-3 py-2.5 transition-all duration-200 hover:shadow-sm hover:border-border/80"
              >
                {/* Top row: index + status */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-muted-foreground/60">No. {idx + 1}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {/* Farmer + Represent */}
                <div className="flex flex-col min-w-0 -mt-0.5">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-[13px] text-muted-foreground shrink-0">Farmer:</span>
                    <span className="text-sm font-semibold truncate leading-tight">{rec.member_farmer_name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="text-[13px] text-muted-foreground shrink-0">Representative:</span>
                    <span className="text-[13px] text-muted-foreground truncate">{rec.represent_name}</span>
                  </div>
                </div>

                {/* Footer: kg · date · actions */}
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <IconMoneybag className="h-3 w-3 text-muted-foreground" />
                      {rec.sack_in_kg} kg
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <IconCalendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(rec.registered_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="relative z-1 flex items-center gap-0.5">
                    <button
                      onClick={() => setEditTarget(rec)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <IconPencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                      className="p-1 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Overlay — last in DOM so it's above non-positioned content, below z-[1] action buttons */}
                <button
                  onClick={() => setViewTarget(rec)}
                  className="absolute inset-0 rounded-sm cursor-pointer focus:outline-none"
                  aria-label={`View detail for ${rec.member_farmer_name}`}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <EditDialog target={editTarget} onClose={() => setEditTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} onSuccess={refetch} accessToken={tokens?.access_token} />
      <ViewDialog target={viewTarget} onClose={() => setViewTarget(null)} onEdit={setEditTarget} />
      <RegisterDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onSuccess={refetch} accessToken={tokens?.access_token} represents={represents} />
    </div>
  )
}
