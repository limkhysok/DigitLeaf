"use client"

import * as React from "react"
import { useSyncExternalStore } from "react"
import { IconWorld, IconCheck, IconChevronDown } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { useLanguage } from "@/hooks/use-language"

const languages = [
  {
    code: "en",
    name: "English",
    native: "EN",
  },
  {
    code: "kh",
    name: "Khmer",
    native: "KH",
  },
] as const

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  )

  const selectedLang = languages.find((lang) => lang.code === language)

  // Avoid hydration mismatch by rendering a skeleton or simplified version until mounted
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-17.5 px-2 flex items-center justify-between hover:bg-black/5 text-black transition-all duration-200 border border-transparent hover:border-black/20 rounded-lg group"
      >
        <div className="flex items-center gap-1.5">
          <IconWorld className="size-3.5 text-black" />
          <span className="text-[11px] font-bold tracking-tight text-black">EN</span>
        </div>
        <IconChevronDown className="size-3 text-black opacity-40" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-17.5 px-2 flex items-center justify-between hover:bg-black/5 text-black transition-all duration-200 border border-transparent hover:border-black/20 rounded-lg group"
        >
          <div className="flex items-center gap-1.5">
            <IconWorld className="size-3.5 text-black group-hover:text-[#009640] transition-colors" />
            <span className="text-[11px] font-bold tracking-tight text-black">
              {selectedLang?.native}
            </span>
          </div>
          <IconChevronDown className="size-3 text-black opacity-40 group-hover:opacity-70 transition-opacity" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        className="w-40 p-1.5 shadow-xl border-border/40 backdrop-blur-md bg-background/95 animate-in fade-in zoom-in-95 duration-200 rounded-xl z-50"
      >
        <div className="px-2 py-1.5 mb-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {t.common.selectLanguage}
          </p>
        </div>
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={cn(
              "flex items-center justify-between px-2.5 py-2 text-xs cursor-pointer rounded-lg transition-all duration-200 mb-0.5 last:mb-0",
              language === l.code 
                ? "bg-[#009640]/10 text-[#009640] font-semibold" 
                : "hover:bg-accent text-foreground/80 hover:text-foreground"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                {l.code === "en" ? "English" : "ខ្មែរ"}
              </span>
              <span className="text-[10px] opacity-60 font-normal">
                {l.code === "en" ? "US English" : "Cambodia"}
              </span>
            </div>
            {language === l.code && (
              <div className="size-5 flex items-center justify-center rounded-full bg-[#009640] text-white shadow-sm">
                <IconCheck className="size-3" />
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
