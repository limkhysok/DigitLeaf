"use client"

import * as React from "react"
import { apiClient, SackRegistrationItem, MemberFarmerItem } from "@/lib/api-client"
import { toast } from "sonner"
import { IconChevronDown, IconLoader2, IconSearch, IconCheck } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"
import { STATUS_MAP } from "./constants"

export function EditDialog({
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
  const [status, setStatus] = React.useState("0")
  const [sackInKg, setSackInKg] = React.useState("")
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
        setStatus(String(target.status))
        setSackInKg(target.sack_in_kg !== null && target.sack_in_kg !== undefined ? String(target.sack_in_kg) : "")
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
        status: Number(status),
        sack_in_kg: sackInKg ? Number(sackInKg) : null,
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
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Sack Weight (kg) <span className="font-normal text-muted-foreground/60">(optional)</span></Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-9 text-sm"
                value={sackInKg}
                onChange={(e) => setSackInKg(e.target.value)}
                placeholder="e.g. 50.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs capitalize tracking-wide text-muted-foreground">Notes <span className="font-normal text-muted-foreground/60">(optional)</span></Label>
              <Input className="h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
            </div>

            <DialogFooter className="flex-row items-center justify-end gap-2 sm:justify-end">
              <Button type="button" variant="outline" className="rounded-full h-9 px-4 text-xs capitalize tracking-wide" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
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
