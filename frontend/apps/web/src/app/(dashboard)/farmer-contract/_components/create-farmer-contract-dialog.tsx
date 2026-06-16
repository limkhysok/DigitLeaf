"use client"

import * as React from "react"
import { IconLoader2, IconUserPlus, IconUser, IconMeterSquare, IconLeaf, IconSeeding, IconCalendar } from "@tabler/icons-react"
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
import { toast } from "sonner"

interface CreateFarmerContractDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CreateFarmerContractDialog({
  open,
  onOpenChange,
}: Readonly<CreateFarmerContractDialogProps>) {
  const [farmer, setFarmer] = React.useState("")
  const [land, setLand] = React.useState("")
  const [sapling, setSapling] = React.useState("")
  const [year, setYear] = React.useState(new Date().getFullYear().toString())
  const [tobacco, setTobacco] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)

  function handleClose() {
    setFarmer("")
    setLand("")
    setSapling("")
    setYear(new Date().getFullYear().toString())
    setTobacco("")
    onOpenChange(false)
  }

  function handleSubmit() {
    if (!farmer || !land || !sapling || !year || !tobacco) {
      toast.error("Please fill in all fields")
      return
    }

    setIsPending(true)
    // Mocking an API call
    setTimeout(() => {
      setIsPending(false)
      toast.success("Farmer contract added successfully")
      handleClose()
    }, 1000)
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

        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          className="flex flex-col gap-4 py-2"
        >
          {/* Farmer */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="farmer">Farmer</Label>
            <div className="relative">
              <IconUser className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="farmer"
                value={farmer}
                onChange={(e) => setFarmer(e.target.value)}
                placeholder="Enter farmer name..."
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Land */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="land">Land</Label>
            <div className="relative">
              <IconMeterSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="land"
                value={land}
                onChange={(e) => setLand(e.target.value)}
                placeholder="Enter land area..."
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Tobacco */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tobacco">Tobacco Type</Label>
            <div className="relative">
              <IconLeaf className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="tobacco"
                value={tobacco}
                onChange={(e) => setTobacco(e.target.value)}
                placeholder="Enter tobacco type..."
                required
                className="pl-9"
              />
            </div>
          </div>

          {/* Sapling(Kg) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sapling">Sapling (Kg)</Label>
            <div className="relative">
              <IconSeeding className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="sapling"
                type="number"
                min={0.01}
                step="any"
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
