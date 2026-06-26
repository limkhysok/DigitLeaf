"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { IconArrowsSort, IconSortAscending, IconSortDescending, IconEye } from "@tabler/icons-react"
import { TobaccoRepayItem } from "@/services/api-client"

type SortField = "Quantity" | "total_repaid"

interface ColumnHelpers {
  t: any
  sortBy: SortField | null
  sortOrder: "asc" | "desc"
  onSort: (field: SortField) => void
  onView: (rec: TobaccoRepayItem) => void
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

export function getSummaryColumns({ t, sortBy, sortOrder, onSort, onView }: ColumnHelpers): ColumnDef<TobaccoRepayItem>[] {
  const tbl = t.tobaccoRepay.summaryTable
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
          aria-label={tbl.selectAll}
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={tbl.selectRow}
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      header: () => tbl.no,
      cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "contractNo",
      accessorKey: "contract_number",
      header: () => tbl.contractNo,
      cell: ({ row }) => <div className="font-medium">{row.getValue("contractNo") || "—"}</div>,
    },
    {
      id: "representative",
      accessorKey: "representative",
      header: () => tbl.representative,
      cell: ({ row }) => <div>{row.getValue("representative") || "—"}</div>,
    },
    {
      id: "contractor",
      accessorKey: "contract_contractor_name",
      header: () => tbl.farmer,
      cell: ({ row }) => <div>{row.getValue("contractor") || "—"}</div>,
    },
    {
      id: "tobaccoType",
      accessorKey: "tobacco_type",
      header: () => tbl.tobaccoType,
      cell: ({ row }) => <div>{row.getValue("tobaccoType") || "—"}</div>,
    },
    {
      id: "year",
      accessorKey: "contract_year",
      header: () => <div className="text-center">{tbl.year}</div>,
      cell: ({ row }) => <div className="text-center font-medium">{row.getValue("year") || "—"}</div>,
    },
    {
      id: "qty",
      accessorKey: "Quantity",
      header: () => (
        <div className="text-right">
          <SortableHeader label={tbl.amountKg} field="Quantity" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </div>
      ),
      cell: ({ row }) => {
        const val = row.getValue("qty") as number | null
        return <div className="text-right">{val == null ? "—" : val.toLocaleString()}</div>
      },
    },
    {
      id: "totalReturned",
      accessorKey: "total_repaid",
      header: () => (
        <div className="text-right">
          <SortableHeader label={tbl.deliveryKg} field="total_repaid" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
        </div>
      ),
      cell: ({ row }) => {
        const val = row.getValue("totalReturned") as number | null
        return <div className="text-right font-medium">{val == null ? "—" : val.toLocaleString()}</div>
      },
    },
    {
      id: "status",
      header: () => <div className="text-center">{tbl.status}</div>,
      cell: ({ row }) => {
        const rec = row.original
        const isCompleted = rec.Quantity != null && rec.total_repaid != null && rec.total_repaid === rec.Quantity
        return (
          <div className="text-center">
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-500/15 text-green-700 dark:border-green-400/50 dark:bg-green-400/15 dark:text-green-300 px-3 py-1 text-[13px] font-semibold">
                {tbl.completed}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-500/15 text-yellow-700 dark:border-yellow-400/50 dark:bg-yellow-400/15 dark:text-yellow-300 px-3 py-1 text-sm font-semibold tracking-wide">
                {tbl.pending}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">{tbl.actions}</div>,
      cell: ({ row }) => {
        const rec = row.original
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onView(rec) }}
            >
              <span className="sr-only">{tbl.view}</span>
              <IconEye className="h-4 w-4 text-muted-foreground/70" />
            </Button>
          </div>
        )
      },
      enableHiding: false,
    },
  ]
}
