"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  FarmerSearchItem,
  SackRegistrationBriefItem,
  TobaccoItem,
  WeighLeafItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconCheck, IconChevronDown, IconLoader2, IconPencil, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
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
import { cn } from "@workspace/ui/lib/utils"

function isOutside(ref: React.RefObject<HTMLElement | null>, target: EventTarget | null) {
  return ref.current !== null && !ref.current.contains(target as Node)
}

function computeWeight(totalInKg: string, remork: string, sackInKg: number): number | null {
  if (!totalInKg || remork === "") return null
  return Number(totalInKg) - Number(remork) - sackInKg
}

export default function LeafPage() {
  const { tokens, isLoading: isAuthLoading } = useAuth()

  const [records, setRecords] = React.useState<WeighLeafItem[]>([])
  const [leafTypes, setLeafTypes] = React.useState<TobaccoItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; no: number } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Edit state
  const [editTarget, setEditTarget] = React.useState<WeighLeafItem | null>(null)
  const [editLeafTypeId, setEditLeafTypeId] = React.useState("")
  const [editTotalInKg, setEditTotalInKg] = React.useState("")
  const [editRemork, setEditRemork] = React.useState("")
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false)

  // Form: farmer search
  const userRef = React.useRef<HTMLDivElement>(null)
  const [userQuery, setUserQuery] = React.useState("")
  const [userResults, setUserResults] = React.useState<FarmerSearchItem[]>([])
  const [selectedUser, setSelectedUser] = React.useState<FarmerSearchItem | null>(null)
  const [userOpen, setUserOpen] = React.useState(false)
  const [isUserSearching, setIsUserSearching] = React.useState(false)

  // Form: sack selection
  const sackRef = React.useRef<HTMLDivElement>(null)
  const [sacks, setSacks] = React.useState<SackRegistrationBriefItem[]>([])
  const [selectedSack, setSelectedSack] = React.useState<SackRegistrationBriefItem | null>(null)
  const [sackOpen, setSackOpen] = React.useState(false)
  const [isSacksLoading, setIsSacksLoading] = React.useState(false)

  // Form: leaf type
  const leafTypeRef = React.useRef<HTMLDivElement>(null)
  const [leafTypeId, setLeafTypeId] = React.useState("")
  const [leafTypeOpen, setLeafTypeOpen] = React.useState(false)

  // Form: numeric fields
  const [totalInKg, setTotalInKg] = React.useState("")
  const [remork, setRemork] = React.useState("")

  const selectedLeafType = leafTypes.find((t) => String(t.t_id) === leafTypeId)
  const sackActiveClass = sackOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
  const calcTotalWeight = selectedSack
    ? computeWeight(totalInKg, remork, selectedSack.sack_in_kg)
    : null
  const editCalcTotalWeight = editTarget
    ? computeWeight(editTotalInKg, editRemork, editTarget.sack_in_kg)
    : null

  // Stable refs for click-outside
  const selectedUserRef = React.useRef(selectedUser)
  React.useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isOutside(userRef, e.target)) {
        setUserOpen(false)
        if (!selectedUserRef.current) setUserQuery("")
      }
      if (isOutside(sackRef, e.target)) setSackOpen(false)
      if (isOutside(leafTypeRef, e.target)) setLeafTypeOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const data = await apiClient.getWeighLeaves(tokens.access_token)
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
      try {
        const [types] = await Promise.all([
          apiClient.getLeafTypes(tokens.access_token),
          fetchRecords(),
        ])
        setLeafTypes(types)
      } catch { /* fetchRecords handles its own errors */ }
    }
    init()
  }, [isAuthLoading, tokens, fetchRecords])

  // Debounce user search
  React.useEffect(() => {
    if (!userQuery.trim() || selectedUser?.name === userQuery || !tokens?.access_token) {
      const t = setTimeout(() => setUserResults([]), 0)
      return () => clearTimeout(t)
    }
    const token = tokens.access_token
    const t = setTimeout(async () => {
      setIsUserSearching(true)
      try {
        const results = await apiClient.searchWeighLeafFarmers(token, userQuery)
        setUserResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setIsUserSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [userQuery, tokens, selectedUser])

  const handleSelectUser = async (user: FarmerSearchItem) => {
    setSelectedUser(user)
    setUserQuery(user.name)
    setUserOpen(false)
    setSelectedSack(null)
    setSacks([])
    if (!tokens?.access_token) return
    setIsSacksLoading(true)
    try {
      const data = await apiClient.getSacksByFarmer(tokens.access_token, user.mf_id)
      setSacks(data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSacksLoading(false)
    }
  }

  const resetForm = () => {
    setUserQuery(""); setUserResults([]); setSelectedUser(null); setUserOpen(false)
    setSacks([]); setSelectedSack(null); setSackOpen(false)
    setLeafTypeId(""); setLeafTypeOpen(false)
    setTotalInKg(""); setRemork("")
  }

  const closeDialog = () => { setDialogOpen(false); resetForm() }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!tokens?.access_token) return
    if (!selectedSack) { toast.error("Please select a sack registration"); return }
    if (!leafTypeId) { toast.error("Please select a leaf type"); return }
    setIsSubmitting(true)
    try {
      await apiClient.createWeighLeaf(tokens.access_token, {
        sack_registration_id: selectedSack.id,
        leaf_type_id: Number(leafTypeId),
        total_in_kg: Number(totalInKg),
        remork: Number(remork),
      })
      toast.success("Leaf sack recorded successfully")
      closeDialog()
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!tokens?.access_token || !deleteTarget) return
    setIsDeleting(true)
    try {
      await apiClient.deleteWeighLeaf(tokens.access_token, deleteTarget.id)
      toast.success("Record deleted")
      setDeleteTarget(null)
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (rec: WeighLeafItem) => {
    setEditTarget(rec)
    setEditLeafTypeId(String(rec.leaf_type_id))
    setEditTotalInKg(String(rec.total_in_kg))
    setEditRemork(String(rec.remork))
  }

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!tokens?.access_token || !editTarget) return
    setIsEditSubmitting(true)
    try {
      await apiClient.updateWeighLeaf(tokens.access_token, editTarget.id, {
        leaf_type_id: Number(editLeafTypeId),
        total_in_kg: Number(editTotalInKg),
        remork: Number(editRemork),
      })
      toast.success("Record updated")
      setEditTarget(null)
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsEditSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl text-foreground">Leaf</h1>
          <p className="text-xs text-muted-foreground tracking-wide">Weigh and record leaf sacks.</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent"
        >
          <IconPlus className="size-3.5" />
          Add Leaf Sack
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
              No records yet.
            </div>
          )}
          {!isLoading && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">No.</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack #</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Leaf Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remork (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total Weight (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recorded By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">#{rec.sack_registration_id}</td>
                      <td className="px-4 py-3">{rec.user_name}</td>
                      <td className="px-4 py-3">{rec.leaf_type_name}</td>
                      <td className="px-4 py-3">{rec.total_in_kg}</td>
                      <td className="px-4 py-3">{rec.sack_in_kg}</td>
                      <td className="px-4 py-3">{rec.remork}</td>
                      <td className="px-4 py-3">{rec.total_weight_in_kg}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{rec.dl_user_name}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditDialog(rec)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <IconPencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: rec.id, no: idx + 1 })}
                            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Leaf Record</DialogTitle></DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs space-y-0.5">
                <p className="text-muted-foreground">Sack: <span className="font-mono text-foreground">#{editTarget.sack_registration_id}</span></p>
                <p className="text-muted-foreground">User: <span className="text-foreground">{editTarget.user_name}</span></p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Leaf Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 text-sm outline-none"
                  value={editLeafTypeId}
                  onChange={(e) => setEditLeafTypeId(e.target.value)}
                  required
                >
                  <option value="">Select leaf type...</option>
                  {leafTypes.map((t) => (
                    <option key={t.t_id} value={t.t_id}>{t.t_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total (kg)</Label>
                <Input className="h-9 text-sm" type="number" min={0} step="0.01" value={editTotalInKg}
                  onChange={(e) => setEditTotalInKg(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Remork</Label>
                <Input className="h-9 text-sm" type="number" min={0} step="1" value={editRemork}
                  onChange={(e) => setEditRemork(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total Weight (kg)</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                  {editCalcTotalWeight ?? "—"}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline"
                  className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
                  onClick={() => setEditTarget(null)} disabled={isEditSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isEditSubmitting}
                  className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
                  {isEditSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Record</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete row{" "}
            <span className="font-medium text-foreground">No. {deleteTarget?.no}</span>?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline"
              className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
              onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
            <Button type="button" onClick={confirmDelete} disabled={isDeleting}
              className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-red-600 hover:bg-red-700 text-white border-transparent">
              {isDeleting && <IconLoader2 className="size-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Leaf Sack Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Leaf Sack</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Farmer search */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Farmer</Label>
              <div ref={userRef} className="relative">
                <div className={cn(
                  "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                  userOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                )}>
                  {isUserSearching
                    ? <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" />
                    : <IconSearch className="size-4 shrink-0 opacity-50" />}
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search by farmer name or code..."
                    value={userQuery}
                    onFocus={() => setUserOpen(true)}
                    onChange={(e) => {
                      setUserQuery(e.target.value)
                      if (selectedUser) { setSelectedUser(null); setSacks([]); setSelectedSack(null) }
                      setUserOpen(true)
                    }}
                  />
                  <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", userOpen && "rotate-180")} />
                </div>
                {userOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {!userQuery.trim() && <p className="py-6 text-center text-xs text-muted-foreground">Type to search farmers...</p>}
                    {userQuery.trim() && userResults.length === 0 && !isUserSearching && <p className="py-6 text-center text-xs text-muted-foreground">No farmers found.</p>}
                    {userQuery.trim() && isUserSearching && <p className="py-6 text-center text-xs text-muted-foreground">Searching...</p>}
                    {userResults.map((u) => (
                      <button key={u.mf_id} type="button" onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectUser(u)}
                        className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                        {selectedUser?.mf_id === u.mf_id && (
                          <span className="absolute left-2 flex size-4 items-center justify-center">
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
                        <div className="flex flex-col items-start">
                          <span>{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">{u.mf_code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sack selection */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Sack Registration</Label>
              <div ref={sackRef} className="relative">
                <button
                  type="button"
                  disabled={!selectedUser}
                  onClick={() => setSackOpen((o) => !o)}
                  className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                    selectedUser ? sackActiveClass : "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSacksLoading
                    ? <IconLoader2 className="size-4 shrink-0 animate-spin opacity-50" />
                    : <IconSearch className="size-4 shrink-0 opacity-50" />}
                  <span className={cn("flex-1 text-sm", !selectedSack && "text-muted-foreground")}>
                    {selectedSack ? `Sack #${selectedSack.id}` : "Select sack..."}
                  </span>
                  <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", sackOpen && "rotate-180")} />
                </button>
                {sackOpen && selectedUser && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {sacks.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No sack registrations found.</p>}
                    {sacks.map((s) => (
                      <button key={s.id} type="button" onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSelectedSack(s); setSackOpen(false) }}
                        className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                        {selectedSack?.id === s.id && (
                          <span className="absolute left-2 flex size-4 items-center justify-center">
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="font-mono">Sack #{s.id}</span>
                          <span className="text-[10px] text-muted-foreground">{s.sack_in_kg} kg</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSack && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex flex-col">
                    <span className="font-mono font-medium text-green-700 dark:text-green-400">Sack #{selectedSack.id}</span>
                    <span className="text-muted-foreground">Sack weight: {selectedSack.sack_in_kg} kg</span>
                  </div>
                  <IconCheck className="size-3.5 text-green-500" />
                </div>
              )}
            </div>

            {/* Leaf Type */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Leaf Type</Label>
              <div ref={leafTypeRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLeafTypeOpen((o) => !o)}
                  className={cn(
                    "flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 transition-all duration-200 dark:bg-input/30",
                    leafTypeOpen ? "ring-2 ring-ring border-transparent" : "hover:bg-input/40"
                  )}
                >
                  <span className={cn("flex-1 text-sm", !selectedLeafType && "text-muted-foreground")}>
                    {selectedLeafType ? selectedLeafType.t_name : "Select leaf type..."}
                  </span>
                  <IconChevronDown className={cn("size-4 shrink-0 opacity-50 transition-transform duration-200", leafTypeOpen && "rotate-180")} />
                </button>
                {leafTypeOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                    {leafTypes.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No leaf types available.</p>}
                    {leafTypes.map((t) => (
                      <button key={t.t_id} type="button" onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setLeafTypeId(String(t.t_id)); setLeafTypeOpen(false) }}
                        className="relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
                        {leafTypeId === String(t.t_id) && (
                          <span className="absolute left-2 flex size-4 items-center justify-center">
                            <IconCheck className="size-3.5" />
                          </span>
                        )}
                        {t.t_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Numeric fields */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total (kg)</Label>
              <Input className="h-9 text-sm" type="number" min={0} step="0.01"
                value={totalInKg} onChange={(e) => setTotalInKg(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Remork</Label>
              <Input className="h-9 text-sm" type="number" min={0} step="1"
                value={remork} onChange={(e) => setRemork(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Total Weight (kg)</Label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground">
                {calcTotalWeight ?? "—"}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline"
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide"
                onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}
                className="rounded-full h-8 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
                {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
