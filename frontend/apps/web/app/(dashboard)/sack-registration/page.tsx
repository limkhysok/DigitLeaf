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
import { IconCheck, IconChevronDown, IconLoader2, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending",  className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
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

  const representRef = React.useRef<HTMLDivElement>(null)

  // form state
  const [representId, setRepresentId] = React.useState("")
  const [representOpen, setRepresentOpen] = React.useState(false)
  const [representSearch, setRepresentSearch] = React.useState("")
  const [farmerSearchBy, setFarmerSearchBy] = React.useState<"name" | "identity_card">("name")
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [isFarmerSearching, setIsFarmerSearching] = React.useState(false)
  const [sackInKg, setSackInKg] = React.useState("1")
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
    fetchRecords()
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => {})
  }, [isAuthLoading, tokens, fetchRecords])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (representRef.current && !representRef.current.contains(e.target as Node)) {
        setRepresentOpen(false)
        setRepresentSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleFarmerSearch = async () => {
    if (!tokens?.access_token || !farmerQuery.trim()) return
    setIsFarmerSearching(true)
    setFarmerResult(null)
    try {
      const params =
        farmerSearchBy === "name"
          ? { name: farmerQuery.trim() }
          : { identity_card: farmerQuery.trim() }
      const farmer = await apiClient.searchMemberFarmer(tokens.access_token, params)
      setFarmerResult(farmer)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsFarmerSearching(false)
    }
  }

  const resetForm = () => {
    setRepresentId("")
    setRepresentOpen(false)
    setRepresentSearch("")
    setFarmerQuery("")
    setFarmerResult(null)
    setSackInKg("1")
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
        member_farmer_identity_card: farmerResult.identified_no,
        sack_in_kg: Number(sackInKg),
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

  const handleDelete = async (id: number, code: string) => {
    if (!tokens?.access_token) return
    if (!confirm(`Delete registration ${code}?`)) return
    try {
      await apiClient.deleteSackRegistration(tokens.access_token, id)
      toast.success("Registration deleted")
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack Code</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Represent</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Farmer</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID Card</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sack (kg)</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registered By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const status = STATUS_MAP[rec.status] ?? { label: String(rec.status), className: "bg-gray-100 text-gray-800" }
                    return (
                      <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
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
                          <button
                            onClick={() => handleDelete(rec.id, rec.sack_code)}
                            className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Sack</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Represent — searchable combobox */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Representative
              </Label>
              <div ref={representRef} className="relative">
                {representOpen ? (
                  <div className="flex h-9 w-full items-center rounded-md border border-input bg-input/20 px-3 gap-2 ring-2 ring-ring dark:bg-input/30">
                    <IconSearch className="size-4 shrink-0 opacity-50" />
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Search Representative..."
                      value={representSearch}
                      onChange={(e) => setRepresentSearch(e.target.value)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRepresentOpen(true)}
                    className={cn(
                      "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-input/20 px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-input/30",
                      !selectedRepresent && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {selectedRepresent ? selectedRepresent.represent_name : "Select Representative..."}
                    </span>
                    <IconChevronDown className="size-4 shrink-0 opacity-50" />
                  </button>
                )}
                {representOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1">
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
                          setRepresentSearch("")
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

            {/* Member Farmer Search */}
            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">
                Member Farmer
              </Label>
              <div className="flex gap-2">
                <Select
                  value={farmerSearchBy}
                  onValueChange={(v) => {
                    setFarmerSearchBy(v as "name" | "identity_card")
                    setFarmerResult(null)
                  }}
                >
                  <SelectTrigger className="w-34 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">By Name</SelectItem>
                    <SelectItem value="identity_card">By ID Card</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-9 flex-1 text-sm"
                  placeholder={farmerSearchBy === "name" ? "Farmer name..." : "Identity card no..."}
                  value={farmerQuery}
                  onChange={(e) => { setFarmerQuery(e.target.value); setFarmerResult(null) }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFarmerSearch() } }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-9 shrink-0 p-0"
                  onClick={handleFarmerSearch}
                  disabled={isFarmerSearching}
                >
                  {isFarmerSearching
                    ? <IconLoader2 className="size-4 animate-spin" />
                    : <IconSearch className="size-4" />}
                </Button>
              </div>
              {farmerResult && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm space-y-0.5">
                  <p className="text-foreground">{farmerResult.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {farmerResult.identified_no}</p>
                </div>
              )}
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
