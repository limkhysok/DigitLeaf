"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Button } from "@workspace/ui/components/button"
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { FarmerContractItem } from "@/services/api-client"

type SortField = "land" | "sapling" | "yield" | "purchased"

interface ColumnHelpers {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
  sortBy: SortField | null
  sortOrder: "asc" | "desc"
  onSort: (field: SortField) => void
  onEdit: (rec: FarmerContractItem) => void
  onDelete: (rec: FarmerContractItem) => void
}

function SortIcon({ active, order }: { readonly active: boolean; readonly order: "asc" | "desc" }) {
  if (active && order === "asc") return <IconSortAscending className="size-3.5 text-foreground" />
  if (active && order === "desc") return <IconSortDescending className="size-3.5 text-foreground" />
  return <IconArrowsSort className="size-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
      className="flex items-center gap-1 cursor-pointer select-none group hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon active={sortBy === field} order={sortOrder} />
    </button>
  )
}

export function getColumns({ t, sortBy, sortOrder, onSort, onEdit, onDelete }: ColumnHelpers): ColumnDef<FarmerContractItem>[] {
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
      header: () => t.farmerContract.no,
      cell: ({ row }) => <div className="text-muted-foreground">{row.index + 1}</div>,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "name",
      accessorKey: "name",
      header: () => t.farmerContract.farmerName,
      cell: ({ row }) => <div className="font-semibold">{row.getValue("name")}</div>,
      enableHiding: false,
    },
    {
      id: "code",
      accessorKey: "mf_code",
      header: () => t.farmerContract.farmerId,
      cell: ({ row }) => <div className="text-sm">{row.getValue("code")}</div>,
    },
    {
      id: "land",
      accessorKey: "land",
      header: () => <SortableHeader label={t.farmerContract.land} field="land" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />,
      cell: ({ row }) => {
        const val = row.getValue("land") as number | null | undefined
        return <div className="text-sm">{val == null ? <span className="text-muted-foreground/40">—</span> : val.toLocaleString()}</div>
      },
    },
    {
      id: "sapling",
      accessorKey: "tobac_num",
      header: () => <SortableHeader label={t.farmerContract.saplingKg} field="sapling" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />,
      cell: ({ row }) => {
        const val = row.getValue("sapling") as number | null | undefined
        return <div className="text-sm">{val == null ? <span className="text-muted-foreground/40">—</span> : val.toLocaleString()}</div>
      },
    },
    {
      id: "expected",
      accessorKey: "expected_yield",
      header: () => <SortableHeader label={t.farmerContract.expectedYieldKg} field="yield" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />,
      cell: ({ row }) => {
        const val = row.getValue("expected") as number | null | undefined
        return <div className="text-sm">{val == null ? <span className="text-muted-foreground/40">—</span> : val.toLocaleString()}</div>
      },
    },
    {
      id: "purchased",
      accessorKey: "purchased_weight",
      header: () => <SortableHeader label={t.farmerContract.purchasedWeightKg} field="purchased" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />,
      cell: ({ row }) => {
        const val = row.getValue("purchased") as number | null | undefined
        return <div className="text-sm">{val == null ? <span className="text-muted-foreground/40">—</span> : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      },
    },
    {
      id: "year",
      accessorKey: "year",
      header: () => <div className="text-center">{t.farmerContract.year}</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center rounded-full bg-[#009640]/10 text-[#009640] px-2.5 py-0.5 text-xs font-semibold">
            {row.getValue("year")}
          </span>
        </div>
      ),
    },
    {
      id: "date",
      accessorKey: "do_date",
      header: () => <div className="text-center">Date</div>,
      cell: ({ row }) => {
        const doDate = row.getValue("date") as string | null | undefined
        return (
          <div className="text-center text-sm font-mono">
            {doDate
              ? (() => { const [y, m, d] = doDate.split("T")[0]!.split("-"); return `${d ?? ""}/${m ?? ""}/${y ?? ""}` })()
              : <span className="text-muted-foreground/40">—</span>}
          </div>
        )
      },
      enableHiding: false,
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const rec = row.original
        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
                  <IconEye className="h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onSelect={() => onEdit(rec)}>
                  <IconPencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onSelect={() => onDelete(rec)}
                >
                  <IconTrash className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableHiding: false,
    },
  ]
}
