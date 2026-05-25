"use client"

import * as React from "react"
import { apiClient, RepresentItem, MemberFarmerItem } from "@/lib/api-client"
import { toast } from "sonner"
import { IconChevronDown, IconLoader2, IconCheck, IconCalendar } from "@tabler/icons-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Command as CommandPrimitive } from "cmdk"
import { Calendar } from "@workspace/ui/components/calendar"
import { format } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"

import { useLanguage } from "@/hooks/use-language"

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
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [representId, setRepresentId] = React.useState("")
  const [representSearch, setRepresentSearch] = React.useState("")
  const [representOpen, setRepresentOpen] = React.useState(false)
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
  const [sackInKg, setSackInKg] = React.useState("1")
  const [notes, setNotes] = React.useState("")

  const farmerRef = React.useRef<HTMLDivElement>(null)

  const filteredRepresents = React.useMemo(() => {
    if (!representSearch.trim()) return represents
    const q = representSearch.toLowerCase()
    return represents.filter((r) => r.represent_name.toLowerCase().includes(q))
  }, [represents, representSearch])

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
    if (!representId) { toast.error(t.sackRegistration.dialog.errSelectRep); return }
    if (!farmerResult) { toast.error(t.sackRegistration.dialog.errSelectFarmer); return }
    if (!registeredAt) { toast.error(t.sackRegistration.dialog.errSelectDate); return }

    const sackKg = Number.parseFloat(sackInKg)
    if (Number.isNaN(sackKg) || sackKg < 0) { toast.error(t.sackRegistration.dialog.errInvalidWeight); return }

    setIsSubmitting(true)
    try {
      await apiClient.createSackRegistration(accessToken, {
        represent_id: Number(representId),
        member_farmer_identity_card: farmerResult.mf_code,
        registered_at: format(registeredAt, "yyyy-MM-dd'T'HH:mm:ss"),
        sack_in_kg: sackKg,
        notes: notes.trim() || undefined,
      })
      toast.success(t.sackRegistration.dialog.registerSuccessToast)
      onSuccess()
      onClose()
      // reset
      setRepresentId(""); setRepresentSearch(""); setFarmerQuery(""); setFarmerResult(null)
      setSackInKg("1"); setNotes(""); setRegisteredAt(new Date())
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  let farmerEmptyMessage = t.sackRegistration.dialog.noFarmersFound
  if (isFarmerSearching) {
    farmerEmptyMessage = t.sackRegistration.dialog.searching
  } else if (!representId) {
    farmerEmptyMessage = t.sackRegistration.dialog.selectRepFirst
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.sackRegistration.dialog.registerTitle}</DialogTitle>
          <DialogDescription>{t.sackRegistration.dialog.registerSubtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 flex flex-col">
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.representative}</Label>
            <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
              <Popover open={representOpen} onOpenChange={setRepresentOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CommandPrimitive.Input
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={representSearch}
                      onValueChange={(val) => {
                        setRepresentSearch(val)
                        setRepresentOpen(true)
                        if (representId) setRepresentId("")
                      }}
                      onFocus={() => setRepresentOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setRepresentOpen(true)
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder={t.sackRegistration.dialog.searchRepPlaceholder}
                    />
                    <IconChevronDown className="absolute right-3 top-2.5 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <CommandList>
                    <CommandEmpty>{t.sackRegistration.dialog.noResultsFound}</CommandEmpty>
                    <CommandGroup>
                      {filteredRepresents.map((r) => (
                        <CommandItem
                          key={r.represent_id}
                          value={r.represent_name}
                          onSelect={() => {
                            setRepresentId(String(r.represent_id))
                            setRepresentSearch(r.represent_name)
                            setRepresentOpen(false)
                            setFarmerQuery("")
                            setFarmerResult(null)
                            setFarmerResults([])
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              representId === String(r.represent_id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {r.represent_name}
                          <span className="text-muted-foreground text-xs ml-auto">
                            {t.sackRegistration.dialog.membersCount.replace("{count}", String(r.farmer_count))}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </PopoverContent>
              </Popover>
            </Command>
          </div>

          <div className="space-y-1 flex flex-col">
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.farmerMember}</Label>
            <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
              <Popover open={farmerOpen} onOpenChange={(open) => { setFarmerOpen(open); if (open && representId && !farmerResult && !farmerResults.length) handleFarmerSearch(farmerQuery) }}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CommandPrimitive.Input
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={farmerQuery}
                      onValueChange={(val) => {
                        setFarmerQuery(val)
                        setFarmerOpen(true)
                        if (farmerResult) setFarmerResult(null)
                      }}
                      onFocus={() => setFarmerOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setFarmerOpen(true)
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder={t.sackRegistration.dialog.searchFarmerPlaceholder}
                      disabled={!representId}
                    />
                    <IconChevronDown className="absolute right-3 top-2.5 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <CommandList>
                    <CommandEmpty>
                      {farmerEmptyMessage}
                    </CommandEmpty>
                    <CommandGroup>
                      {farmerResults.map((f) => (
                        <CommandItem
                          key={f.mf_id}
                          value={f.name}
                          onSelect={() => {
                            setFarmerResult(f)
                            setFarmerQuery(f.name)
                            setFarmerOpen(false)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              farmerResult?.mf_id === f.mf_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{f.name}</span>
                            <span className="text-[10px] text-muted-foreground">ID: {f.mf_code}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </PopoverContent>
              </Popover>
            </Command>

            {farmerResult && !farmerOpen && (
              <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="font-medium text-green-700 dark:text-green-400">{farmerResult.name}</span>
                  <span className="text-muted-foreground text-xs">{t.sackRegistration.dialog.idCardLabel.replace("{code}", farmerResult.mf_code)}</span>
                </div>
                <IconCheck className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.registrationDate}</Label>
            <Popover open={registeredAtOpen} onOpenChange={setRegisteredAtOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-md",
                    !registeredAt && "text-muted-foreground"
                  )}
                >
                  <IconCalendar className="mr-2 h-4 w-4" />
                  {registeredAt ? format(registeredAt, "dd/MM/yyyy") : t.sackRegistration.dialog.selectDatePlaceholder}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={registeredAt ?? undefined} onSelect={(date) => { if (date) { const now = new Date(); date.setHours(now.getHours(), now.getMinutes(), now.getSeconds()); setRegisteredAt(date); setRegisteredAtOpen(false) } }} autoFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.sackWeightKg}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="text-sm rounded-md"
              value={sackInKg}
              onChange={(e) => setSackInKg(e.target.value)}
              placeholder={t.sackRegistration.dialog.weightPlaceholder}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.notesOptional}</Label>
            <Input className="text-sm rounded-md" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.sackRegistration.dialog.notesPlaceholder} />
          </div>

          <DialogFooter>
            <Button type="button" className="rounded-md" variant="outline" onClick={onClose}>{t.sackRegistration.dialog.cancel}</Button>
            <Button type="submit" className="rounded-md" disabled={isSubmitting}>
              {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.sackRegistration.dialog.register}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
