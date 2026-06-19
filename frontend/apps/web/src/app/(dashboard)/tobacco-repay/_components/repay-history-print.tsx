"use client"

import { Document, Page, View, StyleSheet } from "@react-pdf/renderer"
import { RepayHistoryItem } from "@/services/api-client"
import { downloadReactPdf } from "@/utils/download-react-pdf"
import { ensureKhmerCanvasFontLoaded, KhmerLabel } from "@/utils/khmer-pdf-text"

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const parts = dateStr.split("-")
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

interface RepayHistoryPdfData {
  items: RepayHistoryItem[]
  year: string
}

const s = StyleSheet.create({
  page: {
    fontSize: 9,
    color: "#111827",
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  row: { flexDirection: "row" },
  th: {
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    padding: 5,
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
  },
  td: {
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    padding: 5,
  },
  colNo: { width: "5%" },
  colRepayNum: { width: "12%" },
  colConNum: { width: "12%" },
  colRep: { width: "16%" },
  colFarmer: { width: "16%" },
  colTobacco: { width: "14%" },
  colQty: { width: "10%", textAlign: "right" },
  colYear: { width: "7%", textAlign: "center" },
  colDate: { width: "8%" },
})

function RepayHistoryPdfDocument({ items, year }: Readonly<RepayHistoryPdfData>) {
  const totalQty = items.reduce((sum, it) => sum + (it.qty_repay ?? 0), 0)
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <KhmerLabel text={`Tobacco Repay History — ${year}`} style={s.title} />

        <View style={s.row}>
          <KhmerLabel text="No." style={{ ...s.th, ...s.colNo }} />
          <KhmerLabel text="Repay No." style={{ ...s.th, ...s.colRepayNum }} />
          <KhmerLabel text="Contract No." style={{ ...s.th, ...s.colConNum }} />
          <KhmerLabel text="Representative" style={{ ...s.th, ...s.colRep }} />
          <KhmerLabel text="Farmer" style={{ ...s.th, ...s.colFarmer }} />
          <KhmerLabel text="Tobacco" style={{ ...s.th, ...s.colTobacco }} />
          <KhmerLabel text="Quantity (kg)" style={{ ...s.th, ...s.colQty }} />
          <KhmerLabel text="Year" style={{ ...s.th, ...s.colYear }} />
          <KhmerLabel text="Date" style={{ ...s.th, ...s.colDate }} />
        </View>

        {items.map((rec, idx) => (
          <View key={rec.repay_id} style={s.row}>
            <KhmerLabel text={String(idx + 1)} style={{ ...s.td, ...s.colNo }} />
            <KhmerLabel text={rec.repay_num || "—"} style={{ ...s.td, ...s.colRepayNum }} />
            <KhmerLabel text={rec.con_num || "—"} style={{ ...s.td, ...s.colConNum }} />
            <KhmerLabel text={rec.representative || "—"} style={{ ...s.td, ...s.colRep }} />
            <KhmerLabel text={rec.farmer_name || "—"} style={{ ...s.td, ...s.colFarmer }} />
            <KhmerLabel text={rec.tobacco_type || "—"} style={{ ...s.td, ...s.colTobacco }} />
            <KhmerLabel
              text={rec.qty_repay == null ? "—" : rec.qty_repay.toLocaleString()}
              style={{ ...s.td, ...s.colQty }}
            />
            <KhmerLabel text={rec.contract_year ? String(rec.contract_year) : "—"} style={{ ...s.td, ...s.colYear }} />
            <KhmerLabel text={fmtDate(rec.repay_date)} style={{ ...s.td, ...s.colDate }} />
          </View>
        ))}

        <View style={s.row}>
          <KhmerLabel text="Total" style={{ ...s.td, width: "75%", fontWeight: "bold" }} />
          <KhmerLabel text={totalQty.toLocaleString()} style={{ ...s.td, ...s.colQty, fontWeight: "bold" }} />
          <View style={{ ...s.td, width: "15%" }} />
        </View>
      </Page>
    </Document>
  )
}

// ── downloadRepayHistoryPdf — public API ───────────────────────────────────────

export async function downloadRepayHistoryPdf(data: RepayHistoryPdfData): Promise<void> {
  await ensureKhmerCanvasFontLoaded()
  await downloadReactPdf(<RepayHistoryPdfDocument {...data} />, `tobacco_repay_history_${data.year}.pdf`)
}
