"use client"

import * as React from "react"
import { useUserManifest } from "./use-user-manifest"

// Backward-compatible shim — language state is now managed by UserManifestProvider
export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}

export function useLanguage() {
  const { language, setLanguage, t } = useUserManifest()

  const localizeNumber = React.useCallback(
    (num: number | string | null | undefined): string => {
      if (num === null || num === undefined) return ""
      const str = String(num)
      if (language !== "kh") return str
      const KHMER_NUMBERS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"]
      return str.replace(/\d/g, (match) => KHMER_NUMBERS[Number(match)] ?? match)
    },
    [language]
  )

  const localizeDateString = React.useCallback(
    (formattedDate: string): string => {
      let str = localizeNumber(formattedDate)
      if (language === "kh") {
        str = str.replace(/\bat\b/g, "នៅ")
                 .replace(/\bAM\b/g, "ព្រឹក")
                 .replace(/\bPM\b/g, "រសៀល")
      }
      return str
    },
    [language, localizeNumber]
  )

  return { language, setLanguage, t, localizeNumber, localizeDateString }
}
