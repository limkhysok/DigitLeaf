"use client"

import * as React from "react"

export default function LeafPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leaf Page</h1>
        <p className="text-muted-foreground">
          Welcome to the leaf management page.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Total Leaves</span>
            <span className="text-2xl font-bold">1,234</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Active Leaves</span>
            <span className="text-2xl font-bold">856</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Archived</span>
            <span className="text-2xl font-bold">378</span>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">Categories</span>
            <span className="text-2xl font-bold">12</span>
          </div>
        </div>
      </div>
      <div className="h-[400px] rounded-xl border bg-card p-6 shadow-sm flex items-center justify-center">
        <span className="text-muted-foreground italic text-sm">Leaf Content Visualization Placeholder</span>
      </div>
    </div>
  )
}
