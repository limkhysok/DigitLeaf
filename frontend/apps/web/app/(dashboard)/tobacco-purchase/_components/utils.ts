

export function formatPurchaseDate(tp_date: string | null | undefined): string {
  if (!tp_date) return "—"

  // tp_date is stored as "YYYY-MM-DD"
  const dateParts = tp_date.split("-")
  if (dateParts.length === 3) {
    const [y, m, d] = dateParts
    return `${d}/${m}/${y}`
  }

  return tp_date
}
