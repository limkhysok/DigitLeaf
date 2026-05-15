"use client"

import * as React from "react"
import { useUserManifest } from "./use-user-manifest"

// Backward-compatible shim — language state is now managed by UserManifestProvider
export function LanguageProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}

export function useLanguage() {
  const { language, setLanguage, t } = useUserManifest()
  return { language, setLanguage, t }
}
