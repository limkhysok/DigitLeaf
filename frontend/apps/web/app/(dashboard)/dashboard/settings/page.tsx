import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground font-medium">Manage your workspace preferences and security.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update your workspace name and branding.</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] border-t flex items-center justify-center bg-muted/5">
            <p className="text-sm text-muted-foreground italic">Settings interface coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
