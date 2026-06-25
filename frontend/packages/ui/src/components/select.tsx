"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { IconCheck, IconChevronDown } from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"

function Select({
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Root>>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Group>>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Value>>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Trigger>>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-input/20 px-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <IconChevronDown className="size-4 shrink-0 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: Readonly<
  React.ComponentProps<typeof SelectPrimitive.Content> & {
    position?: "item-aligned" | "popper"
  }
>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-96 min-w-32 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
          <IconChevronDown className="size-4 rotate-180 opacity-50" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
          <IconChevronDown className="size-4 opacity-50" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Item>>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck className="size-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Label>>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("py-1.5 pl-8 pr-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof SelectPrimitive.Separator>>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
