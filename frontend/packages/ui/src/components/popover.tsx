"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function Popover({
  ...props
}: Readonly<React.ComponentProps<typeof PopoverPrimitive.Root>>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: Readonly<React.ComponentProps<typeof PopoverPrimitive.Trigger>>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: Readonly<
  React.ComponentProps<typeof PopoverPrimitive.Content> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
