import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { IconDatabase } from "@tabler/icons-react"

export default function DataEnginePage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Engine</h1>
        <p className="text-muted-foreground font-medium">Manage your datasets and external integrations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <IconDatabase className="size-5 text-primary" />
            </div>
            <CardTitle>Datasets</CardTitle>
            <CardDescription>Configure and monitor your data sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Detailed dataset management is coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
