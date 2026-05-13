"use client"

import * as React from "react"
import { apiClient, RepresentItem, MemberFarmerItem } from "@/lib/api-client"
import { toast } from "sonner"
import { IconChevronDown, IconLoader2, IconSearch, IconCheck, IconCalendar } from "@tabler/icons-react"
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
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
import { format } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"
import { filterRepresents } from "./constants"

export function RegisterDialog({
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
        registered_at: format(registeredAt, "yyyy-MM-dd"),
        notes: notes.trim() || undefined,
      })
      toast.success("Sack registered successfully")
      onSuccess()
      onClose()
      // reset
      setRepresentId(""); setRepresentSearch(""); setFarmerQuery(""); setFarmerResult(null); setNotes(""); setRegisteredAt(new Date())
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
            <Label className="text-xs capitalize tracking-wide text-muted-foreground">Notes <span className="font-normal text-muted-foreground/60">(optional)</span></Label>
            <Input className="h-9 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" className="rounded-full h-9 px-4 text-xs capitalize tracking-wide" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-full h-9 px-4 text-xs capitalize tracking-wide gap-1.5 bg-[#009640] hover:bg-[#008a3b] text-white border-transparent">
              {isSubmitting && <IconLoader2 className="size-3.5 animate-spin" />}Register
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
