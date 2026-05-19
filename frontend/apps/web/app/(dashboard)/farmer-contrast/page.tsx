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
  IconClipboardList,
  IconLayoutList,
  IconLayoutGrid,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface FarmerContrastCardProps {
  readonly rec: FarmerContrastItem
  readonly index: number
  readonly language: string
}

function FarmerContrastCard({ rec, index, language }: FarmerContrastCardProps) {
  return (
    <Card className="border-gray-200 shadow-sm bg-white hover:border-[#009640]/50 hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">No. {index}</span>
          <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold border border-[#009640]/20">
            {rec.year}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-[#009640] transition-colors">{rec.name}</h3>
          <span className="text-xs text-muted-foreground font-mono">{rec.mf_code}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {language === "kh" ? "ចំនួនកូនថ្នាំ" : "Sapling(Kg)"}
            </span>
            <span className="text-xs font-bold text-foreground mt-0.5 tabular-nums">
              {rec.tobac_num !== undefined && rec.tobac_num !== null ? rec.tobac_num.toLocaleString() : "—"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              {language === "kh" ? "ទិន្នផលរំពឹងទុក" : "Expected Yield"}
            </span>
            <span className="text-xs font-bold text-[#009640] mt-0.5 tabular-nums">
              {rec.expected_yield !== undefined && rec.expected_yield !== null ? `${rec.expected_yield.toLocaleString()} kg` : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ContrastContentProps {
  readonly isLoading: boolean
  readonly records: FarmerContrastItem[]
  readonly noRecordsFound: string
  readonly language: string
  readonly view: "list" | "grid"
  readonly sortBy: "sapling" | "yield" | null
  readonly sortOrder: "asc" | "desc"
  readonly onSort: (field: "sapling" | "yield") => void
}

function ContrastContent({
  isLoading,
  records,
  noRecordsFound,
  language,
  view,
  sortBy,
  sortOrder,
  onSort,
}: ContrastContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <IconLoader2 className="h-7 w-7 animate-spin text-[#009640]" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
          <IconClipboardList className="h-8 w-8 text-[#9CA3AF] stroke-[1.5]" />
          <span>{noRecordsFound}</span>
        </CardContent>
      </Card>
    )
  }

  // Mobile list view
  const mobileList = (
    <div className="grid md:hidden grid-cols-1 gap-3">
      {records.map((rec, idx) => (
        <FarmerContrastCard
          key={rec.mf_con_id}
          rec={rec}
          index={idx + 1}
          language={language}
        />
      ))}
    </div>
  )

  // Tablet list view (below lg screen, showing 2 columns)
  const tabletList = (
    <div className="hidden md:grid lg:hidden grid-cols-2 gap-4">
      {records.map((rec, idx) => (
        <FarmerContrastCard
          key={rec.mf_con_id}
          rec={rec}
          index={idx + 1}
          language={language}
        />
      ))}
    </div>
  )

  // Desktop list or grid view
  const desktopContent = (
    <div className="hidden lg:block">
      {view === "list" ? (
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#F9FAFB] border-gray-200">
                    <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-12">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider">
                      {language === "kh" ? "ឈ្មោះកសិករ" : "Farmer Name"}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                      onClick={() => onSort("sapling")}
                    >
                      <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                        {language === "kh" ? "ចំនួនកូនថ្នាំ" : "Sapling(Kg)"}
                        {sortBy === "sapling" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                        {sortBy === "sapling" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                        {sortBy !== "sapling" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider cursor-pointer group select-none"
                      onClick={() => onSort("yield")}
                    >
                      <div className="flex items-center gap-1 hover:text-[#111827] transition-colors">
                        {language === "kh" ? "ទិន្នផលរំពឹងទុក (គីឡូក្រាម)" : "Expected Leaf Yield (kg)"}
                        {sortBy === "yield" && sortOrder === "asc" && <IconSortAscending className="size-3.5 text-foreground" />}
                        {sortBy === "yield" && sortOrder === "desc" && <IconSortDescending className="size-3.5 text-foreground" />}
                        {sortBy !== "yield" && <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-bold text-[#9CA3AF] text-[10px] uppercase tracking-wider w-24">
                      {language === "kh" ? "ឆ្នាំ" : "Year"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => (
                    <tr
                      key={rec.mf_con_id}
                      className={cn(
                        "group/row border-b border-gray-200 last:border-0 hover:bg-[#F9FAFB] transition-colors",
                        idx % 2 === 1 && "bg-[#F9FAFB]/60"
                      )}
                    >
                      <td className="px-4 py-3.5 text-[#9CA3AF] text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 text-[#111827] font-semibold">
                        {rec.name}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                        {rec.tobac_num !== undefined && rec.tobac_num !== null ? rec.tobac_num.toLocaleString() : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-[#374151] text-xs font-mono">
                        {rec.expected_yield !== undefined && rec.expected_yield !== null ? `${rec.expected_yield.toLocaleString()} kg` : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
                          {rec.year}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
          {records.map((rec, idx) => (
            <FarmerContrastCard
              key={rec.mf_con_id}
              rec={rec}
              index={idx + 1}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {mobileList}
      {tabletList}
      {desktopContent}
    </>
  )
}

export default function FarmerContrastPage() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const { tokens, isLoading: isAuthLoading } = useAuth()
  const { t, language } = useLanguage()

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
  const pageSubtitle =
    language === "kh"
      ? "បង្ហាញបញ្ជីឈ្មោះកសិករដែលមានកិច្ចសន្យាក្នុងឆ្នាំ ២០២៦។"
      : "View list of farmers who have a contract in 2026."
  const searchPlaceholder =
    language === "kh" ? "ស្វែងរកឈ្មោះ ឬអត្តសញ្ញាណប័ណ្ណ..." : "Search by Name or ID..."
  const noRecordsFound =
    language === "kh" ? "រកមិនឃើញកិច្ចសន្យាកសិករទេ។" : "No farmer contracts found."

  return (
    <div className="flex flex-col gap-4">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-xl font-medium text-foreground whitespace-nowrap">
            {pageTitle}
          </h1>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">
            {pageSubtitle}
          </p>
        </div>

        {/* Dynamic Year Pill */}
        <div className="bg-[#009640]/10 text-[#009640] px-3 py-1 rounded-full text-xs font-bold border border-[#009640]/25">
          Year {selectedYear}
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
            {language === "kh" ? "កំណត់ឡើងវិញ" : "Reset Sort"}
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
            placeholder={searchPlaceholder}
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
            <span className="capitalize">{language === "kh" ? "ទាញយកឡើងវិញ" : "Reload"}</span>
          )}
        </Button>
      </div>

      {/* --- CONTENT AREA --- */}
      <ContrastContent
        isLoading={isLoading}
        records={sortedRecords}
        noRecordsFound={noRecordsFound}
        language={language}
        view={view}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  )
}
