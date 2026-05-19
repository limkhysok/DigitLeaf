"use client"

import * as React from "react"
import { useAuth } from "@/hooks/use-auth"
import { useLanguage } from "@/hooks/use-language"
import { apiClient, FarmerContrastItem } from "@/lib/api-client"
import { toast } from "sonner"
import {
  IconLoader2,
  IconSearch,
  IconX,
  IconLayoutList,
  IconLayoutGrid,
} from "@tabler/icons-react"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ContrastContent } from "./_components/contrast-content"

export default function FarmerContrastPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()

  // --- State ---
  const [records, setRecords] = React.useState<FarmerContrastItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [view, setView] = React.useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = React.useState<"sapling" | "yield" | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const selectedYear = 2026

  // --- Fetch Data ---
  const handleReload = React.useCallback(async () => {
    if (isAuthLoading || !tokens?.access_token) return
    setIsLoading(true)
    try {
      const data = await apiClient.getFarmerContrasts(tokens.access_token, selectedYear)
      setRecords(data)
    } catch (err) {
      toast.error((err as Error).message || "Failed to fetch farmer contrasts")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthLoading, tokens, selectedYear])

  React.useEffect(() => {
    if (isAuthLoading || !tokens?.access_token) return
    let active = true

    async function load() {
      setIsLoading(true)
      try {
        const data = await apiClient.getFarmerContrasts(tokens!.access_token, selectedYear)
        if (active) {
          setRecords(data)
        }
      } catch (err) {
        toast.error((err as Error).message || "Failed to fetch farmer contrasts")
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [isAuthLoading, tokens, selectedYear])

  // --- Sorting Trigger ---
  const handleSort = React.useCallback((field: "sapling" | "yield") => {
    setSortBy((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"))
        return field
      }
      setSortOrder("desc")
      return field
    })
  }, [])

  // --- Filtered records ---
  const filteredRecords = React.useMemo(() => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return records
    return records.filter(
      (rec) =>
        rec.name.toLowerCase().includes(term) ||
        rec.mf_code.toLowerCase().includes(term)
    )
  }, [records, searchInput])

  // --- Sorted records ---
  const sortedRecords = React.useMemo(() => {
    if (!sortBy) return filteredRecords
    return [...filteredRecords].sort((a, b) => {
      const valA = sortBy === "sapling" ? (a.tobac_num ?? 0) : (a.expected_yield ?? 0)
      const valB = sortBy === "sapling" ? (b.tobac_num ?? 0) : (b.expected_yield ?? 0)
      return sortOrder === "asc" ? valA - valB : valB - valA
    })
  }, [filteredRecords, sortBy, sortOrder])

  if (!mounted) return null

  // Localization Helpers
  const pageTitle = t.sidebar.farmerContrast || "Farmer Contrast"

  return (
    <div className="flex flex-col gap-4">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            {t.farmerContrast.subtitle}
          </p>
        </div>

        {/* Dynamic Year Pill */}
        <div className="bg-[#009640]/10 text-[#009640] px-3 py-1 rounded-full text-xs font-bold border border-[#009640]/25">
          {t.farmerContrast.year} {selectedYear}
        </div>
      </div>

      {/* --- FILTER BAR --- */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Dynamic sorting reset action */}
        {sortBy !== null && (
          <button
            onClick={() => setSortBy(null)}
            className="text-xs text-muted-foreground hover:text-[#009640] font-medium transition-colors"
          >
            {t.farmerContrast.resetSort}
          </button>
        )}

        <div className="flex-1 min-w-0" />

        {/* View togglers */}
        <div className="hidden lg:flex items-center rounded-full border border-gray-200 p-0.5 gap-0.5">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200",
              view === "list"
                ? "bg-[#009640] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutList className="size-3.5" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full transition-all duration-200",
              view === "grid"
                ? "bg-[#009640] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <IconLayoutGrid className="size-3.5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.farmerContrast.searchPlaceholder}
            className="pl-9 pr-8 h-9 text-sm rounded-md border-gray-300 focus-visible:ring-[#009640] focus-visible:border-[#009640]"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-2.5 text-[#9CA3AF] hover:text-foreground transition-colors"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick reload action */}
        <Button
          onClick={handleReload}
          variant="outline"
          className="h-9 px-3 text-xs gap-1 border-gray-300 hover:bg-[#F9FAFB] text-[#374151]"
          disabled={isLoading}
        >
          {isLoading ? (
            <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span className="capitalize">{t.farmerContrast.reload}</span>
          )}
        </Button>
      </div>

      {/* --- CONTENT AREA --- */}
      <ContrastContent
        isLoading={isLoading}
        records={sortedRecords}
        view={view}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  )
}
