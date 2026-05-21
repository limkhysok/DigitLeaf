"use client"

import * as React from "react"
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer"
import { TobaccoPurchase, PurchaserItem, RegionItem, OvenItem, TobaccoItem } from "@/lib/api-client"

// ── Register fonts (optional — falls back to built-in Kantumruy Pro) ──────────────
Font.register({
  family: "Kantumruy Pro",
  src: "/font/KantumruyPro-Regular.ttf",
})

Font.registerHyphenationCallback((word) => [word])

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt2(n: number | null | undefined): string {
  if (n == null) return "\u2014"
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  bg: "#f9fafb",
  white: "#ffffff",
  navy: "#111827",
  amber: "#fffbeb",
  amberBorder: "#fde68a",
  amberText: "#78350f",
  amberLabel: "#92400e",
  sky: "#38bdf8",
}

// ── StyleSheet ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Kantumruy Pro",
    fontSize: 10,
    color: C.dark,
    backgroundColor: C.white,
    paddingTop: 24,
    paddingBottom: 20,
    paddingLeft: 28,
    paddingRight: 28,
    flexDirection: "column",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: C.green,
    paddingBottom: 8,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 15,
    fontFamily: "Kantumruy Pro",
    color: C.green,
    letterSpacing: -0.2,
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 12,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  invoiceNum: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.green,
    marginTop: 2,
  },

  // ── Meta Grid ──
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
    gap: 4,
  },
  metaItem: {
    width: "48%",
    flexDirection: "column",
    gap: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.light,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
  },

  // ── Vendor Box ──
  vendorBox: {
    flexDirection: "row",
    backgroundColor: C.greenLight,
    borderWidth: 1,
    borderColor: C.greenBorder,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  vendorLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.greenText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
  },
  vendorAddr: {
    fontSize: 10,
    color: C.muted,
    marginTop: 1,
  },

  // ── Table ──
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.dark,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "right",
  },
  tableHeaderCellLeft: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.bg,
  },
  tableRowAlt: {
    backgroundColor: C.bg,
  },
  tableCell: {
    fontSize: 10,
    color: C.mid,
    textAlign: "right",
  },
  tableCellLeft: {
    fontSize: 10,
    color: C.mid,
    fontFamily: "Kantumruy Pro",
    textAlign: "left",
  },
  tableCellGreen: {
    fontSize: 10,
    color: C.green,
    fontFamily: "Kantumruy Pro",
    textAlign: "right",
  },
  tableCellDarkGreen: {
    fontSize: 10,
    color: C.greenDark,
    fontFamily: "Kantumruy Pro",
    textAlign: "right",
  },
  tableCellNum: {
    fontSize: 10,
    color: C.light,
    textAlign: "center",
  },

  // Column widths (sum must be 100%)
  colNum: { width: "5%" },
  colName: { width: "23%" },
  colGross: { width: "10%" },
  colRemork: { width: "9%" },
  colSack: { width: "9%" },
  colNet: { width: "12%" },
  colPrice: { width: "12%" },
  colTotal: { width: "20%" },

  // ── Summary Bar ──
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  summaryBlock: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
  },
  summaryValueGreen: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.greenDark,
  },
  summaryDivider: {
    width: 1,
    height: 22,
    backgroundColor: C.border,
  },

  // ── Rate chip ──
  rateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  rateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rateChipLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.light,
    textTransform: "uppercase",
  },
  rateChipValue: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
  },

  // ── Note ──
  noteBox: {
    backgroundColor: C.amber,
    borderWidth: 1,
    borderColor: C.amberBorder,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.amberLabel,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  noteText: {
    fontSize: 10,
    color: C.amberText,
  },

  // ── Signatures ──
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "dashed",
  },
  sigBox: {
    alignItems: "center",
    width: "24%",
  },
  sigLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.light,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  sigLine: {
    width: "80%",
    marginBottom: 13,
  },
  sigName: {
    fontSize: 10,
    color: C.muted,
  },
  noItems: {
    paddingVertical: 10,
    textAlign: "center",
    color: C.light,
    fontSize: 10,
  },
})

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InvoiceData {
  record: TobaccoPurchase
  purchasers: PurchaserItem[]
  regions: RegionItem[]
  ovens: OvenItem[]
  tobaccoTypes: TobaccoItem[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TableRow({ d, i, tobaccoTypes }: Readonly<{
  d: TobaccoPurchase["details"] extends (infer T)[] | undefined ? T : never
  i: number
  tobaccoTypes: TobaccoItem[]
}>) {
  const tobaccoType = tobaccoTypes.find(t => t.t_id === (d as { tobacco_name?: number }).tobacco_name)
  const item = d as {
    gross_weight?: number | null
    remork_in_kg?: number | null
    sack_in_kg?: number | null
    price?: number | null
  }
  const net = Math.max(0,
    (item.gross_weight ?? 0) - (item.remork_in_kg ?? 0) - (item.sack_in_kg ?? 0)
  )
  const total = Math.round(net * (item.price ?? 0))
  const isAlt = i % 2 === 1

  const tobaccoKh = tobaccoType?.t_name_kh ? ` / ${tobaccoType.t_name_kh}` : ""
  const tobaccoLabel = tobaccoType ? `${tobaccoType.t_name}${tobaccoKh}` : "\u2014"

  return (
    <View style={[s.tableRow, isAlt ? s.tableRowAlt : {}]}>
      <Text style={[s.tableCellNum, s.colNum]}>{i + 1}</Text>
      <Text style={[s.tableCellLeft, s.colName]}>{tobaccoLabel}</Text>
      <Text style={[s.tableCell, s.colGross]}>{fmt2(item.gross_weight)}</Text>
      <Text style={[s.tableCell, s.colRemork]}>{fmt2(item.remork_in_kg ?? 0)}</Text>
      <Text style={[s.tableCell, s.colSack]}>{fmt2(item.sack_in_kg ?? 0)}</Text>
      <Text style={[s.tableCellGreen, s.colNet]}>{fmt2(net)}</Text>
      <Text style={[s.tableCell, s.colPrice]}>{item.price?.toLocaleString("en-US") ?? "\u2014"}</Text>
      <Text style={[s.tableCellDarkGreen, s.colTotal]}>{"\u17db"}{total.toLocaleString("en-US")}</Text>
    </View>
  )
}

// ── Main PDF Document component ───────────────────────────────────────────────

function InvoiceDocument({ record, purchasers, regions, ovens, tobaccoTypes }: Readonly<InvoiceData>) {
  const purchaser = purchasers.find(p => p.p_id === record.buyer)
  const region = regions.find(r => r.reg_id === record.region)
  const oven = ovens.find(o => o.id === record.oven)
  const details = record.details ?? []

  const totalNetWeight = details.reduce((sum, d) => {
    const net = Math.max(0,
      (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0)
    )
    return sum + net
  }, 0)
  const grandTotal = details.reduce((sum, d) => {
    const net = Math.max(0,
      (d.gross_weight ?? 0) - (d.remork_in_kg ?? 0) - (d.sack_in_kg ?? 0)
    )
    return sum + net * (d.price ?? 0)
  }, 0)

  const purchaserKh = purchaser?.p_name_kh ? ` / ${purchaser.p_name_kh}` : ""
  const purchaserLabel = purchaser ? `${purchaser.p_name}${purchaserKh}` : "\u2014"

  const regionKh = region?.reg_name_kh ? ` / ${region.reg_name_kh}` : ""
  const regionLabel = region ? `${region.reg_name}${regionKh}` : "\u2014"

  const ovenKh = oven?.name_kh ? ` / ${oven.name_kh}` : ""
  const ovenLabel = oven ? `${oven.name_en}${ovenKh}` : "\u2014"
  return (
    <Document title={`Invoice ${record.invoice_num}`} author="DigitLeaf">
      {/* Set PDF to A4 Portrait, placing the A5 landscape design on the top half! */}
      <Page size="A4" orientation="portrait" style={{ backgroundColor: "#ffffff" }}>
        {/* A5 Landscape size in points is approx 595x420, which is exactly the top half of A4 Portrait */}
        <View style={[s.page, { width: 595, height: 420, overflow: "hidden", borderBottom: "1px dashed #ccc", paddingTop: 16, paddingBottom: 12 }]}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View>
              <Text style={s.companyName}>វិក័យប័ត្រទិញស្លឹកថ្នាំជក់</Text>            </View>
            <View style={s.invoiceTitleBlock}>
              <Text style={s.invoiceTitle}>លេខវិក័យប័ត្រ {record.invoice_num}</Text>
            </View>
          </View>

          {/* ── Top Info Section (Horizontal) ── */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            {/* Meta Grid Left */}
            <View style={[s.metaGrid, { width: "55%", marginBottom: 0 }]}>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>កាលបរិច្ឆេទ</Text>
                <Text style={s.metaValue}>{fmtDate(record.tp_date)}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>អ្នកទិញ</Text>
                <Text style={s.metaValue}>{purchaserLabel}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>តំបន់</Text>
                <Text style={s.metaValue}>{regionLabel}</Text>
              </View>
              <View style={s.metaItem}>
                <Text style={s.metaLabel}>ឡ</Text>
                <Text style={s.metaValue}>{ovenLabel}</Text>
              </View>
            </View>

            {/* Vendor Box Right */}
            <View style={[s.vendorBox, { width: "43%", marginBottom: 0, flexDirection: "column" }]}>
              <Text style={s.vendorLabel}>អ្នកលក់ / កសិករ</Text>
              <Text style={s.vendorName}>{record.vendor ?? "\u2014"}</Text>
              {record.v_addr ? <Text style={s.vendorAddr}>{record.v_addr}</Text> : null}
            </View>
          </View>

          {/* ── Items Table ── */}
          {/* Header row */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, s.colNum, { textAlign: "center" }]}>ល.រ</Text>
            <Text style={[s.tableHeaderCellLeft, s.colName]}>ប្រភេទថ្នាំជក់</Text>
            <Text style={[s.tableHeaderCell, s.colGross]}>ទម្ងន់សរុប</Text>
            <Text style={[s.tableHeaderCell, s.colRemork]}>ទម្ងន់រ៉ឺម៉ក</Text>
            <Text style={[s.tableHeaderCell, s.colSack]}>ទម្ងន់សាក់</Text>
            <Text style={[s.tableHeaderCell, s.colNet]}>ទម្ងន់សុទ្ធ (Kg)</Text>
            <Text style={[s.tableHeaderCell, s.colPrice]}>តម្លៃ/គីឡូ</Text>
            <Text style={[s.tableHeaderCell, s.colTotal]}>សរុបទឹកប្រាក់</Text>
          </View>

          {/* Detail rows */}
          {details.length === 0 ? (
            <Text style={s.noItems}>មិនមានទិន្នន័យ</Text>
          ) : (
            details.map((d, i) => (
              <TableRow
                key={d.tpd_id ?? i}
                d={d}
                i={i}
                tobaccoTypes={tobaccoTypes}
              />
            ))
          )}

          {/* ── Summary & Rate (Horizontal) ── */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4, marginBottom: 8 }}>

            {/* Rate row */}
            <View style={[s.rateRow, { marginBottom: 0 }]}>
              <View style={s.rateChip}>
                <Text style={s.rateChipLabel}>អត្រាប្តូរប្រាក់</Text>
                <Text style={s.rateChipValue}>{"\u17db"}{record.rate?.toLocaleString("en-US") ?? "\u2014"} / ដុល្លារ</Text>
              </View>
            </View>

            {/* Summary Bar */}
            <View style={[s.summaryBar, { width: "65%", marginTop: 0, marginBottom: 0 }]}>
              <View style={s.summaryBlock}>
                <Text style={s.summaryLabel}>សរុបចំនួនមុខ</Text>
                <Text style={s.summaryValue}>{details.length}</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryBlock}>
                <Text style={s.summaryLabel}>ទម្ងន់សុទ្ធសរុប</Text>
                <Text style={s.summaryValue}>{fmt2(totalNetWeight)} Kg</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryBlock}>
                <Text style={s.summaryLabel}>សរុបទឹកប្រាក់រួម</Text>
                <Text style={s.summaryValueGreen}>{"\u17db"}{Math.round(grandTotal).toLocaleString("en-US")}</Text>
              </View>
            </View>
          </View>

          {/* ── Note (optional) ── */}
          {record.tp_note ? (
            <View style={s.noteBox}>
              <Text style={s.noteLabel}>ចំណាំ</Text>
              <Text style={s.noteText}>{record.tp_note}</Text>
            </View>
          ) : null}

          {/* ── Signatures ── */}
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>ឈ្មោះអ្នកទិញ </Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{purchaserLabel === "\u2014" ? "_______________" : purchaserLabel}</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>អ្នកពិនិត្យគុណភាព</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>_______________</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>បេឡា</Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>_______________</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>ឈ្មោះ និង ស្នាមម្រាមដៃ អ្នកលក់បានទទួលប្រាក់</Text>

              <Text style={s.sigName}>{record.vendor ?? "_______________"}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// ── printInvoice — public API (same signature as before) ─────────────────────

export async function printInvoice(data: InvoiceData): Promise<void> {
  // Generate the PDF as a Blob using @react-pdf/renderer
  const doc = <InvoiceDocument {...data} />
  const blob = await pdf(doc).toBlob()
  const url = URL.createObjectURL(blob)

  // Open in a new tab — the browser's built-in PDF viewer handles printing
  const win = window.open(url, "_blank")
  if (!win) {
    // Fallback: trigger a direct download if pop-up is blocked
    const a = document.createElement("a")
    a.href = url
    a.download = `Invoice-${data.record.invoice_num}.pdf`
    a.click()
  }

  // Clean up the object URL after a delay to allow the tab/download to start
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
