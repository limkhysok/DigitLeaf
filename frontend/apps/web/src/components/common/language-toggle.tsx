"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"

const languages = [
  { code: "en", native: "EN" },
  { code: "kh", native: "KH" },
] as const

const SEGMENT_WIDTH = 40

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  )

  // Avoid hydration mismatch by rendering a skeleton until mounted
  if (!mounted) {
    return <div className="h-9 w-22 rounded-full bg-black/5" />
  }

  const activeIndex = languages.findIndex((l) => l.code === language)

  return (
    <div className="relative flex h-9 w-22 items-center rounded-full bg-black/5 p-1">
      <div
        className="absolute top-1 left-1 h-7 w-10 rounded-full bg-[#009640] shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * SEGMENT_WIDTH}px)` }}
      />
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLanguage(l.code)}
          className={cn(
            "relative z-10 flex h-7 w-10 items-center justify-center text-[11px] font-bold tracking-tight transition-colors duration-200",
            language === l.code ? "text-white" : "text-black/60 hover:text-black"
          )}
        >
          {l.native}
        </button>
      ))}
    </div>
  )
}
