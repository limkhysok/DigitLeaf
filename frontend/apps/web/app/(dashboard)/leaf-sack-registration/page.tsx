"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import {
  apiClient,
  RepresentItem,
  MemberFarmerItem,
  LeafSackRegistrationItem,
} from "@/lib/api-client"
import { toast } from "sonner"
import { IconLoader2, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent } from "@workspace/ui/components/card"

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending",  className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  1: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
}

export default function LeafSackRegistrationPage() {
  const { tokens } = useAuth()

  const [records, setRecords] = React.useState<LeafSackRegistrationItem[]>([])
  const [represents, setRepresents] = React.useState<RepresentItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // form state
  const [representId, setRepresentId] = React.useState("")
  const [farmerSearchBy, setFarmerSearchBy] = React.useState<"name" | "identity_card">("name")
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [isFarmerSearching, setIsFarmerSearching] = React.useState(false)
  const [sackInKg, setSackInKg] = React.useState("1")
  const [notes, setNotes] = React.useState("")

  const fetchRecords = React.useCallback(async () => {
    if (!tokens?.access_token) return
    try {
      const data = await apiClient.getLeafSackRegistrations(tokens.access_token)
      setRecords(data)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens])

  React.useEffect(() => {
    if (!tokens?.access_token) return
    fetchRecords()
    apiClient.getRepresents(tokens.access_token).then(setRepresents).catch(() => {})
  }, [tokens, fetchRecords])

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
      await apiClient.createLeafSackRegistration(tokens.access_token, {
        represent_id: Number(representId),
        member_farmer_identity_card: farmerResult.identified_no,
        sack_in_kg: Number(sackInKg),
        notes: notes.trim() || undefined,
      })
      toast.success("Leaf sack registered successfully")
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
      await apiClient.deleteLeafSackRegistration(tokens.access_token, id)
      toast.success("Registration deleted")
      fetchRecords()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaf Sack Registration</h1>
          <p className="text-muted-foreground">Register and manage leaf sacks.</p>
        </div>
        <Button className="bg-[#009640] hover:bg-[#008a3b]" onClick={() => setDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
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
                        <td className="px-4 py-3 font-mono text-xs">{rec.leaf_sack_code}</td>
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
                            onClick={() => handleDelete(rec.id, rec.leaf_sack_code)}
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

      {/* Dialog overlay */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={closeDialog}
            onKeyDown={(e) => { if (e.key === "Escape") closeDialog() }}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-background border shadow-xl p-6 mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Register Leaf Sack</h2>
              <button onClick={closeDialog} className="p-1 rounded hover:bg-muted transition-colors">
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Represent */}
              <div className="space-y-2">
                <Label>Represent</Label>
                <select
                  value={representId}
                  onChange={(e) => setRepresentId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select represent...</option>
                  {represents.map((r) => (
                    <option key={r.represent_id} value={String(r.represent_id)}>
                      {r.represent_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Farmer Search */}
              <div className="space-y-2">
                <Label>Member Farmer</Label>
                <div className="flex gap-2">
                  <select
                    value={farmerSearchBy}
                    onChange={(e) => { setFarmerSearchBy(e.target.value as "name" | "identity_card"); setFarmerResult(null) }}
                    className="w-36 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="name">By Name</option>
                    <option value="identity_card">By ID Card</option>
                  </select>
                  <Input
                    placeholder={farmerSearchBy === "name" ? "Farmer name..." : "Identity card no..."}
                    value={farmerQuery}
                    onChange={(e) => { setFarmerQuery(e.target.value); setFarmerResult(null) }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFarmerSearch() } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleFarmerSearch} disabled={isFarmerSearching}>
                    {isFarmerSearching
                      ? <IconLoader2 className="h-4 w-4 animate-spin" />
                      : <IconSearch className="h-4 w-4" />}
                  </Button>
                </div>
                {farmerResult && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm space-y-0.5">
                    <p className="font-medium">{farmerResult.name}</p>
                    <p className="text-muted-foreground text-xs">ID: {farmerResult.identified_no}</p>
                  </div>
                )}
              </div>

              {/* Sack in KG */}
              <div className="space-y-2">
                <Label>Sack (kg)</Label>
                <Input
                  type="number"
                  min={1}
                  value={sackInKg}
                  onChange={(e) => setSackInKg(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#009640] hover:bg-[#008a3b]">
                  {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
