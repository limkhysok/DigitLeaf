"use client"

import * as React from "react"
import {
  IconLoader2,
  IconMeterSquare,
  IconSeeding,
  IconCalendar,
  IconChevronDown,
  IconCheck,
  IconPencil,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Command as CommandPrimitive } from "cmdk"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient, FarmerContractItem, TobaccoItem } from "@/services/api-client"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@workspace/ui/lib/utils"

interface EditFarmerContractDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  contract: FarmerContractItem | null
}

export function EditFarmerContractDialog({
  open,
  onOpenChange,
  contract,
}: Readonly<EditFarmerContractDialogProps>) {
  const { tokens } = useAuth()
  const queryClient = useQueryClient()

  const [tobaccoOpen, setTobaccoOpen] = React.useState(false)
  const [tobaccoSearch, setTobaccoSearch] = React.useState("")
  const [selectedTobacco, setSelectedTobacco] = React.useState<TobaccoItem | null>(null)

  const [land, setLand] = React.useState("")
  const [sapling, setSapling] = React.useState("")
  const [year, setYear] = React.useState("")

  // Fetch tobacco types when dialog opens
  const { data: formMeta, isFetching: isFetchingTobacco } = useQuery({
    queryKey: ["farmer-contract-form-metadata"],
    queryFn: () => apiClient.getFarmerContractFormMetadata(tokens!.access_token),
    enabled: open && !!tokens?.access_token,
    staleTime: 5 * 60 * 1000,
  })
  const tobaccoTypes = formMeta?.tobacco_types ?? []

  // Pre-populate fields when contract changes
  React.useEffect(() => {
    if (!contract || !open) return
    setLand(contract.land != null ? String(contract.land) : "")
    setSapling(contract.tobac_num != null ? String(contract.tobac_num) : "")
    setYear(String(contract.year))
    setTobaccoSearch("")
    setSelectedTobacco(null)
  }, [contract, open])

  // Once tobacco types are loaded and contract has t_id, auto-select
  React.useEffect(() => {
    if (!contract?.t_id || tobaccoTypes.length === 0) return
    const match = tobaccoTypes.find((t) => t.t_id === contract.t_id)
    if (match) {
      setSelectedTobacco(match)
      setTobaccoSearch(match.t_name_kh ?? match.t_name)
    }
  }, [contract?.t_id, tobaccoTypes])

  const filteredTobacco = React.useMemo(() => {
    if (!tobaccoSearch.trim()) return tobaccoTypes
    const q = tobaccoSearch.toLowerCase()
    return tobaccoTypes.filter(
      (t) =>
        t.t_name.toLowerCase().includes(q) ||
        t.t_name_kh?.toLowerCase().includes(q)
    )
  }, [tobaccoTypes, tobaccoSearch])

  function handleClose() {
    setTobaccoOpen(false)
    setTobaccoSearch("")
    setSelectedTobacco(null)
    setLand("")
    setSapling("")
    setYear("")
    onOpenChange(false)
  }

  const { mutate: patchContract, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof apiClient.patchFarmerContract>[2]) =>
      apiClient.patchFarmerContract(tokens!.access_token, contract!.mf_con_id, data),
    onSuccess: () => {
      toast.success("Farmer contract updated successfully")
      queryClient.invalidateQueries({ queryKey: ["farmer-contracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update farmer contract")
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!selectedTobacco) {
      toast.error("Please select a tobacco type")
      return
    }
    patchContract({
      t_id: selectedTobacco.t_id,
      year: Number.parseInt(year),
      land: land ? Number.parseFloat(land) : null,
      tobac_num: sapling ? Number.parseInt(sapling) : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconPencil className="h-5 w-5 text-[#009640]" />
            Edit Farmer Contract
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">

          {/* Farmer (read-only) */}
          <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-green-700 dark:text-green-400">{contract?.name}</span>
              <span className="text-muted-foreground text-xs">ID: {contract?.mf_code}</span>
            </div>
            <IconCheck className="h-4 w-4 text-green-500" />
          </div>

          {/* Tobacco type */}
          <div className="space-y-1 flex flex-col">
            <Label className="text-sm font-medium">Tobacco Type</Label>
            <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
              <Popover
                open={tobaccoOpen}
                onOpenChange={(open) => {
                  setTobaccoOpen(open)
                  if (!open && selectedTobacco)
                    setTobaccoSearch(selectedTobacco.t_name_kh ?? selectedTobacco.t_name)
                }}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CommandPrimitive.Input
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={tobaccoSearch}
                      onValueChange={(val) => {
                        setTobaccoSearch(val)
                        setTobaccoOpen(true)
                        if (selectedTobacco) setSelectedTobacco(null)
                      }}
                      onFocus={() => setTobaccoOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setTobaccoOpen(true)
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="Search tobacco type..."
                    />
                    <IconChevronDown className="absolute right-3 top-2 h-4 w-4 shrink-0 opacity-50 pointer-events-none" />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <CommandList>
                    {isFetchingTobacco ? (
                      <div className="flex items-center justify-center py-3">
                        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <CommandEmpty>No tobacco type found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {filteredTobacco.map((t) => (
                        <CommandItem
                          key={t.t_id}
                          value={`${t.t_name_kh ?? ""} ${t.t_name}`}
                          onSelect={() => {
                            setSelectedTobacco(t)
                            setTobaccoSearch(t.t_name_kh ?? t.t_name)
                            setTobaccoOpen(false)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTobacco?.t_id === t.t_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {t.t_name_kh && (
                            <span className="font-medium">{t.t_name_kh}</span>
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              t.t_name_kh ? "ml-2 text-muted-foreground" : "font-medium"
                            )}
                          >
                            {t.t_name_kh ? `| ${t.t_name}` : t.t_name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </PopoverContent>
              </Popover>
            </Command>
          </div>

          {/* Land */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-land">Land</Label>
            <div className="relative">
              <IconMeterSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-land"
                type="number"
                min={0.01}
                step="any"
                value={land}
                onChange={(e) => setLand(e.target.value)}
                placeholder="Enter land area..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Sapling (Kg) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-sapling">Sapling (Kg)</Label>
            <div className="relative">
              <IconSeeding className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-sapling"
                type="number"
                min={1}
                step="1"
                value={sapling}
                onChange={(e) => setSapling(e.target.value)}
                placeholder="Enter sapling weight..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-year">Year</Label>
            <div className="relative">
              <IconCalendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="edit-year" className="w-full pl-9">
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#009640] hover:bg-[#007a33] text-white"
            >
              {isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
