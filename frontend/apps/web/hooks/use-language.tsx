"use client"

import * as React from "react"
import { LanguageCode, translations, TranslationType } from "@/lib/dictionary"

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: TranslationType
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = React.useState<LanguageCode>("en")

  // Persistence
  React.useEffect(() => {
    const saved = localStorage.getItem("app-language") as LanguageCode
    if (saved && (saved === "en" || saved === "kh")) {
      const timer = setTimeout(() => {
        setLanguage(saved)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSetLanguage = React.useCallback((lang: LanguageCode) => {
    setLanguage(lang)
    localStorage.setItem("app-language", lang)
  }, [])

  const value = React.useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t: translations[language],
  }), [language, handleSetLanguage])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
