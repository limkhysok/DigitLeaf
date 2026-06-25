"use client"

import * as React from "react"
import {
  IconLoader2,
  IconUserPlus,
  IconMeterSquare,
  IconSeeding,
  IconCalendar,
  IconChevronDown,
  IconCheck,
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
import { useDebounce } from "use-debounce"
import { apiClient, MemberFarmerItem, TobaccoItem } from "@/services/api-client"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@workspace/ui/lib/utils"

interface CreateFarmerContractDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CreateFarmerContractDialog({
  open,
  onOpenChange,
}: Readonly<CreateFarmerContractDialogProps>) {
  const { tokens } = useAuth()
  const queryClient = useQueryClient()

  // Farmer search state
  const [farmerOpen, setFarmerOpen] = React.useState(false)
  const [farmerQuery, setFarmerQuery] = React.useState("")
  const [selectedFarmer, setSelectedFarmer] = React.useState<MemberFarmerItem | null>(null)
  const [debouncedFarmerQuery] = useDebounce(farmerQuery, 350)

  // Tobacco type state
  const [tobaccoOpen, setTobaccoOpen] = React.useState(false)
  const [tobaccoSearch, setTobaccoSearch] = React.useState("")
  const [selectedTobacco, setSelectedTobacco] = React.useState<TobaccoItem | null>(null)

  // Manual inputs
  const [land, setLand] = React.useState("")
  const [sapling, setSapling] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear().toString())

  // Reset on close
  function handleClose() {
    setFarmerOpen(false)
    setFarmerQuery("")
    setSelectedFarmer(null)
    setTobaccoOpen(false)
    setTobaccoSearch("")
    setSelectedTobacco(null)
    setLand("")
    setSapling("")
    setYear(new Date().getFullYear().toString())
    onOpenChange(false)
  }

  // Fetch tobacco types once when dialog opens
  const { data: formMeta, isFetching: isFetchingTobacco } = useQuery({
    queryKey: ["farmer-contract-form-metadata"],
    queryFn: () => apiClient.getFarmerContractFormMetadata(tokens!.access_token),
    enabled: open && !!tokens?.access_token,
    staleTime: 5 * 60 * 1000,
  })
  // Client-side filter for tobacco
  const filteredTobacco = React.useMemo(() => {
    const tobaccoTypes = formMeta?.tobacco_types ?? []
    if (!tobaccoSearch.trim()) return tobaccoTypes
    const q = tobaccoSearch.toLowerCase()
    return tobaccoTypes.filter(
      (t) =>
        t.t_name.toLowerCase().includes(q) ||
        t.t_name_kh?.toLowerCase().includes(q)
    )
  }, [formMeta?.tobacco_types, tobaccoSearch])

  // Search farmers as user types
  const { data: farmers = [], isFetching: isFetchingFarmers } = useQuery({
    queryKey: ["farmer-contract-farmer-search", debouncedFarmerQuery],
    queryFn: () =>
      apiClient.queryMemberFarmers(tokens!.access_token, debouncedFarmerQuery, undefined, 20),
    enabled: farmerOpen && !!tokens?.access_token,
    staleTime: 30_000,
  })

  // Create contract mutation
  const { mutate: createContract, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createFarmerContract>[1]) =>
      apiClient.createFarmerContract(tokens!.access_token, data),
    onSuccess: () => {
      toast.success("Farmer contract added successfully")
      queryClient.invalidateQueries({ queryKey: ["farmer-contracts"] })
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create farmer contract")
    },
  })

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (!selectedFarmer) {
      toast.error("Please select a farmer")
      return
    }
    if (!selectedTobacco) {
      toast.error("Please select a tobacco type")
      return
    }
    if (!land || !sapling) {
      toast.error("Please fill in all fields")
      return
    }
    createContract({
      mf_id: selectedFarmer.mf_id,
      t_id: selectedTobacco.t_id,
      year: Number.parseInt(year),
      land: Number.parseFloat(land),
      tobac_num: Number.parseInt(sapling),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUserPlus className="h-5 w-5 text-[#009640]" />
            Add Farmer Contract
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">

          {/* Farmer search */}
          <div className="space-y-1 flex flex-col">
            <Label className="text-sm font-medium">Farmer</Label>
            <Command shouldFilter={false} className="overflow-visible bg-transparent p-0">
              <Popover
                open={farmerOpen}
                onOpenChange={(open) => {
                  setFarmerOpen(open)
                  if (!open && selectedFarmer) setFarmerQuery(selectedFarmer.name)
                }}
              >
                <PopoverTrigger asChild>
                  <div className="relative">
                    <CommandPrimitive.Input
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={farmerQuery}
                      onValueChange={(val) => {
                        setFarmerQuery(val)
                        setFarmerOpen(true)
                        if (selectedFarmer) setSelectedFarmer(null)
                      }}
                      onFocus={() => setFarmerOpen(true)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setFarmerOpen(true)
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="Search farmer..."
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
                    {isFetchingFarmers ? (
                      <div className="flex items-center justify-center py-3">
                        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <CommandEmpty>No farmer found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {farmers.map((f) => (
                        <CommandItem
                          key={f.mf_id}
                          value={`${f.name} ${f.mf_code}`}
                          onSelect={() => {
                            setSelectedFarmer(f)
                            setFarmerQuery(f.name)
                            setFarmerOpen(false)
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFarmer?.mf_id === f.mf_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span>
                            {f.name}{" "}
                            <span className="text-muted-foreground">({f.mf_code})</span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </PopoverContent>
              </Popover>
            </Command>

            {selectedFarmer && !farmerOpen && (
              <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="font-medium text-green-700 dark:text-green-400">{selectedFarmer.name}</span>
                  <span className="text-muted-foreground text-xs">ID: {selectedFarmer.mf_code}</span>
                </div>
                <IconCheck className="h-4 w-4 text-green-500" />
              </div>
            )}
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

            {selectedTobacco && !tobaccoOpen && (
              <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm flex items-center justify-between mt-1">
                <div className="flex flex-col">
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {selectedTobacco.t_name_kh ?? selectedTobacco.t_name}
                  </span>
                  {selectedTobacco.t_name_kh && (
                    <span className="text-muted-foreground text-xs">{selectedTobacco.t_name}</span>
                  )}
                </div>
                <IconCheck className="h-4 w-4 text-green-500" />
              </div>
            )}
          </div>

          {/* Land */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="land">Land</Label>
            <div className="relative">
              <IconMeterSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="land"
                type="number"
                min={0.01}
                step="any"
                value={land}
                onChange={(e) => setLand(e.target.value)}
                placeholder="Enter land area..."
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Sapling (Kg) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sapling">Sapling </Label>
            <div className="relative">
              <IconSeeding className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="sapling"
                type="number"
                min={1}
                step="1"
                value={sapling}
                onChange={(e) => setSapling(e.target.value)}
                placeholder="Enter sapling weight..."
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year">Year</Label>
            <div className="relative">
              <IconCalendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger id="year" className="w-full pl-9">
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
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
