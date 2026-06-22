"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react"
import { TobaccoRepayItem } from "@/services/api-client"

type SortField = "Quantity" | "total_repaid"

interface ColumnHelpers {
  sortBy: SortField | null
  sortOrder: "asc" | "desc"
  onSort: (field: SortField) => void
}

function SortIcon({ active, order }: { readonly active: boolean; readonly order: "asc" | "desc" }) {
  if (!active) return <IconArrowsSort className="size-3.5 text-muted-foreground/50" />
  return order === "asc"
    ? <IconSortAscending className="size-3.5" />
    : <IconSortDescending className="size-3.5" />
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  readonly label: string
  readonly field: SortField
  readonly sortBy: SortField | null
  readonly sortOrder: "asc" | "desc"
  readonly onSort: (field: SortField) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <SortIcon active={sortBy === field} order={sortOrder} />
    </button>
  )
}

export function getSummaryColumns({ sortBy, sortOrder, onSort }: ColumnHelpers): ColumnDef<TobaccoRepayItem>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      header: () => "No.",
      cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "contractNo",
      accessorKey: "contract_number",
      header: () => "Contract No",
      cell: ({ row }) => <div className="font-medium">{row.getValue("contractNo") || "—"}</div>,
    },
    {
      id: "contractor",
      accessorKey: "contract_contractor_name",
      header: () => "Contractor",
      cell: ({ row }) => <div>{row.getValue("contractor") || "—"}</div>,
    },
    {
      id: "representative",
      accessorKey: "representative",
      header: () => "Representative",
      cell: ({ row }) => <div>{row.getValue("representative") || "—"}</div>,
    },
    {
      id: "tobaccoType",
      accessorKey: "tobacco_type",
      header: () => "Tobacco Type",
      cell: ({ row }) => <div>{row.getValue("tobaccoType") || "—"}</div>,
    },
    {
      id: "year",
      accessorKey: "contract_year",
      header: () => <div className="text-center">Year</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("year") || "—"}</div>,
    },
    {
      id: "qty",
      accessorKey: "Quantity",
      header: () => (
        <div className="text-right">
          <SortableHeader label="Quantity" field="Quantity" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </div>
      ),
      cell: ({ row }) => {
        const val = row.getValue("qty") as number | null
        return <div className="text-right">{val == null ? "—" : `${val.toLocaleString()} kg`}</div>
      },
    },
    {
      id: "totalReturned",
      accessorKey: "total_repaid",
      header: () => <div className="text-right">Total Repaid</div>,
      cell: ({ row }) => {
        const val = row.getValue("totalReturned") as number | null
        return <div className="text-right font-medium">{val == null ? "—" : `${val.toLocaleString()} kg`}</div>
      },
    },
  ]
}
