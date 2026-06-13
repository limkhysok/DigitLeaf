"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import {
  TobaccoPurchase,
  PurchaserItem,
  RegionItem,
  TobaccoItem,
} from "@/services/api-client"
import { VendorContractItem } from "@/types/tobacco-purchase"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt2(n: number | null | undefined): string {
  if (n == null) return "—"
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

// ── Colour palette ────────────────────────────────────────────────────────────

const C = {
  dark: "#111827",
  mid: "#374151",
  muted: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
  bg: "#f2f2f2",
  white: "#ffffff",
  navy: "#111827",
}

// ── StyleSheet ────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Kantumruy Pro', 'Hanuman', 'Khmer OS Battambang', sans-serif",
    fontSize: "12px",
    color: C.dark,
    backgroundColor: C.white,
    padding: "30px 40px",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "148mm",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "16px",
  },
  companyName: {
    fontSize: "18px",
    fontWeight: "bold",
    color: C.navy,
    marginBottom: "12px",
    textAlign: "center",
  },

  metaGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.bg,
    border: `1px solid ${C.border}`,
    padding: "8px 12px",
    marginBottom: "12px",
    gap: "4px",
    justifyContent: "space-between",
  },
  metaCol: {
    width: "48%",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  metaRow: {
    display: "flex",
    flexDirection: "row",
  },
  metaLabel: {
    fontSize: "12px",
    color: C.navy,
    width: "45%",
  },
  metaValue: {
    fontSize: "12px",
    color: C.dark,
    width: "55%",
  },

  tableWrapper: {
    border: `1px solid ${C.dark}`,
    marginTop: "4px",
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    borderBottom: `1px solid ${C.dark}`,
    fontWeight: "bold",
  },
  tableHeaderCell: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "center",
    padding: "6px 4px",
    boxSizing: "border-box",
  },
  tableHeaderCellLeft: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "left",
    padding: "6px 4px",
    boxSizing: "border-box",
  },
  tableHeaderCellRight: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "right",
    padding: "6px 4px",
    boxSizing: "border-box",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: `1px solid ${C.dark}`,
  },
  tableRowLast: {
    borderBottom: "none",
  },
  tableCell: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "center",
    padding: "5px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCellLeft: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "left",
    padding: "5px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tableCellRight: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "right",
    padding: "5px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  colNum: { width: "8%", borderRight: `1px solid ${C.dark}` },
  colContract: { width: "25%", borderRight: `1px solid ${C.dark}` },
  colTobacco: { width: "35%", borderRight: `1px solid ${C.dark}` },
  colQty: { width: "32%" },

  sigRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  sigBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
  },
  sigLabel: {
    fontSize: "12px",
    color: C.navy,
    marginBottom: "40px",
    textAlign: "center",
  },
  sigLine: {
    width: "80%",
    borderBottom: `1px solid ${C.dark}`,
    marginBottom: "6px",
  },
  sigName: {
    fontSize: "12px",
    color: C.navy,
  },
  noItems: {
    padding: "16px",
    textAlign: "center",
    color: C.light,
    fontSize: "12px",
    width: "100%",
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RepayInvoiceData {
  record: TobaccoPurchase
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  tobaccoTypes: TobaccoItem[]
  vendorContracts: VendorContractItem[]
  mfCode?: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RepayTableRow({
  d,
  i,
  tobaccoTypes,
  vendorContracts,
}: Readonly<{
  d: NonNullable<TobaccoPurchase["returns"]>[number]
  i: number
  tobaccoTypes: TobaccoItem[]
  vendorContracts: VendorContractItem[]
}>) {
  const contract = vendorContracts.find((c) => c.con_id === d.con_id)
  const tobaccoType = tobaccoTypes.find((t) => t.t_id === d.tobac_type)
  const isAlt = i % 2 === 1

  const contractLabel = contract?.con_num ?? "—"
  const tobaccoLabel = tobaccoType?.t_name_kh || tobaccoType?.t_name || "—"

  return (
    <div style={{ ...s.tableRow, ...(isAlt ? { backgroundColor: C.bg } : {}) }}>
      <div style={{ ...s.tableCell, ...s.colNum }}>{i + 1}</div>
      <div style={{ ...s.tableCellLeft, ...s.colContract }}>{contractLabel}</div>
      <div style={{ ...s.tableCellLeft, ...s.colTobacco }}>{tobaccoLabel}</div>
      <div style={{ ...s.tableCellRight, ...s.colQty, fontWeight: "bold" }}>
        {fmt2(d.qty_repay)}
      </div>
    </div>
  )
}

// ── Main HTML Document component ───────────────────────────────────────────────

function RepayInvoiceHTML({
  record,
  purchasers,
  regions,
  tobaccoTypes,
  vendorContracts,
  mfCode,
}: Readonly<RepayInvoiceData>) {
  const purchaser = purchasers.find((p) => p.p_id === record.buyer)
  const region = regions.find((r) => r.reg_id === record.region)
  const returns = record.returns ?? []

  const totalQtyRepay = returns.reduce((sum, d) => sum + (d.qty_repay ?? 0), 0)

  const purchaserLabel = purchaser?.p_name_kh || purchaser?.p_name || "—"
  const regionLabel = region?.reg_name_kh || region?.reg_name || "—"

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ width: "30%" }} />
        <div style={{ width: "40%", textAlign: "center" }}>
          <div style={s.companyName}>វិក័យប័ត្រសងស្លឹកថ្នាំជក់</div>
        </div>
        <div style={{ width: "30%" }} />
      </div>

      <div style={s.metaGrid}>
        <div style={s.metaCol}>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>លេខវិក័យប័ត្រ</div>
            <div style={s.metaValue}>: {record.invoice_num}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>កាលបរិច្ឆេទ</div>
            <div style={s.metaValue}>: {fmtDate(record.tp_date)}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>អ្នកទិញ</div>
            <div style={s.metaValue}>: {purchaserLabel}</div>
          </div>
        </div>

        <div style={s.metaCol}>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>ឈ្មោះកសិករ</div>
            <div style={s.metaValue}>: {record.vendor_name ?? "—"}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>លេខកាតកសិករ</div>
            <div style={s.metaValue}>: {mfCode ?? "—"}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>តំបន់</div>
            <div style={s.metaValue}>: {regionLabel}</div>
          </div>
        </div>
      </div>

      <div style={s.tableWrapper}>
        <div style={s.tableHeader}>
          <div style={{ ...s.tableHeaderCell, ...s.colNum }}>ល.រ</div>
          <div style={{ ...s.tableHeaderCellLeft, ...s.colContract }}>លេខកិច្ចសន្យា</div>
          <div style={{ ...s.tableHeaderCellLeft, ...s.colTobacco }}>ប្រភេទសន្លឹកថ្នាំ</div>
          <div style={{ ...s.tableHeaderCellRight, ...s.colQty }}>បរិមាណសង (គ.ក)</div>
        </div>

        {returns.length === 0 ? (
          <div style={{ ...s.tableRow, justifyContent: "center", padding: "10px 0" }}>
            <div style={s.noItems}>មិនមានទិន្នន័យ</div>
          </div>
        ) : (
          returns.map((d, i) => (
            <RepayTableRow
              key={d.con_id ?? i}
              d={d}
              i={i}
              tobaccoTypes={tobaccoTypes}
              vendorContracts={vendorContracts}
            />
          ))
        )}

        <div style={{ ...s.tableRow, ...s.tableRowLast }}>
          <div style={{ width: "68%", borderRight: `1px solid ${C.dark}`, boxSizing: "border-box" }} />
          <div style={{ ...s.tableCell, width: "32%", fontWeight: "bold" }}>
            <span style={{ marginRight: "4px" }}>សរុប:</span>
            <span>{fmt2(totalQtyRepay)} គ.ក</span>
          </div>
        </div>
      </div>

      <div style={s.sigRow}>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>ឈ្មោះអ្នកទិញ</div>
          <div style={s.sigLine} />
          <div style={s.sigName}>{purchaserLabel === "—" ? "" : purchaserLabel}</div>
        </div>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>បេឡា</div>
          <div style={s.sigLine} />
          <div style={s.sigName}></div>
        </div>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>ឈ្មោះ និង ស្នាមម្រាមដៃ អ្នកលក់បានទទួលប្រាក់</div>
          <div style={s.sigLine} />
          <div style={s.sigName}>{record.vendor_name ?? ""}</div>
        </div>
      </div>
    </div>
  )
}

// ── printRepayInvoice — public API ─────────────────────────────────────────────

export async function printRepayInvoice(data: RepayInvoiceData): Promise<void> {
  const win = window.open("", "_blank")
  if (!win) {
    alert("Please allow popups to print invoices.")
    return
  }

  win.document.title = `Print Repay Invoice - ${data.record.invoice_num}`
  win.document.body.innerHTML = '<div id="print-root"></div>'
  const style = win.document.createElement("style")
  style.innerHTML = `
    @font-face {
      font-family: 'Kantumruy Pro';
      src: url('/font/KantumruyPro-Regular.ttf') format('truetype');
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `
  win.document.head.appendChild(style)

  const root = createRoot(win.document.getElementById("print-root")!)
  root.render(<RepayInvoiceHTML {...data} />)

  setTimeout(() => {
    win.print()
  }, 700)
}
