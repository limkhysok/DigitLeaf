  "use client"

  import { useAuth } from "@/hooks/use-auth"
  import { useLanguage } from "@/hooks/use-language"
  import { apiClient } from "@/services/api-client"
  import { useQuery } from "@tanstack/react-query"
  import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
  import { Skeleton } from "@workspace/ui/components/skeleton"
  import { IconClipboardList, IconScale } from "@tabler/icons-react"

  export function SackRegistrationStatsPanel() {
    const { tokens, isLoading: isAuthLoading } = useAuth()
    const { t, localizeNumber } = useLanguage()

    const { data: stats, isLoading } = useQuery({
      queryKey: ["sack-registration-stats"],
      queryFn: () => apiClient.getSackRegistrationStats(tokens!.access_token),
      enabled: !!tokens?.access_token && !isAuthLoading,
    })

    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-5">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      )
    }

    if (!stats) return null

    return (
      <div className="grid grid-cols-2 gap-3 md:gap-3 lg:gap-4">

        {/* Total Registrations */}
        <Card className="rounded-sm shadow-xs">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-base font-medium text-foreground flex items-center justify-between tracking-normal">
              {t.sackRegistration.stats.registrations}
              <IconClipboardList className="h-5 w-5 text-gray-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold tabular-nums">{localizeNumber(stats.registration_counts.total)}</span>
              <span className="text-xs font-medium text-emerald-600">+{localizeNumber(stats.registration_counts.today)} {t.sackRegistration.stats.today}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Sack Weight */}
        <Card className="rounded-sm shadow-xs">
          <CardHeader className="pb-1 pt-4 px-5">
            <CardTitle className="text-base font-medium text-foreground flex items-center justify-between tracking-normal">
              {t.sackRegistration.stats.sackWeight}
              <IconScale className="h-5 w-5 text-gray-700" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums">{localizeNumber(stats.sack_weight_kg.total)}</span>
                <span className="text-lg font-medium">Kg</span>
              </div>
              <span className="text-xs font-medium text-emerald-600">+{localizeNumber(stats.sack_weight_kg.today)} kg {t.sackRegistration.stats.today}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    )
  }
