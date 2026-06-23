import { Card } from "@workspace/ui/components/card"
import { IconDatabase } from "@tabler/icons-react"

export default function DatasetsPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground font-medium">Browse and manage your ingested data.</p>
      </div>

      <Card className="border-dashed h-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <IconDatabase className="size-10 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground font-medium">Dataset explorer is under development.</p>
        </div>
      </Card>
    </div>
  )
}
