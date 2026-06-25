"use client"

import * as React from "react"
import { pdf, DocumentProps } from "@react-pdf/renderer"

// Renders a react-pdf <Document> element straight to PDF drawing instructions
// (no DOM screenshot), so generation doesn't block the main thread, then
// triggers a download via the same blob-URL pattern used elsewhere for
// export downloads (see tobacco-repay-history.tsx's exportHistory handler).
export async function downloadReactPdf(doc: React.ReactElement<DocumentProps>, filename: string): Promise<void> {
  const blob = await pdf(doc).toBlob()
  const url = globalThis.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  globalThis.URL.revokeObjectURL(url)
}
