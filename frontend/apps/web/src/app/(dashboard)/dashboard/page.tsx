"use client"

import { 
  IconClock, 
  IconDatabase, 
  IconArrowUpRight, 
  IconArrowDownRight,
  IconDotsVertical,
  IconExternalLink,
  IconCpu,
  IconCloudComputing
} from "@tabler/icons-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"

const stats = [
  {
    title: "System Health",
    value: "99.9%",
    change: "+0.1%",
    trend: "up",
    icon: IconCloudComputing,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Active Nodes",
    value: "2,350",
    change: "+180.1%",
    trend: "up",
    icon: IconCpu,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    title: "Data Processed",
    value: "12.5 TB",
    change: "+2.4%",
    trend: "up",
    icon: IconDatabase,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Uptime",
    value: "99.8%",
    change: "-0.02%",
    trend: "down",
    icon: IconClock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
]

const recentActivity = [
  { id: 1, user: "Alice Freeman", action: "Provisioned new node", target: "SG-NORTH-01", time: "2 hours ago", status: "completed" },
  { id: 2, user: "Soklim Khy", action: "Optimized query cache", target: "Main Cluster", time: "5 hours ago", status: "pending" },
  { id: 3, user: "Bob Smith", action: "Scheduled maintenance", target: "Weekly Sync", time: "1 day ago", status: "completed" },
  { id: 4, user: "Charlie Davis", action: "Scaled instances", target: "API Layer", time: "2 days ago", status: "completed" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="scroll-m-24 text-lg font-medium tracking-tight md:text-xl lg:text-2xl">Workspace Overview</h1>
          <p className="text-muted-foreground font-medium">Monitoring your system&apos;s real-time performance and node activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="shadow-sm">Export Data</Button>
          <Button className="shadow-sm">System Status</Button>
        </div>
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm border-border/50 hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={stat.bg + " p-2.5 rounded-lg"}>
                  <stat.icon className={stat.color + " size-5"} stroke={2} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change}
                  {stat.trend === 'up' ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold tracking-tight mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Area */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Node Performance</CardTitle>
              <CardDescription>Real-time processing activity across the global network.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <IconDotsVertical size={18} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-87.5 w-full bg-muted/5 rounded-xl border border-border/50 flex flex-col relative overflow-hidden group">
              {/* Mock Chart SVG */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[100, 200].map((y) => (
                    <line key={`grid-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="currentColor" strokeOpacity="0.05" />
                  ))}

                  {/* Area */}
                  <path
                    d="M0,300 L0,220 C100,210 200,250 300,180 C400,110 500,160 600,100 C700,40 800,120 900,80 C950,60 1000,90 1000,90 L1000,300 Z"
                    fill="url(#gradient)"
                  />
                  
                  {/* Line */}
                  <path
                    d="M0,220 C100,210 200,250 300,180 C400,110 500,160 600,100 C700,40 800,120 900,80 C950,60 1000,90 1000,90"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-chart-draw"
                    style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
                  />

                  {/* Data Points */}
                  {[
                    {x: 300, y: 180},
                    {x: 600, y: 100},
                    {x: 900, y: 80}
                  ].map((p) => (
                    <circle key={`point-${p.x}`} cx={p.x} cy={p.y} r="4" fill="white" stroke="var(--primary)" strokeWidth="2" />
                  ))}
                </svg>
                
                {/* X-Axis Labels */}
                <div className="flex justify-between mt-4 px-2">
                  {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'].map((label) => (
                    <span key={label} className="text-[10px] font-medium text-muted-foreground">{label}</span>
                  ))}
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute top-6 left-6 flex items-center gap-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-xs font-bold">Active Requests: 842/s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <CardDescription>Latest telemetry from your active nodes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-4 relative group">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-primary ring-4 ring-primary/10 z-10" />
                    {item.id !== recentActivity.length && <div className="w-px h-full bg-border -mt-0.5" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium leading-none">
                      <span className="font-bold text-foreground">{item.user}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                      {item.action} <span className="font-semibold text-foreground">{item.target}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs font-semibold gap-2 group h-9">
              View All Logs
              <IconExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
