"use client"

import * as React from "react"
import { createRoot } from "react-dom/client"
import { Document, Page, View, StyleSheet } from "@react-pdf/renderer"
import {
  TobaccoPurchase,
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
} from "@/services/api-client"
import { downloadReactPdf } from "@/utils/download-react-pdf"
import { ensureKhmerCanvasFontLoaded, KhmerLabel, KhmerParagraph } from "@/utils/khmer-pdf-text"

// sigBox is 24% of the content width (515.28pt); leave a small safety margin.
const SIG_LABEL_MAX_WIDTH = 0.24 * 515.28 - 10

// A4 is 210x297mm; the content area below matches the printed half-page height.
const MM_TO_PT = 72 / 25.4
const CONTENT_HEIGHT_PT = 148 * MM_TO_PT

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt2(n: number | null | undefined): string {
  if (n == null) return "\u2014"
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014"
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
  amber: "#fffbeb",
  amberBorder: "#fde68a",
  amberText: "#78350f",
  amberLabel: "#92400e",
  sky: "#38bdf8",
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
    borderBottom: `1px solid ${C.dark}`,
  },
  tableRowAlt: {
    backgroundColor: C.white,
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

  // Column widths with borders
  colNum: { width: "6%", borderRight: `1px solid ${C.dark}` },
  colName: { width: "23%", borderRight: `1px solid ${C.dark}` },
  colGross: { width: "12%", borderRight: `1px solid ${C.dark}` },
  colRemork: { width: "10%", borderRight: `1px solid ${C.dark}` },
  colSack: { width: "10%", borderRight: `1px solid ${C.dark}` },
  colPrice: { width: "12%", borderRight: `1px solid ${C.dark}` },
  colNet: { width: "12%", borderRight: `1px solid ${C.dark}` },
  colTotal: { width: "15%" },

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
  noItems: {
    padding: "16px",
    textAlign: "center",
    color: C.light,
    fontSize: "12px",
    width: "100%",
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceData {
  record: TobaccoPurchase
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  ovens?: OvenItem[] // marked as optional to suppress 'never used' while keeping backward compatibility
  tobaccoTypes: TobaccoItem[]
  mfCode?: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TableRow({
  d,
  i,
  tobaccoTypes,
}: Readonly<{
  d: NonNullable<TobaccoPurchase["details"]>[number]
  i: number
  tobaccoTypes: TobaccoItem[]
}>) {
  const tobaccoType = tobaccoTypes.find(
    (t) => t.t_id === d.tobacco_name
  )
  const item = d
  const net = Math.max(
    0,
    (item.gross_weight ?? 0) - (item.remork_in_kg ?? 0) - (item.sack_in_kg ?? 0)
  )
  const total = Math.round(net * (item.price ?? 0))
  const isAlt = i % 2 === 1

  const tobaccoLabel = tobaccoType?.t_name_kh || tobaccoType?.t_name || "\u2014"

  return (
    <div style={{ ...s.tableRow, ...(isAlt ? s.tableRowAlt : {}) }}>
      <div style={{ ...s.tableCell, ...s.colNum }}>{i + 1}</div>
      <div style={{ ...s.tableCellLeft, ...s.colName }}>{tobaccoLabel}</div>
      <div style={{ ...s.tableCell, ...s.colGross }}>{fmt2(item.gross_weight)}</div>
      <div style={{ ...s.tableCell, ...s.colRemork }}>{fmt2(item.remork_in_kg ?? 0)}</div>
      <div style={{ ...s.tableCell, ...s.colSack }}>{fmt2(item.sack_in_kg ?? 0)}</div>
      <div style={{ ...s.tableCell, ...s.colPrice }}>{item.price?.toLocaleString("en-US") ?? "\u2014"}</div>
      <div style={{ ...s.tableCellRight, ...s.colNet, fontWeight: "bold" }}>{fmt2(net)}</div>
      <div style={{ ...s.tableCellRight, ...s.colTotal, fontWeight: "bold" }}>
        {"\u17db"}{total.toLocaleString("en-US")}
      </div>
    </div>
  )
}

// ── Main HTML Document component ───────────────────────────────────────────────

function InvoiceHTML({
  record,
  purchasers,
  regions,
  tobaccoTypes,
  mfCode,
}: Readonly<InvoiceData>) {
  const purchaser = purchasers.find((p) => p.p_id === record.buyer)
  const region = regions.find((r) => r.reg_id === record.region)
  const details = record.details ?? []

  const totalNetWeight = details.reduce((sum, d) => {
    const net = Math.max(
      0,
      (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0)
    )
    return sum + net
  }, 0)
  const grandTotal = details.reduce((sum, d) => {
    const net = Math.max(
      0,
      (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0)
    )
    return sum + net * (d.price ?? 0)
  }, 0)

  const purchaserLabel = purchaser?.p_name_kh || purchaser?.p_name || "\u2014"
  const regionLabel = region?.reg_name_kh || region?.reg_name || "\u2014"

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ width: "30%" }} />
        <div style={{ width: "40%", textAlign: "center" }}>
          <div style={s.companyName}>វិក័យប័ត្រទិញសន្លឹកថ្នាំ</div>
        </div>
        <div style={{ width: "30%" }} />
      </div>

      <div style={s.metaGrid}>
        <div style={s.metaCol}>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>លេខវិក័យប័ត្រ </div>
            <div style={s.metaValue}>: <span style={{ fontWeight: "bold" }}>{record.invoice_num}</span> </div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>កាលបរិច្ឆេទ</div>
            <div style={s.metaValue}>: {fmtDate(record.tp_date)}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>អត្រាប្តូរប្រាក់</div>
            <div style={s.metaValue}>: {"\u17db"}{record.rate?.toLocaleString("en-US") ?? "\u2014"}</div>
          </div>
        </div>

        <div style={s.metaCol}>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>ឈ្មោះកសិករ</div>
            <div style={s.metaValue}>: {record.vendor_name ?? "\u2014"}</div>
          </div>
          <div style={s.metaRow}>
            <div style={s.metaLabel}>លេខកាតកសិករ</div>
            <div style={s.metaValue}>: {mfCode ?? "\u2014"}</div>
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
          <div style={{ ...s.tableHeaderCellLeft, ...s.colName }}>ប្រភេទសន្លឹកថ្នាំ</div>
          <div style={{ ...s.tableHeaderCell, ...s.colGross }}>ទម្ងន់សរុប</div>
          <div style={{ ...s.tableHeaderCell, ...s.colRemork }}>ទម្ងន់រ៉ឺម៉ក</div>
          <div style={{ ...s.tableHeaderCell, ...s.colSack }}>ទម្ងន់បាវ</div>
          <div style={{ ...s.tableHeaderCell, ...s.colPrice }}>តម្លៃ</div>
          <div style={{ ...s.tableHeaderCellRight, ...s.colNet }}>ទម្ងន់សុទ្ធ</div>
          <div style={{ ...s.tableHeaderCellRight, ...s.colTotal }}>សរុបទឹកប្រាក់</div>
        </div>

        {details.length === 0 ? (
          <div style={{ ...s.tableRow, justifyContent: "center", padding: "10px 0" }}>
            <div style={s.noItems}>មិនមានទិន្នន័យ</div>
          </div>
        ) : (
          details.map((d, i) => (
            <TableRow key={d.tpd_id ?? i} d={d} i={i} tobaccoTypes={tobaccoTypes} />
          ))
        )}

        <div style={{ ...s.tableRow, ...s.tableRowLast }}>
          <div style={{ width: "61%", borderRight: `1px solid ${C.dark}`, boxSizing: "border-box" }} />
          <div style={{ ...s.tableCell, ...s.colPrice }}>
            <span style={{ marginRight: "4px" }}>ចំនួន៖</span>
            <span style={{ fontWeight: "bold" }}>{details.length}</span>
          </div>
          <div style={{ ...s.tableCellRight, ...s.colNet }}>
            <span style={{ fontWeight: "bold" }}>{fmt2(totalNetWeight)}</span>
          </div>
          <div style={{ ...s.tableCellRight, ...s.colTotal }}>
            <span style={{ fontWeight: "bold" }}>
              {"\u17db"}{Math.round(grandTotal).toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </div>

      <div style={s.sigRow}>
        <div style={s.sigBox}>
          <div style={s.sigLabel}>ឈ្មោះអ្នកទិញ </div>
          <div style={s.sigName}>{purchaserLabel === "\u2014" ? "" : purchaserLabel}</div>
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
          <div style={s.sigLabel}>ឈ្មោះ និង ស្នាមម្រាមដៃ អ្នកលក់បានទទួលប្រាក់</div>
          <div style={s.sigName}>{record.vendor_name ?? ""}</div>
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
  content: {
    height: CONTENT_HEIGHT_PT,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: C.navy,
    marginBottom: 12,
    textAlign: "center",
  },
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
  tableWrapper: {
    borderWidth: 1,
    borderColor: C.dark,
    marginTop: 4,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.dark,
  },
  tableHeaderCell: { fontSize: 12, fontWeight: "bold", textAlign: "center", padding: 5 },
  tableHeaderCellLeft: { fontSize: 12, fontWeight: "bold", textAlign: "left", padding: 5 },
  tableHeaderCellRight: { fontSize: 12, fontWeight: "bold", textAlign: "right", padding: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.dark },
  tableCell: { fontSize: 12, textAlign: "center", padding: 4 },
  tableCellLeft: { fontSize: 12, textAlign: "left", padding: 4 },
  tableCellRight: { fontSize: 12, textAlign: "right", padding: 4 },
  colNum: { width: "6%", borderRightWidth: 1, borderRightColor: C.dark },
  colName: { width: "23%", borderRightWidth: 1, borderRightColor: C.dark },
  colGross: { width: "12%", borderRightWidth: 1, borderRightColor: C.dark },
  colRemork: { width: "10%", borderRightWidth: 1, borderRightColor: C.dark },
  colSack: { width: "10%", borderRightWidth: 1, borderRightColor: C.dark },
  colPrice: { width: "12%", borderRightWidth: 1, borderRightColor: C.dark },
  colNet: { width: "12%", borderRightWidth: 1, borderRightColor: C.dark },
  colTotal: { width: "15%" },
  noItems: { padding: 12, textAlign: "center", color: C.light, fontSize: 12, width: "100%" },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  sigBox: { alignItems: "center", width: "24%" },
  sigLabel: { fontSize: 12, color: C.navy, marginBottom: 20, textAlign: "center" },
  sigName: { fontSize: 12, color: C.navy },
})

function PdfTableRow({
  d,
  i,
  tobaccoTypes,
}: Readonly<{
  d: NonNullable<TobaccoPurchase["details"]>[number]
  i: number
  tobaccoTypes: TobaccoItem[]
}>) {
  const tobaccoType = tobaccoTypes.find((t) => t.t_id === d.tobacco_name)
  const net = Math.max(0, (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0))
  const total = Math.round(net * (d.price ?? 0))
  const tobaccoLabel = tobaccoType?.t_name_kh || tobaccoType?.t_name || "—"

  return (
    <View style={pdf.tableRow}>
      <KhmerLabel text={String(i + 1)} style={{ ...pdf.tableCell, ...pdf.colNum }} />
      <KhmerLabel text={tobaccoLabel} style={{ ...pdf.tableCellLeft, ...pdf.colName }} />
      <KhmerLabel text={fmt2(d.gross_weight)} style={{ ...pdf.tableCell, ...pdf.colGross }} />
      <KhmerLabel text={fmt2(d.remork_in_kg ?? 0)} style={{ ...pdf.tableCell, ...pdf.colRemork }} />
      <KhmerLabel text={fmt2(d.sack_in_kg ?? 0)} style={{ ...pdf.tableCell, ...pdf.colSack }} />
      <KhmerLabel text={d.price?.toLocaleString("en-US") ?? "—"} style={{ ...pdf.tableCell, ...pdf.colPrice }} />
      <KhmerLabel text={fmt2(net)} style={{ ...pdf.tableCellRight, ...pdf.colNet, fontWeight: "bold" }} />
      <KhmerLabel
        text={`៛${total.toLocaleString("en-US")}`}
        style={{ ...pdf.tableCellRight, ...pdf.colTotal, fontWeight: "bold" }}
      />
    </View>
  )
}

function InvoicePdfDocument({ record, purchasers, regions, tobaccoTypes, mfCode }: Readonly<InvoiceData>) {
  const purchaser = purchasers.find((p) => p.p_id === record.buyer)
  const region = regions.find((r) => r.reg_id === record.region)
  const details = record.details ?? []

  const totalNetWeight = details.reduce((sum, d) => {
    const net = Math.max(0, (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0))
    return sum + net
  }, 0)
  const grandTotal = details.reduce((sum, d) => {
    const net = Math.max(0, (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0))
    return sum + net * (d.price ?? 0)
  }, 0)

  const purchaserLabel = purchaser?.p_name_kh || purchaser?.p_name || "—"
  const regionLabel = region?.reg_name_kh || region?.reg_name || "—"

  return (
    <Document>
      <Page size="A4" style={pdf.page}>
        <View style={pdf.content}>
          <View style={pdf.header}>
            <View style={{ width: "30%" }} />
            <View style={{ width: "40%" }}>
              <KhmerLabel text="វិក័យប័ត្រទិញសន្លឹកថ្នាំ" style={pdf.companyName} />
            </View>
            <View style={{ width: "30%" }} />
          </View>

          <View style={pdf.metaGrid}>
            <View style={pdf.metaCol}>
              <View style={pdf.metaRow}>
                <KhmerLabel text="លេខវិក័យប័ត្រ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${record.invoice_num}`} style={{ ...pdf.metaValue, fontWeight: "bold" }} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="កាលបរិច្ឆេទ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${fmtDate(record.tp_date)}`} style={pdf.metaValue} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="អត្រាប្តូរប្រាក់" style={pdf.metaLabel} />
                <KhmerLabel text={`: ៛${record.rate?.toLocaleString("en-US") ?? "—"}`} style={pdf.metaValue} />
              </View>
            </View>

            <View style={pdf.metaCol}>
              <View style={pdf.metaRow}>
                <KhmerLabel text="ឈ្មោះកសិករ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${record.vendor_name ?? "—"}`} style={pdf.metaValue} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="លេខកាតកសិករ" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${mfCode ?? "—"}`} style={pdf.metaValue} />
              </View>
              <View style={pdf.metaRow}>
                <KhmerLabel text="តំបន់" style={pdf.metaLabel} />
                <KhmerLabel text={`: ${regionLabel}`} style={pdf.metaValue} />
              </View>
            </View>
          </View>

          <View style={pdf.tableWrapper}>
            <View style={pdf.tableHeader}>
              <KhmerLabel text="ល.រ" style={{ ...pdf.tableHeaderCell, ...pdf.colNum }} />
              <KhmerLabel text="ប្រភេទសន្លឹកថ្នាំ" style={{ ...pdf.tableHeaderCellLeft, ...pdf.colName }} />
              <KhmerLabel text="ទម្ងន់សរុប" style={{ ...pdf.tableHeaderCell, ...pdf.colGross }} />
              <KhmerLabel text="ទម្ងន់រ៉ឺម៉ក" style={{ ...pdf.tableHeaderCell, ...pdf.colRemork }} />
              <KhmerLabel text="ទម្ងន់បាវ" style={{ ...pdf.tableHeaderCell, ...pdf.colSack }} />
              <KhmerLabel text="តម្លៃ" style={{ ...pdf.tableHeaderCell, ...pdf.colPrice }} />
              <KhmerLabel text="ទម្ងន់សុទ្ធ" style={{ ...pdf.tableHeaderCellRight, ...pdf.colNet }} />
              <KhmerLabel text="សរុបទឹកប្រាក់" style={{ ...pdf.tableHeaderCellRight, ...pdf.colTotal }} />
            </View>

            {details.length === 0 ? (
              <KhmerLabel text="មិនមានទិន្នន័យ" style={pdf.noItems} />
            ) : (
              details.map((d, i) => <PdfTableRow key={d.tpd_id ?? i} d={d} i={i} tobaccoTypes={tobaccoTypes} />)
            )}

            <View style={{ ...pdf.tableRow, borderBottomWidth: 0 }}>
              <View style={{ width: "61%", borderRightWidth: 1, borderRightColor: C.dark }} />
              <View style={{ ...pdf.tableCell, ...pdf.colPrice, flexDirection: "row" }}>
                <KhmerLabel text="ចំនួន៖ " style={{ fontSize: 12, color: C.dark }} />
                <KhmerLabel text={String(details.length)} style={{ fontSize: 12, color: C.dark, fontWeight: "bold" }} />
              </View>
              <KhmerLabel
                text={fmt2(totalNetWeight)}
                style={{ ...pdf.tableCellRight, ...pdf.colNet, fontWeight: "bold" }}
              />
              <KhmerLabel
                text={`៛${Math.round(grandTotal).toLocaleString("en-US")}`}
                style={{ ...pdf.tableCellRight, ...pdf.colTotal, fontWeight: "bold" }}
              />
            </View>
          </View>

          <View style={pdf.sigRow}>
            <View style={pdf.sigBox}>
              <KhmerParagraph text="ឈ្មោះអ្នកទិញ" style={pdf.sigLabel} maxWidth={SIG_LABEL_MAX_WIDTH} />
              <KhmerLabel text={purchaserLabel === "—" ? "" : purchaserLabel} style={pdf.sigName} />
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
              <KhmerParagraph
                text="ឈ្មោះ និង ស្នាមម្រាមដៃ អ្នកលក់បានទទួលប្រាក់"
                style={pdf.sigLabel}
                maxWidth={SIG_LABEL_MAX_WIDTH}
              />
              <KhmerLabel text={record.vendor_name ?? ""} style={pdf.sigName} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ── printInvoice — public API ──────────────────────────────────────────────────

export async function printInvoice(data: InvoiceData): Promise<void> {
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

  doc.title = `Print Invoice - ${data.record.invoice_num}`
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
  root.render(<InvoiceHTML {...data} />)

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

// ── downloadInvoicePdf — public API ────────────────────────────────────────────

export async function downloadInvoicePdf(data: InvoiceData): Promise<void> {
  await ensureKhmerCanvasFontLoaded()
  await downloadReactPdf(<InvoicePdfDocument {...data} />, `invoice_${data.record.invoice_num}.pdf`)
}
