"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import { RepayHistoryDetail } from "@/services/api-client"

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
  green: "#009640",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  greenText: "#059669",
  greenDark: "#065f46",
  greenMuted: "#6ee7b7",
  dark: "#111827",
  mid: "#374151",
  muted: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
  bg: "#f2f2f2",
  white: "#ffffff",
  navy: "#111827",
}

// ── StyleSheet (converted to plain React style objects) ────────────────────────

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
    height: "148mm", /* Exactly half of an A4 page in portrait */
    boxSizing: "border-box",
  },

  // ── Header ──
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

  // ── Meta Grid ──
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

  // ── Table ──
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
  },
  tableCell: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "center",
    padding: "8px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tableCellLeft: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "left",
    padding: "8px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  tableCellRight: {
    fontSize: "12px",
    color: C.dark,
    textAlign: "right",
    padding: "8px 4px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  // Column widths with borders
  colNum: { width: "8%", borderRight: `1px solid ${C.dark}` },
  colConNum: { width: "22%", borderRight: `1px solid ${C.dark}` },
  colName: { width: "40%", borderRight: `1px solid ${C.dark}` },
  colQty: { width: "30%" },

  // ── Note ──
  noteBox: {
    fontSize: "12px",
    color: C.dark,
    border: `1px solid ${C.border}`,
    backgroundColor: C.bg,
    padding: "8px 12px",
    marginBottom: "16px",
  },

  // ── Signatures ──
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
    width: "24%",
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
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RepayInvoiceData {
  record: RepayHistoryDetail
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaRow({ label, value, bold }: Readonly<{ label: string; value: string; bold?: boolean }>) {
  return (
    <div style={s.metaRow}>
      <div style={s.metaLabel}>{label}</div>
      <div style={{ ...s.metaValue, ...(bold ? { fontWeight: "bold" } : {}) }}>: {value}</div>
    </div>
  )
}

// ── Main HTML Document component ───────────────────────────────────────────────

function RepayInvoiceHTML({ record }: Readonly<RepayInvoiceData>) {
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ width: "100%", textAlign: "center" }}>
          <div style={s.companyName}>វិក័យប័ត្រសងសន្លឹកថ្នាំ</div>
        </div>
      </div>

      <div style={s.metaGrid}>
        <div style={s.metaCol}>
          <MetaRow label="លេខវិក័យប័ត្រ" value={record.repay_num ?? "—"} bold />
          <MetaRow label="ឈ្មោះកសិករ" value={record.farmer_name ?? "—"} />
        </div>

        <div style={s.metaCol}>
          <MetaRow label="កាលបរិច្ឆេទ" value={fmtDate(record.repay_date)} />
          <MetaRow label="ឆ្នាំកិច្ចសន្យា" value={record.contract_year == null ? "—" : String(record.contract_year)} />
        </div>
      </div>

      <div style={s.tableWrapper}>
        <div style={s.tableHeader}>
          <div style={{ ...s.tableHeaderCell, ...s.colNum }}>ល.រ</div>
          <div style={{ ...s.tableHeaderCellLeft, ...s.colConNum }}>លេខកុងត្រា</div>
          <div style={{ ...s.tableHeaderCellLeft, ...s.colName }}>ប្រភេទសន្លឹកថ្នាំ</div>
          <div style={{ ...s.tableHeaderCellLeft, ...s.colQty }}>ចំនួន(គីឡូ)</div>
        </div>
        <div style={s.tableRow}>
          <div style={{ ...s.tableCell, ...s.colNum }}>1</div>
          <div style={{ ...s.tableCellLeft, ...s.colConNum }}>{record.con_num ?? "—"}</div>
          <div style={{ ...s.tableCellLeft, ...s.colName }}>{record.tobacco_type ?? "—"}</div>
          <div style={{ ...s.tableCellLeft, ...s.colQty, fontWeight: "bold" }}>{fmt2(record.qty_repay)}</div>
        </div>
      </div>

      {record.note && (
        <div style={s.noteBox}>
          <span style={{ fontWeight: "bold" }}>កំណត់ចំណាំ៖</span> {record.note}
        </div>
      )}

      <div style={s.sigRow}>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>អ្នកទិញ</div>
          <div style={s.sigName}>{record.representative ?? ""}</div>
        </div>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>អ្នកពិនិត្យគុណភាព</div>
          <div style={s.sigName}></div>
        </div>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>បេឡា</div>
          <div style={s.sigName}></div>
        </div>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>ឈ្មោះអ្នកសងសន្លឹកថ្នាំ</div>
          <div style={s.sigName}>{record.farmer_name ?? ""}</div>
        </div>
      </div>
    </div>
  )
}

// ── printRepayInvoice — public API ─────────────────────────────────────────────

export async function printRepayInvoice(data: RepayInvoiceData): Promise<void> {
  // Create a new tab for printing
  const win = window.open("", "_blank")
  if (!win) {
    alert("Please allow popups to print invoices.")
    return
  }

  // Write basic HTML structure to the new window without using deprecated document.write
  win.document.title = `Print Repay - ${data.record.repay_num ?? data.record.repay_id}`
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

  // Render the React component into the new window's DOM
  const root = createRoot(win.document.getElementById("print-root")!)
  root.render(<RepayInvoiceHTML {...data} />)

  // Wait for fonts to load and React to finish rendering, then print
  setTimeout(() => {
    win.print()
  }, 700)
}
