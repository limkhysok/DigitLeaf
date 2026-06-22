"use client"

import * as React from "react"
import { apiClient, RepresentItem, MemberFarmerItem } from "@/services/api-client"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "use-debounce"
import { IconChevronDown, IconLoader2, IconCheck } from "@tabler/icons-react"
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
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [debouncedFarmerQuery] = useDebounce(farmerQuery, 300)
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [sackInKg, setSackInKg] = React.useState("1")
  const [notes, setNotes] = React.useState("")

  const farmerRef = React.useRef<HTMLDivElement>(null)

  const selectedRepresent = represents.find((r) => String(r.represent_id) === representId)

  const { data: farmerResults = [], isFetching: isFarmerSearching } = useQuery({
    queryKey: ["farmers", debouncedFarmerQuery],
    queryFn: () => apiClient.queryMemberFarmers(accessToken!, debouncedFarmerQuery),
    enabled: !!accessToken && farmerResult?.name !== debouncedFarmerQuery,
  })

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

    const sackKg = Number.parseFloat(sackInKg)
    if (Number.isNaN(sackKg) || sackKg < 0) { toast.error(t.sackRegistration.dialog.errInvalidWeight); return }
    const sackKgParts = sackInKg.split(".")
    if (sackKgParts.length === 2 && (sackKgParts[1]?.length ?? 0) > 2) { toast.error(t.sackRegistration.dialog.errInvalidWeightPrecision); return }

    setIsSubmitting(true)
    try {
      await apiClient.createSackRegistration(accessToken, {
        represent_id: Number(representId),
        member_farmer_identity_card: farmerResult.mf_code,
        sack_in_kg: sackKg,
        notes: notes.trim() || undefined,
      })
      toast.success(t.sackRegistration.dialog.registerSuccessToast)
      onSuccess()
      onClose()
      // reset
      setRepresentId(""); setRepresentSearch(""); setFarmerQuery(""); setFarmerResult(null)
      setSackInKg("1"); setNotes("")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  const farmerEmptyMessage = isFarmerSearching
    ? t.sackRegistration.dialog.searching
    : t.sackRegistration.dialog.noFarmersFound

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.sackRegistration.dialog.registerTitle}</DialogTitle>
          <DialogDescription>{t.sackRegistration.dialog.registerSubtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 flex flex-col" ref={farmerRef}>
            <Label className="text-sm font-medium">{t.sackRegistration.dialog.farmerMember}</Label>
            <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
              <Popover open={farmerOpen} onOpenChange={(open) => { setFarmerOpen(open) }}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CommandPrimitive.Input
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={farmerQuery}
                      onValueChange={(val) => {
                        setFarmerQuery(val)
                        setFarmerOpen(true)
                        if (farmerResult) {
                          setFarmerResult(null)
                          setRepresentId("")
                          setRepresentSearch("")
                        }
                      }}
                      onFocus={() => setFarmerOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setFarmerOpen(true)
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder={t.sackRegistration.dialog.searchFarmerPlaceholder}
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
                            const repName =
                              f.represent_name ??
                              represents.find((r) => r.represent_id === f.represent_id)?.represent_name ??
                              ""
                            setRepresentId(String(f.represent_id ?? ""))
                            setRepresentSearch(repName)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              farmerResult?.mf_id === f.mf_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>{f.name} <span className="text-gray-800">({f.mf_code})</span></span>
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
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {t.sackRegistration.dialog.farmerMember} : {farmerResult.name} ({farmerResult.mf_code})
                  </span>
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {t.sackRegistration.dialog.selectedRepresentLabel.replace("{name}", selectedRepresent?.represent_name ?? representSearch)}
                  </span>
                </div>
                <IconCheck className="h-4 w-4 text-green-500" />
              </div>
            )}
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
