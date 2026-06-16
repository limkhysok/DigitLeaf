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
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  const [debouncedQuery, setDebouncedQuery] = React.useState("")

  // Tobacco type state
  const [tobaccoOpen, setTobaccoOpen] = React.useState(false)
  const [selectedTobacco, setSelectedTobacco] = React.useState<TobaccoItem | null>(null)

  // Manual inputs
  const [land, setLand] = React.useState("")
  const [sapling, setSapling] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear().toString())

  // Debounce farmer query
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(farmerQuery), 350)
    return () => clearTimeout(timer)
  }, [farmerQuery])

  // Reset on close
  function handleClose() {
    setFarmerOpen(false)
    setFarmerQuery("")
    setDebouncedQuery("")
    setSelectedFarmer(null)
    setTobaccoOpen(false)
    setSelectedTobacco(null)
    setLand("")
    setSapling("")
    setYear(new Date().getFullYear().toString())
    onOpenChange(false)
  }

  // Fetch tobacco types once when dialog opens
  const { data: formMeta } = useQuery({
    queryKey: ["farmer-contract-form-metadata"],
    queryFn: () => apiClient.getFarmerContractFormMetadata(tokens!.access_token),
    enabled: open && !!tokens?.access_token,
    staleTime: 5 * 60 * 1000,
  })
  const tobaccoTypes = formMeta?.tobacco_types ?? []

  // Search farmers as user types
  const { data: farmers = [], isFetching: isFetchingFarmers } = useQuery({
    queryKey: ["farmer-contract-farmer-search", debouncedQuery],
    queryFn: () =>
      apiClient.queryMemberFarmers(tokens!.access_token, debouncedQuery, undefined, 20),
    enabled: farmerOpen && !!tokens?.access_token && debouncedQuery.trim().length > 0,
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

  function handleSubmit(e: React.FormEvent) {
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
      year: parseInt(year),
      land: parseFloat(land),
      tobac_num: parseInt(sapling),
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

          {/* Farmer search combobox */}
          <div className="flex flex-col gap-1.5">
            <Label>Farmer</Label>
            <Popover open={farmerOpen} onOpenChange={setFarmerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={farmerOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedFarmer
                    ? `${selectedFarmer.name} | ${selectedFarmer.mf_code}`
                    : "Search farmer..."}
                  <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search by name or code..."
                    value={farmerQuery}
                    onValueChange={setFarmerQuery}
                  />
                  <CommandList>
                    {isFetchingFarmers && (
                      <div className="flex items-center justify-center py-3">
                        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {!isFetchingFarmers && debouncedQuery.trim().length === 0 && (
                      <CommandEmpty>Type to search farmers...</CommandEmpty>
                    )}
                    {!isFetchingFarmers && debouncedQuery.trim().length > 0 && farmers.length === 0 && (
                      <CommandEmpty>No farmer found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {farmers.map((f) => (
                        <CommandItem
                          key={f.mf_id}
                          value={`${f.name} ${f.mf_code}`}
                          onSelect={() => {
                            setSelectedFarmer(f)
                            setFarmerOpen(false)
                            setFarmerQuery("")
                          }}
                        >
                          <IconCheck
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedFarmer?.mf_id === f.mf_id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="font-medium">{f.name}</span>
                          <span className="ml-2 text-muted-foreground text-sm">| {f.mf_code}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tobacco type combobox */}
          <div className="flex flex-col gap-1.5">
            <Label>Tobacco Type</Label>
            <Popover open={tobaccoOpen} onOpenChange={setTobaccoOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={tobaccoOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedTobacco
                    ? `${selectedTobacco.t_name_kh ?? selectedTobacco.t_name} | ${selectedTobacco.t_name}`
                    : "Search tobacco type..."}
                  <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search tobacco type..." />
                  <CommandList>
                    <CommandEmpty>No tobacco type found.</CommandEmpty>
                    <CommandGroup>
                      {tobaccoTypes.map((t) => (
                        <CommandItem
                          key={t.t_id}
                          value={`${t.t_name_kh ?? ""} ${t.t_name}`}
                          onSelect={() => {
                            setSelectedTobacco(t)
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
                          <span className={cn("text-sm", t.t_name_kh ? "ml-2 text-muted-foreground" : "font-medium")}>
                            {t.t_name_kh ? `| ${t.t_name}` : t.t_name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Label htmlFor="sapling">Sapling (Kg)</Label>
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
