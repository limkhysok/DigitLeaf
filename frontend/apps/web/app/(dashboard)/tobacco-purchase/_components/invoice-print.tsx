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
import {
  TobaccoPurchase,
  PurchaserItem,
  RegionItem,
  OvenItem,
  TobaccoItem,
} from "@/lib/api-client"

// ── Register fonts (optional — falls back to built-in Noto Sans Khmer) ──────────────
Font.register({
  family: "Kantumruy Pro",
  src: "/font/KantumruyPro-Regular.ttf",
})

Font.registerHyphenationCallback((word) => [word])

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
  bg: "#f2f2f2ff",
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
    paddingLeft: 40,
    paddingRight: 40,
    flexDirection: "column",
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  companyName: {
    fontSize: 15,
    fontFamily: "Kantumruy Pro",
    color: C.navy,
    marginBottom: 17,
  },
  invoiceTitleBlock: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 13,
    fontFamily: "Kantumruy Pro",
    color: C.navy,
  },
  invoiceNum: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.navy,
    marginTop: 2,
  },

  // ── Meta Grid ──
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.bg,
    borderWidth: 0.2,
    borderColor: C.border,
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
    color: C.navy,
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
    color: C.navy,
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
  tableWrapper: {
    borderWidth: 1,
    borderColor: C.dark,
    marginTop: 4,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: C.dark,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
    textAlign: "right",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableHeaderCellLeft: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.dark,
    textAlign: "left",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.dark,
  },
  tableRowAlt: {
    backgroundColor: C.white,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 10,
    color: C.dark,
    textAlign: "right",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCellLeft: {
    fontSize: 10,
    color: C.dark,
    fontFamily: "Kantumruy Pro",
    textAlign: "left",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCellGreen: {
    fontSize: 10,
    color: C.dark,
    fontFamily: "Kantumruy Pro",
    textAlign: "right",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCellDarkGreen: {
    fontSize: 10,
    color: C.dark,
    fontFamily: "Kantumruy Pro",
    textAlign: "right",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  tableCellNum: {
    fontSize: 10,
    color: C.dark,
    textAlign: "center",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },

  // Column widths with borders
  colNum: { width: "5%", borderRightWidth: 1, borderColor: C.dark },
  colName: { width: "23%", borderRightWidth: 1, borderColor: C.dark },
  colGross: { width: "10%", borderRightWidth: 1, borderColor: C.dark },
  colRemork: { width: "9%", borderRightWidth: 1, borderColor: C.dark },
  colSack: { width: "9%", borderRightWidth: 1, borderColor: C.dark },
  colNet: { width: "12%", borderRightWidth: 1, borderColor: C.dark },
  colPrice: { width: "12%", borderRightWidth: 1, borderColor: C.dark },
  colTotal: { width: "20%" },

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
  },
  sigBox: {
    alignItems: "center",
    width: "24%",
  },
  sigLabel: {
    fontSize: 10,
    fontFamily: "Kantumruy Pro",
    color: C.navy,
    marginBottom: 12,
  },
  sigLine: {
    width: "80%",
    marginBottom: 13,
  },
  sigName: {
    fontSize: 10,
    color: C.navy,
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
  mfCode?: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TableRow({
  d,
  i,
  tobaccoTypes,
}: Readonly<{
  d: TobaccoPurchase["details"] extends (infer T)[] | undefined ? T : never
  i: number
  tobaccoTypes: TobaccoItem[]
}>) {
  const tobaccoType = tobaccoTypes.find(
    (t) => t.t_id === (d as { tobacco_name?: number }).tobacco_name
  )
  const item = d as {
    gross_weight?: number | null
    remork_in_kg?: number | null
    sack_in_kg?: number | null
    price?: number | null
  }
  const net = Math.max(
    0,
    (item.gross_weight ?? 0) - (item.remork_in_kg ?? 0) - (item.sack_in_kg ?? 0)
  )
  const total = Math.round(net * (item.price ?? 0))
  const isAlt = i % 2 === 1

  const tobaccoLabel = tobaccoType?.t_name_kh || tobaccoType?.t_name || "\u2014"

  return (
    <View style={[s.tableRow, isAlt ? s.tableRowAlt : {}]}>
      <Text style={[s.tableCellNum, s.colNum]}>{i + 1}</Text>
      <Text style={[s.tableCellLeft, s.colName]}>{tobaccoLabel}</Text>
      <Text style={[s.tableCell, s.colGross, { textAlign: "center" }]}>
        {fmt2(item.gross_weight)}
      </Text>
      <Text style={[s.tableCell, s.colRemork, { textAlign: "center" }]}>
        {fmt2(item.remork_in_kg ?? 0)}
      </Text>
      <Text style={[s.tableCell, s.colSack, { textAlign: "center" }]}>
        {fmt2(item.sack_in_kg ?? 0)}
      </Text>
      <Text style={[s.tableCell, s.colPrice, { textAlign: "center" }]}>
        {item.price?.toLocaleString("en-US") ?? "\u2014"}
      </Text>
      <Text style={[s.tableCellGreen, s.colNet, { textAlign: "center" }]}>
        {fmt2(net)}
      </Text>
      <Text style={[s.tableCellDarkGreen, s.colTotal]}>
        {"\u17db"}
        {total.toLocaleString("en-US")}
      </Text>
    </View>
  )
}

// ── Main PDF Document component ───────────────────────────────────────────────

function InvoiceDocument({
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
    <Document title={`Invoice ${record.invoice_num}`} author="DigitLeaf">
      <Page
        size="A4"
        orientation="portrait"
        style={{ backgroundColor: "#ffffff" }}
      >
        <View
          style={[
            s.page,
            {
              width: 595,
              height: 420,
              overflow: "hidden",
              borderBottom: "1px dashed #ccc",
              paddingTop: 40,
              paddingBottom: 12,
            },
          ]}
        >
          <View style={s.header}>
            <View style={{ width: "30%" }} />
            <View style={{ width: "40%", alignItems: "center" }}>
              <Text style={s.companyName}>វិក័យប័ត្រទិញស្លឹកថ្នាំជក់</Text>
            </View>
            <View style={{ width: "30%" }} />
          </View>

          <View
            style={[
              s.metaGrid,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
                width: "100%",
              },
            ]}
          >
            <View style={{ width: "48%", flexDirection: "column", gap: 6 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>
                  លេខវិក័យប័ត្រ
                </Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {record.invoice_num}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>កាលបរិច្ឆេទ</Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {fmtDate(record.tp_date)}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>
                  អត្រាប្តូរប្រាក់
                </Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {"\u17db"}
                  {record.rate?.toLocaleString("en-US") ?? "\u2014"}
                </Text>
              </View>
            </View>

            <View style={{ width: "48%", flexDirection: "column", gap: 6 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>ឈ្មោះកសិករ </Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {record.vendor ?? "\u2014"}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>លេខកាតកសិករ</Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {mfCode ?? "\u2014"}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={[{ width: "45%" }, s.metaLabel]}>តំបន់</Text>
                <Text style={[{ width: "55%" }, s.metaValue]}>
                  : {regionLabel}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.tableWrapper}>
            <View style={s.tableHeader}>
              <Text
                style={[s.tableHeaderCell, s.colNum, { textAlign: "center" }]}
              >
                ល.រ
              </Text>
              <Text style={[s.tableHeaderCellLeft, s.colName]}>
                ប្រភេទសន្លឹកថ្នាំ
              </Text>
              <Text
                style={[s.tableHeaderCell, s.colGross, { textAlign: "center" }]}
              >
                ទម្ងន់សរុប
              </Text>
              <Text
                style={[
                  s.tableHeaderCell,
                  s.colRemork,
                  { textAlign: "center" },
                ]}
              >
                ទម្ងន់រ៉ឺម៉ក
              </Text>
              <Text
                style={[s.tableHeaderCell, s.colSack, { textAlign: "center" }]}
              >
                ទម្ងន់បាវ
              </Text>
              <Text
                style={[s.tableHeaderCell, s.colPrice, { textAlign: "center" }]}
              >
                តម្លៃ
              </Text>
              <Text
                style={[s.tableHeaderCell, s.colNet, { textAlign: "center" }]}
              >
                ទម្ងន់សុទ្ធ
              </Text>
              <Text style={[s.tableHeaderCell, s.colTotal]}>សរុបទឹកប្រាក់</Text>
            </View>

            {details.length === 0 ? (
              <View
                style={[
                  s.tableRow,
                  { justifyContent: "center", paddingVertical: 10 },
                ]}
              >
                <Text style={s.noItems}>មិនមានទិន្នន័យ</Text>
              </View>
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

            <View style={[s.tableRow, s.tableRowLast]}>
              <View
                style={{
                  width: "56%",
                  borderRightWidth: 1,
                  borderColor: C.dark,
                }}
              />
              <View
                style={{
                  width: "12%",
                  borderRightWidth: 1,
                  borderColor: C.dark,
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Kantumruy Pro",
                    color: C.dark,
                    marginRight: 2,
                  }}
                >
                  ចំនួន៖
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Kantumruy Pro",
                    color: C.dark,
                  }}
                >
                  {details.length}
                </Text>
              </View>
              <View
                style={{
                  width: "12%",
                  borderRightWidth: 1,
                  borderColor: C.dark,
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Kantumruy Pro",
                    color: C.dark,
                  }}
                >
                  {fmt2(totalNetWeight)}
                </Text>
              </View>
              <View
                style={{
                  width: "20%",
                  paddingHorizontal: 4,
                  paddingVertical: 3,
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Kantumruy Pro",
                    color: C.dark,
                  }}
                >
                  {"\u17db"}
                  {Math.round(grandTotal).toLocaleString("en-US")}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>ឈ្មោះអ្នកទិញ </Text>
              <View style={s.sigLine} />
              <Text style={s.sigName}>
                {purchaserLabel === "\u2014"
                  ? "_______________"
                  : purchaserLabel}
              </Text>
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
              <Text style={s.sigLabel}>
                ឈ្មោះ និង ស្នាមម្រាមដៃ អ្នកលក់បានទទួលប្រាក់
              </Text>

              <Text style={s.sigName}>
                {record.vendor ?? "_______________"}
              </Text>
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
