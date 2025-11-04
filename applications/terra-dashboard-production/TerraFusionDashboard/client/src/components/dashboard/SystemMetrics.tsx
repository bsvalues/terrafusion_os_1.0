import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Activity, CheckCircle  } from '@mui/icons-material';

interface SystemStats {
  activeAgents: number;
  tasksCompleted: number;
  accuracyRate: number;
  parcelsProcessed: number;
  systemUptime: number;
  avgResponseTime: number;
}

export function SystemMetrics({ stats }: { stats: SystemStats }) {
  const metrics = [
    {
      title: "Active Agents",
      value: stats.activeAgents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Tasks Completed",
      value: stats.tasksCompleted.toLocaleString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Accuracy Rate",
      value: `${stats.accuracyRate}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "System Uptime",
      value: `${stats.systemUptime}%`,
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
<>
        <h3 className="text-lg font-semibold text-gray-800">System Metrics</h3>
        <Badge
</> variant="outline" className="text-green-600 border-green-200">
          Live
        </Badge>
      </div>
      
      <div className="grid gap-4">
        {metrics.map((metric /* , index */) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
<>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <div
</>>
<>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div
</> className="text-sm text-gray-600">{metric.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
<>
            <span className="text-sm text-gray-600">Parcels Processed</span>
            <span
</> className="font-semibold">{stats.parcelsProcessed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
<>
            <span className="text-sm text-gray-600">Avg Response Time</span>
            <span
</> className="font-semibold">{stats.avgResponseTime}ms</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}