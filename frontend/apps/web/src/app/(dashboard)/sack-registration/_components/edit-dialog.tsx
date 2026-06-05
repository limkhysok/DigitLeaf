"use client"

import * as React from "react"
import { apiClient, SackRegistrationItem, MemberFarmerItem } from "@/services/api-client"
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
import { STATUS_MAP } from "./constants"
import { useLanguage } from "@/hooks/use-language"

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
  const { t } = useLanguage()
  const [status, setStatus] = React.useState("0")
  const [sackInKg, setSackInKg] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [debouncedFarmerQuery] = useDebounce(farmerQuery, 300)
  const [farmerResult, setFarmerResult] = React.useState<MemberFarmerItem | null>(null)
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const farmerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (target) {
      const timer = setTimeout(() => {
        setStatus(String(target.status))
        setSackInKg(target.sack_in_kg !== null && target.sack_in_kg !== undefined ? String(target.sack_in_kg) : "")
        setNotes(target.notes ?? "")
        setFarmerQuery(target.member_farmer_name)
        setFarmerResult(null)
        setFarmerOpen(false)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [target])

  const { data: farmerResults = [], isFetching: isFarmerSearching } = useQuery({
    queryKey: ["farmers", debouncedFarmerQuery],
    queryFn: () => apiClient.queryMemberFarmers(accessToken!, debouncedFarmerQuery),
    enabled: !!accessToken && !!debouncedFarmerQuery.trim() && farmerResult?.name !== debouncedFarmerQuery,
  })

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
      toast.success(t.sackRegistration.dialog.successToast)
      onSuccess()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }
  let farmerEmptyMessage = t.sackRegistration.dialog.typeToSearch
  if (isFarmerSearching) {
    farmerEmptyMessage = t.sackRegistration.dialog.searching
  } else if (farmerQuery.trim()) {
    farmerEmptyMessage = t.sackRegistration.dialog.noFarmersFound
  }

  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.sackRegistration.dialog.editTitle}</DialogTitle>
          <DialogDescription>
            {t.sackRegistration.dialog.editSubtitle}
          </DialogDescription>
        </DialogHeader>
        {target && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
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
                          if (farmerResult) { setFarmerResult(null) }
                        }}
                        onFocus={() => setFarmerOpen(true)}
                        onClick={(e) => {
                          e.stopPropagation()
                          setFarmerOpen(true)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder={t.sackRegistration.dialog.searchPlaceholder}
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
                    <span className="text-muted-foreground text-xs">{t.sackRegistration.dialog.idCardLabel?.replace("{code}", farmerResult.mf_code) || `ID Card: ${farmerResult.mf_code}`}</span>
                  </div>
                  <IconCheck className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>


            <div className="space-y-1">
              <Label className="text-sm font-medium">{t.sackRegistration.dialog.status}</Label>
              <div className="flex gap-2">
                {Object.entries(STATUS_MAP).map(([val, { label, className }]) => {
                  const getStatusBtnLabel = (valStr: string) => {
                    switch (Number(valStr)) {
                      case 0: return t.sackRegistration.filters.statusPending
                      case 1: return t.sackRegistration.filters.statusConfirmed
                      case 2: return t.sackRegistration.filters.statusRejected
                      default: return label
                    }
                  }
                  const statusBtnLabel = getStatusBtnLabel(val)
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStatus(val)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-sm font-medium border transition-all",
                        status === val ? cn(className, "border-transparent") : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {statusBtnLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">{t.sackRegistration.dialog.sackWeightOptional}</Label>
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
              <Button type="button" className="rounded-md" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t.sackRegistration.dialog.cancel}
              </Button>
              <Button type="submit" className="rounded-md" disabled={isSubmitting}>
                {isSubmitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.sackRegistration.dialog.save}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
