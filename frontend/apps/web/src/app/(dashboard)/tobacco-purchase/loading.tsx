import { Skeleton } from "@workspace/ui/components/skeleton"

export default function Loading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <Skeleton className="h-8 w-62.5 mb-2" />
          <Skeleton className="h-4 w-87.5" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-37.5" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-62.5" />
          <Skeleton className="h-10 w-25" />
        </div>
        <div className="rounded-md border p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
