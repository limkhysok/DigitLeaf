"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { IconCircleCheck, IconInfoCircle, IconAlertTriangle, IconAlertOctagon, IconLoader } from "@tabler/icons-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <IconCircleCheck className="size-4" />
        ),
        info: (
          <IconInfoCircle className="size-4" />
        ),
        warning: (
          <IconAlertTriangle className="size-4" />
        ),
        error: (
          <IconAlertOctagon className="size-4" />
        ),
        loading: (
          <IconLoader className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "oklch(0.98 0.02 150)",
          "--normal-text": "oklch(0.35 0.08 150)",
          "--normal-border": "oklch(0.92 0.04 150)",
          "--success-bg": "oklch(0.96 0.04 150)",
          "--success-text": "oklch(0.30 0.10 150)",
          "--success-border": "oklch(0.85 0.12 150 / 0.3)",
          "--error-bg": "oklch(0.96 0.04 25)",
          "--error-text": "oklch(0.40 0.15 25)",
          "--error-border": "oklch(0.85 0.15 25 / 0.3)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast border-0 shadow-lg backdrop-blur-md",
          success: "bg-[--success-bg] text-[--success-text] border border-[--success-border]",
          error: "bg-[--error-bg] text-[--error-text] border border-[--error-border]",
          info: "bg-blue-50 text-blue-900 border border-blue-100",
          warning: "bg-amber-50 text-amber-900 border border-amber-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
