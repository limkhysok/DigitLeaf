"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  RepresentItem,
  MemberFarmerItem,
  SackRegistrationItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconCheck, IconChevronDown, IconCalendar, IconLoader2, IconPencil, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
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
} from "@workspace/ui/components/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { format } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  1: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

export default function SackRegistrationPage() {
  const { tokens, isLoading: isAuthLoading } = useAuth()

  const [records, setRecords] = React.useState<SackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; code: string; no: number } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<SackRegistrationItem | null>(null)
  const [editSackInKg, setEditSackInKg] = React.useState("1")
  const [editStatus, setEditStatus] = React.useState("0")
  const [editNotes, setEditNotes] = React.useState("")
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)
  const [editFarmerQuery, setEditFarmerQuery] = React.useState("")
  const [editFarmerResults, setEditFarmerResults] = React.useState<MemberFarmerItem[]>([])
  const [editFarmerResult, setEditFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [editFarmerOpen, setEditFarmerOpen] = React.useState(false)
  const [isEditFarmerSearching, setIsEditFarmerSearching] = React.useState(false)
  const editFarmerRef = React.useRef<HTMLDivElement>(null)

  const representRef = React.useRef<HTMLDivElement>(null)
  const farmerRef = React.useRef<HTMLDivElement>(null)

  // form state
  const [representId, setRepresentId] = React.useState("")
  const [representOpen, setRepresentOpen] = React.useState(false)
  const [representSearch, setRepresentSearch] = React.useState("")

  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [farmerResults, setFarmerResults] = React.useState<MemberFarmerItem[]>([])
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [isFarmerSearching, setIsFarmerSearching] = React.useState(false)

  const [sackInKg, setSackInKg] = React.useState("1")
  const [registeredAt, setRegisteredAt] = React.useState<Date>(new Date())
  const [registeredAtOpen, setRegisteredAtOpen] = React.useState(false)
  const [notes, setNotes] = React.useState("")

  const filteredRepresents = React.useMemo(
    () =>
      representSearch.trim()
        ? represents.filter((r) =>
          r.represent_name.toLowerCase().includes(representSearch.toLowerCase())
        )
        : represents,
    [represents, representSearch]
  )

  const selectedRepresent = represents.find((r) => String(r.represent_id) === representId)

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const data = await apiClient.getSackRegistrations(tokens.access_token)
      setRecords(data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return

    const init = async () => {
      // Parallel fetch for initial load
      try {
        const [repsData] = await Promise.all([
          apiClient.getRepresents(tokens.access_token),
          fetchRecords()
        ])
        setRepresents(repsData)
      } catch {
        // fetchRecords already handles its errors
      }
    }

    init()
  }, [isAuthLoading, tokens, fetchRecords])

  // Use a ref to keep the click-handler stable and avoid hook dependency size errors
  const selectedRef = React.useRef(selectedRepresent)
  React.useEffect(() => {
    selectedRef.current = selectedRepresent
  }, [selectedRepresent])

  const farmerResultRef = React.useRef(farmerResult)
  React.useEffect(() => {
    farmerResultRef.current = farmerResult
  }, [farmerResult])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Represent click outside
      if (representRef.current && !representRef.current.contains(e.target as Node)) {
        setRepresentOpen(false)
        if (selectedRef.current) {
          setRepresentSearch(selectedRef.current.represent_name)
        } else {
          setRepresentSearch("")
        }
      }
      // Farmer click outside
      if (farmerRef.current && !farmerRef.current.contains(e.target as Node)) {
        setFarmerOpen(false)
        if (farmerResultRef.current) {
          setFarmerQuery(farmerResultRef.current.name)
        } else {
          setFarmerQuery("")
        }
      }
      // Edit farmer click outside
      if (editFarmerRef.current && !editFarmerRef.current.contains(e.target as Node)) {
        setEditFarmerOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleFarmerSearch = React.useCallback(async (query: string) => {
    if (!tokens?.access_token || !query.trim()) {
      setFarmerResults([])
      return
    }
    setIsFarmerSearching(true)
    try {
      const results = await apiClient.queryMemberFarmers(tokens.access_token, query)
      setFarmerResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsFarmerSearching(false)
    }
  }, [tokens])

  // Debounce farmer search
  React.useEffect(() => {
    // If query is empty or matches current selection, ensure results are cleared
    if (!farmerQuery.trim() || farmerResult?.name === farmerQuery) {
      // Use a timeout to avoid synchronous setState warning
      const timer = setTimeout(() => {
        setFarmerResults([])
      }, 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      handleFarmerSearch(farmerQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [farmerQuery, handleFarmerSearch, farmerResult])

  const handleEditFarmerSearch = React.useCallback(async (query: string) => {
    if (!tokens?.access_token || !query.trim()) {
      setEditFarmerResults([])
      return
    }
    setIsEditFarmerSearching(true)
    try {
      const results = await apiClient.queryMemberFarmers(tokens.access_token, query)
      setEditFarmerResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setIsEditFarmerSearching(false)
    }
  }, [tokens])

  // Debounce edit farmer search
  React.useEffect(() => {
    if (!editFarmerQuery.trim() || editFarmerResult?.name === editFarmerQuery) {
      const timer = setTimeout(() => setEditFarmerResults([]), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => handleEditFarmerSearch(editFarmerQuery), 300)
    return () => clearTimeout(timer)
  }, [editFarmerQuery, handleEditFarmerSearch, editFarmerResult])

  const resetForm = () => {
    setRepresentId("")
    setRepresentOpen(false)
    setRepresentSearch("")
    setFarmerQuery("")
    setFarmerResults([])
    setFarmerResult(null)
    setFarmerOpen(false)
    setSackInKg("1")
    setRegisteredAt(new Date())
    setNotes("")
  }

  const closeDialog = () => {
    setDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!tokens?.access_token) return
    if (!representId) { toast.error("Please select a represent"); return }
    if (!farmerResult) { toast.error("Please search and select a member farmer"); return }

    setIsSubmitting(true)
    try {
      await apiClient.createSackRegistration(tokens.access_token, {
        represent_id: Number(representId),
        member_farmer_identity_card: farmerResult.mf_code,
        sack_in_kg: Number(sackInKg),
        registered_at: format(registeredAt, "yyyy-MM-dd"),
        notes: notes.trim() || undefined,
      })
      toast.success("Sack registered successfully")
      closeDialog()
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (rec: SackRegistrationItem) => {
    setEditTarget(rec)
    setEditSackInKg(String(rec.sack_in_kg))
    setEditStatus(String(rec.status))
    setEditNotes(rec.notes ?? "")
    setEditFarmerQuery(rec.member_farmer_name)
    setEditFarmerResult(null)
    setEditFarmerResults([])
    setEditFarmerOpen(false)
  }

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!tokens?.access_token || !editTarget) return
    setIsEditSubmitting(true)
    try {
      await apiClient.updateSackRegistration(tokens.access_token, editTarget.id, {
        ...(editFarmerResult ? { member_farmer_identity_card: editFarmerResult.mf_code } : {}),
        sack_in_kg: Number(editSackInKg),
        status: Number(editStatus),
        notes: editNotes.trim() || undefined,
      })
      toast.success("Registration updated")
      setEditTarget(null)
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!tokens?.access_token || !deleteTarget) return
    setIsDeleting(true)
    try {
      await apiClient.deleteSackRegistration(tokens.access_token, deleteTarget.id)
      toast.success("Registration deleted")
      setDeleteTarget(null)
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl text-foreground">Sack Registration</h1>
          <p className="text-xs text-muted-foreground tracking-wide">Register and manage sacks.</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          New Registration
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && records.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No registrations yet.
            </div>
          )}
          {!isLoading && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack Code</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Represent</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID Card</th>
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
                        <td className="px-4 py-3 font-mono text-xs">{rec.sack_code}</td>
                        <td className="px-4 py-3">{rec.represent_name}</td>
                        <td className="px-4 py-3">{rec.member_farmer_name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{rec.member_farmer_identity_card}</td>
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
                              onClick={() => openEditDialog(rec)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <IconPencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: rec.id, code: rec.sack_code, no: idx + 1 })}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                <p className="text-muted-foreground">Sack Code: <span className="font-mono text-foreground">{editTarget.sack_code}</span></p>
              </div>

              {/* Member Farmer */}
              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Member Farmer</Label>
                <div ref={editFarmerRef} className="relative">
                  <div className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                    editFarmerOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                  )}>
                    {isEditFarmerSearching
                      ? <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" />
                      : <IconSearch className="size-4 shrink-0 opacity-50" />
                    }
                    <input
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search by Name or ID Card..."
                      value={editFarmerQuery}
                      onFocus={() => setEditFarmerOpen(true)}
                      onChange={(e) => {
                        setEditFarmerQuery(e.target.value)
                        if (editFarmerResult) setEditFarmerResult(null)
                        setEditFarmerOpen(true)
                      }}
                    />
                    <IconChevronDown className={cn(
                      "size-4 shrink-0 opacity-50 transition-transform duration-200",
                      editFarmerOpen && "rotate-180"
                    )} />
                  </div>
                  {editFarmerOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                      {!editFarmerQuery.trim() && (
                        <p className="py-6 text-center text-xs text-muted-foreground">Type to search farmers...</p>
                      )}
                      {editFarmerQuery.trim() && editFarmerResults.length === 0 && !isEditFarmerSearching && (
                        <p className="py-6 text-center text-xs text-muted-foreground">No farmers found.</p>
                      )}
                      {editFarmerQuery.trim() && isEditFarmerSearching && editFarmerResults.length === 0 && (
                        <p className="py-6 text-center text-xs text-muted-foreground">Searching...</p>
                      )}
                      {editFarmerResults.map((f) => (
                        <button
                          key={f.mf_id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setEditFarmerResult(f)
                            setEditFarmerQuery(f.name)
                            setEditFarmerOpen(false)
                          }}
                          className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                        >
                          {editFarmerResult?.mf_id === f.mf_id && (
                            <span className="absolute left-2 flex size-4 items-center justify-center">
                              <IconCheck className="size-3.5" />
                            </span>
                          )}
                          <div className="flex flex-col items-start">
                            <span>{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">ID: {f.mf_code}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {editFarmerResult && !editFarmerOpen && (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-col">
                      <span className="font-medium text-green-700 dark:text-green-400">{editFarmerResult.name}</span>
                      <span className="text-muted-foreground">ID Card: {editFarmerResult.mf_code}</span>
                    </div>
                    <IconCheck className="size-3.5 text-green-500" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Sack (kg)</Label>
                <Input
                  className="h-9 text-sm"
                  type="number"
                  min={1}
                  value={editSackInKg}
                  onChange={(e) => setEditSackInKg(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Status</Label>
                <div className="flex gap-2">
                  {Object.entries(STATUS_MAP).map(([val, { label, className }]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditStatus(val)}
                      className={cn(
                        "flex-1 rounded-full py-1 text-xs font-medium border transition-all",
                        editStatus === val
                          ? cn(className, "border-transparent")
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                  Notes <span className="font-normal text-muted-foreground/60">(optional)</span>
                </Label>
                <Input
                  className="h-9 text-sm"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
                  onClick={() => setEditTarget(null)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
                >
                  {isEditSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Registration</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete row{" "}
            <span className="font-medium text-foreground">No. {deleteTarget?.no}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              {isDeleting && <IconLoader2 className="size-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Sack</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Represent — Unified Search Input */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Representative
              </Label>
              <div ref={representRef} className="relative">
                <div className={cn(
                  "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                  representOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                )}>
                  <IconSearch className="size-4 shrink-0 opacity-50" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search/Select Representative..."
                    value={representSearch}
                    onFocus={() => setRepresentOpen(true)}
                    onChange={(e) => {
                      setRepresentSearch(e.target.value)
                      if (representId) setRepresentId("") // Clear selection if typing
                      setRepresentOpen(true)
                    }}
                  />
                  <IconChevronDown className={cn(
                    "size-4 shrink-0 opacity-50 transition-transform duration-200",
                    representOpen && "rotate-180"
                  )} />
                </div>

                {representOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {filteredRepresents.length === 0 && (
                      <p className="py-6 text-center text-xs text-muted-foreground">No results found.</p>
                    )}
                    {filteredRepresents.map((r) => (
                      <button
                        key={r.represent_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setRepresentId(String(r.represent_id))
                          setRepresentSearch(r.represent_name)
                          setRepresentOpen(false)
                        }}
                        className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        {representId === String(r.represent_id) && (
                          <span className="absolute left-2 flex size-4 items-center justify-center">
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
                        {r.represent_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Member Farmer — Unified Search Input */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Member Farmer
              </Label>
              <div ref={farmerRef} className="relative">
                <div className={cn(
                  "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                  farmerOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                )}>
                  {isFarmerSearching ? (
                    <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" />
                  ) : (
                    <IconSearch className="size-4 shrink-0 opacity-50" />
                  )}
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search by Name/ID Card..."
                    value={farmerQuery}
                    onFocus={() => setFarmerOpen(true)}
                    onChange={(e) => {
                      setFarmerQuery(e.target.value)
                      if (farmerResult) setFarmerResult(null)
                      setFarmerOpen(true)
                    }}
                  />
                  <IconChevronDown className={cn(
                    "size-4 shrink-0 opacity-50 transition-transform duration-200",
                    farmerOpen && "rotate-180"
                  )} />
                </div>

                {farmerOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {!farmerQuery.trim() && (
                      <p className="py-6 text-center text-xs text-muted-foreground">Type to search farmers...</p>
                    )}
                    {farmerQuery.trim() && farmerResults.length === 0 && !isFarmerSearching && (
                      <p className="py-6 text-center text-xs text-muted-foreground">No farmers found.</p>
                    )}
                    {farmerQuery.trim() && isFarmerSearching && farmerResults.length === 0 && (
                      <p className="py-6 text-center text-xs text-muted-foreground">Searching...</p>
                    )}
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
                        {farmerResult?.mf_id === f.mf_id && (
                          <span className="absolute left-2 flex size-4 items-center justify-center">
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
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

            {/* Registered At */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Registration Date
              </Label>
              <Popover open={registeredAtOpen} onOpenChange={setRegisteredAtOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 text-sm transition-all duration-200 dark:bg-input/30",
                      registeredAtOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                    )}
                  >
                    <IconCalendar className="size-4 shrink-0 opacity-50" />
                    <span className="flex-1 text-left">{format(registeredAt, "PPP")}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={registeredAt}
                    onSelect={(date) => {
                      if (date) { setRegisteredAt(date); setRegisteredAtOpen(false) }
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Sack in KG */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Sack (kg)
              </Label>
              <Input
                className="h-9 text-sm"
                type="number"
                min={1}
                value={sackInKg}
                onChange={(e) => setSackInKg(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Notes{" "}
                <span className="font-normal text-muted-foreground/60">(optional)</span>
              </Label>
              <Input
                className="h-9 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
              >
                {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                Register
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
