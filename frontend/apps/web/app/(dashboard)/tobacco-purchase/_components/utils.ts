import { format } from "date-fns"

export function formatPurchaseDate(tp_date: string | null | undefined, do_date?: string | null): string {
  if (!tp_date) return "—"

  // tp_date is stored as "YYYY-MM-DD"
  const dateParts = tp_date.split("-")
  let targetDateStr = tp_date
  if (dateParts.length === 3) {
    const [y, m, d] = dateParts
    targetDateStr = `${d}/${m}/${y}`
  }

  if (do_date) {
    try {
      const d = new Date(do_date)
      if (!Number.isNaN(d.getTime())) {
        const timeStr = format(d, "h:mma").toUpperCase()
        return `${targetDateStr} at ${timeStr}`
      }
    } catch {
      // Ignore and fallback
    }
  }

  return targetDateStr
}
