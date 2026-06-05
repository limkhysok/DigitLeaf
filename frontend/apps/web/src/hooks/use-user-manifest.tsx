"use client"

import * as React from "react"
import { LanguageCode, translations, TranslationType } from "@/utils/dictionary"

export interface UserManifest {
  language: LanguageCode
  lastActivePage: string
}

const DEFAULT_MANIFEST: UserManifest = {
  language: "en",
  lastActivePage: "/dashboard",
}

const MANIFEST_KEY = "user_manifest"
const LANGUAGE_COOKIE = "user_language"
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function loadManifest(): UserManifest {
  try {
    const raw = localStorage.getItem(MANIFEST_KEY)
    if (raw) {
      return { ...DEFAULT_MANIFEST, ...JSON.parse(raw) }
    }
    // Migrate legacy language key
    const legacyLang = localStorage.getItem("app-language") as LanguageCode
    if (legacyLang === "en" || legacyLang === "kh") {
      return { ...DEFAULT_MANIFEST, language: legacyLang }
    }
  } catch {}
  return DEFAULT_MANIFEST
}

interface UserManifestContextType {
  manifest: UserManifest
  setLanguage: (lang: LanguageCode) => void
  setLastActivePage: (page: string) => void
  // Language context compatibility
  language: LanguageCode
  t: TranslationType
}

const UserManifestContext = React.createContext<UserManifestContextType | undefined>(undefined)

export function UserManifestProvider({
  children,
  defaultLanguage = "en",
}: Readonly<{
  children: React.ReactNode
  defaultLanguage?: LanguageCode
}>) {
  const [manifest, setManifest] = React.useState<UserManifest>({
    ...DEFAULT_MANIFEST,
    language: defaultLanguage,
  })

  // Load after hydration — language already matches (from cookie prop), so only
  // lastActivePage updates, no language flash
  React.useEffect(() => {
    setManifest(loadManifest())
  }, [])

  const updateManifest = React.useCallback((updates: Partial<UserManifest>) => {
    setManifest(prev => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(MANIFEST_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const setLanguage = React.useCallback(
    (lang: LanguageCode) => {
      // Write cookie so server can read it on next request (same pattern as sidebar_state)
      document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}`
      updateManifest({ language: lang })
    },
    [updateManifest]
  )

  const setLastActivePage = React.useCallback(
    (page: string) => updateManifest({ lastActivePage: page }),
    [updateManifest]
  )

  const value = React.useMemo<UserManifestContextType>(
    () => ({
      manifest,
      setLanguage,
      setLastActivePage,
      language: manifest.language,
      t: translations[manifest.language],
    }),
    [manifest, setLanguage, setLastActivePage]
  )

  return (
    <UserManifestContext.Provider value={value}>
      {children}
    </UserManifestContext.Provider>
  )
}

export function useUserManifest() {
  const context = React.useContext(UserManifestContext)
  if (context === undefined) {
    throw new Error("useUserManifest must be used within a UserManifestProvider")
  }
  return context
}
