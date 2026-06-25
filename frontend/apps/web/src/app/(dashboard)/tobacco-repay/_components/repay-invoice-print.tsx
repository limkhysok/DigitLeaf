"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import { Document, Page, View, StyleSheet } from "@react-pdf/renderer"
import { RepayHistoryDetail } from "@/services/api-client"
import { downloadReactPdf } from "@/utils/download-react-pdf"
import { ensureKhmerCanvasFontLoaded, KhmerLabel, KhmerParagraph } from "@/utils/khmer-pdf-text"

// sigBox is 24% of the content width (515.28pt); leave a small safety margin.
const SIG_LABEL_MAX_WIDTH = 0.24 * 515.28 - 10

const MM_TO_PT = 72 / 25.4
const CONTENT_HEIGHT_PT = 148 * MM_TO_PT

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
    marginBottom: "20px",
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
          <MetaRow label="កាលបរិច្ឆេទ" value={fmtDate(record.repay_date)} />

        </div>

        <div style={s.metaCol}>
          <MetaRow label="ឈ្មោះកសិករ" value={record.farmer_name ?? "—"} />
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

// ── PDF (vector, no DOM rasterization) ─────────────────────────────────────────

const pdf = StyleSheet.create({
  page: {
    fontSize: 12,
    color: C.dark,
    backgroundColor: C.white,
    paddingVertical: 30,
    paddingHorizontal: 40,
  },
  content: { height: CONTENT_HEIGHT_PT },
  header: { marginBottom: 16 },
  companyName: { fontSize: 18, fontWeight: "bold", color: C.navy, textAlign: "center" },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  metaCol: { width: "48%" },
  metaRow: { flexDirection: "row", marginBottom: 6 },
  metaLabel: { fontSize: 12, color: C.navy, width: "45%" },
  metaValue: { fontSize: 12, color: C.dark, width: "55%" },
  tableWrapper: { borderWidth: 1, borderColor: C.dark, marginTop: 4, marginBottom: 16 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.dark },
  tableHeaderCell: { fontSize: 12, fontWeight: "bold", textAlign: "center", padding: 5 },
  tableHeaderCellLeft: { fontSize: 12, fontWeight: "bold", textAlign: "left", padding: 5 },
  tableRow: { flexDirection: "row" },
  tableCell: { fontSize: 12, textAlign: "center", padding: 6 },
  tableCellLeft: { fontSize: 12, textAlign: "left", padding: 6 },
  colNum: { width: "8%", borderRightWidth: 1, borderRightColor: C.dark },
  colConNum: { width: "22%", borderRightWidth: 1, borderRightColor: C.dark },
  colName: { width: "40%", borderRightWidth: 1, borderRightColor: C.dark },
  colQty: { width: "30%" },
  noteBox: {
    fontSize: 12,
    color: C.dark,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  sigBox: { alignItems: "center", width: "24%" },
  sigLabel: { fontSize: 12, color: C.navy, marginBottom: 20, textAlign: "center" },
  sigName: { fontSize: 12, color: C.navy },
})

// Page width (595pt) minus page padding (40pt*2) minus noteBox padding (12pt*2)
const NOTE_MAX_WIDTH = 595.28 - 40 * 2 - 12 * 2

function RepayInvoicePdfDocument({ record }: Readonly<RepayInvoiceData>) {
  return (
    <Document>
      <Page size="A4" style={pdf.page}>
        <View style={pdf.content}>
          <View style={pdf.header}>
            <KhmerLabel text="វិក័យប័ត្រសងសន្លឹកថ្នាំ" style={pdf.companyName} />
          </View>

          <View style={pdf.metaGrid}>
            <View style={pdf.metaCol}>
              <View style={pdf.metaRow}>
                <KhmerLabel text="លេខវិក័យប័ត្រ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${record.repay_num ?? "—"}`} style={{ ...pdf.metaValue, fontWeight: "bold" }} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="កាលបរិច្ឆេទ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${fmtDate(record.repay_date)}`} style={pdf.metaValue} />
              </View>
            </View>

            <View style={pdf.metaCol}>
              <View style={pdf.metaRow}>
                <KhmerLabel text="ឈ្មោះកសិករ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${record.farmer_name ?? "—"}`} style={pdf.metaValue} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="ឆ្នាំកិច្ចសន្យា" style={pdf.metaLabel} />
                <KhmerLabel
                  text={`: ${record.contract_year == null ? "—" : String(record.contract_year)}`}
                  style={pdf.metaValue}
                />
              </View>
            </View>
          </View>

          <View style={pdf.tableWrapper}>
            <View style={pdf.tableHeader}>
              <KhmerLabel text="ល.រ" style={{ ...pdf.tableHeaderCell, ...pdf.colNum }} />
              <KhmerLabel text="លេខកុងត្រា" style={{ ...pdf.tableHeaderCellLeft, ...pdf.colConNum }} />
              <KhmerLabel text="ប្រភេទសន្លឹកថ្នាំ" style={{ ...pdf.tableHeaderCellLeft, ...pdf.colName }} />
              <KhmerLabel text="ចំនួន(គីឡូ)" style={{ ...pdf.tableHeaderCellLeft, ...pdf.colQty }} />
            </View>
            <View style={pdf.tableRow}>
              <KhmerLabel text="1" style={{ ...pdf.tableCell, ...pdf.colNum }} />
              <KhmerLabel text={record.con_num ?? "—"} style={{ ...pdf.tableCellLeft, ...pdf.colConNum }} />
              <KhmerLabel text={record.tobacco_type ?? "—"} style={{ ...pdf.tableCellLeft, ...pdf.colName }} />
              <KhmerLabel
                text={fmt2(record.qty_repay)}
                style={{ ...pdf.tableCellLeft, ...pdf.colQty, fontWeight: "bold" }}
              />
            </View>
          </View>

          {record.note && (
            <View style={pdf.noteBox}>
              <View style={{ flexDirection: "row" }}>
                <KhmerLabel text="កំណត់ចំណាំ៖ " style={{ fontSize: 12, color: C.dark, fontWeight: "bold" }} />
              </View>
              <KhmerParagraph text={record.note} style={{ fontSize: 12, color: C.dark }} maxWidth={NOTE_MAX_WIDTH} />
            </View>
          )}

          <View style={pdf.sigRow}>
            <View style={pdf.sigBox}>
              <KhmerParagraph text="អ្នកទិញ" style={pdf.sigLabel} maxWidth={SIG_LABEL_MAX_WIDTH} />
              <KhmerLabel text={record.representative ?? ""} style={pdf.sigName} />
            </View>
            <View style={pdf.sigBox}>
              <KhmerParagraph text="អ្នកពិនិត្យគុណភាព" style={pdf.sigLabel} maxWidth={SIG_LABEL_MAX_WIDTH} />
              <KhmerLabel text="" style={pdf.sigName} />
            </View>
            <View style={pdf.sigBox}>
              <KhmerParagraph text="បេឡា" style={pdf.sigLabel} maxWidth={SIG_LABEL_MAX_WIDTH} />
              <KhmerLabel text="" style={pdf.sigName} />
            </View>
            <View style={pdf.sigBox}>
              <KhmerParagraph text="ឈ្មោះអ្នកសងសន្លឹកថ្នាំ" style={pdf.sigLabel} maxWidth={SIG_LABEL_MAX_WIDTH} />
              <KhmerLabel text={record.farmer_name ?? ""} style={pdf.sigName} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ── printRepayInvoice — public API ─────────────────────────────────────────────

export async function printRepayInvoice(data: RepayInvoiceData): Promise<void> {
  // Print via a hidden iframe so the print dialog appears without navigating to a new tab
  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const win = iframe.contentWindow
  const doc = win?.document
  if (!win || !doc) {
    iframe.remove()
    alert("Unable to prepare the invoice for printing.")
    return
  }

  doc.title = `Print Repay - ${data.record.repay_num ?? data.record.repay_id}`
  doc.body.innerHTML = '<div id="print-root"></div>'
  const style = doc.createElement("style")
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
  doc.head.appendChild(style)

  // Render the React component into the iframe's DOM
  const root = createRoot(doc.getElementById("print-root")!)
  root.render(<RepayInvoiceHTML {...data} />)

  const cleanup = () => {
    root.unmount()
    iframe.remove()
  }
  win.addEventListener("afterprint", cleanup, { once: true })

  // Wait for fonts to load and React to finish rendering, then print
  setTimeout(() => {
    win.focus()
    win.print()
    // Fallback cleanup in case the browser doesn't fire afterprint
    setTimeout(cleanup, 5000)
  }, 700)
}

// ── downloadRepayInvoicePdf — public API ───────────────────────────────────────

export async function downloadRepayInvoicePdf(data: RepayInvoiceData): Promise<void> {
  await ensureKhmerCanvasFontLoaded()
  const filename = `repay_invoice_${data.record.repay_num ?? data.record.repay_id}.pdf`
  await downloadReactPdf(<RepayInvoicePdfDocument {...data} />, filename)
}
