import { Suspense } from 'react';
import { PropertySearch } from '@/components/property/PropertySearch';
import { AgentControlPanel } from '@/components/agents/AgentControlPanel';
import { PropertyMap } from '@/components/property/PropertyMap';
import { SystemMetrics } from '@/components/dashboard/SystemMetrics';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, Clock, Bot  } from '@mui/icons-material';
import type { AgentJob } from "@shared/schema";

// Server-side data functions
async function getSystemMetrics() {
  return {
    activeAgents: 15,
    tasksCompleted: 2847,
    accuracyRate: 97.8,
    parcelsProcessed: 47831,
    systemUptime: 99.9,
    avgResponseTime: 234
  };
}

export default function TerraFusionDashboard() {
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentJobs = [] } = useQuery<AgentJob[]>({
    queryKey: ['/api/agents/jobs/recent'],
  });

  const systemStats = {
    activeAgents: (dashboardStats as any)?.activeAgents || 8,
    tasksCompleted: (dashboardStats as any)?.completedJobs || 2847,
    accuracyRate: 97.8,
    parcelsProcessed: (dashboardStats as any)?.totalProperties || 47831,
    systemUptime: 99.9,
    avgResponseTime: 234
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">TF</span>
              </div>
              <div>
<>
                <h1 className="text-2xl font-bold text-gray-900">Terrafusion Assessment Dashboard</h1>
                <p
</> className="text-sm text-gray-600">Benton County, Washington</p>
              </div>
            </div>
            <SystemStatusIndicator />
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Search & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <Suspense fallback={<PropertySearchSkeleton />}>
<>
              <PropertySearch />
            </Suspense>
            
            <QuickActions
</> />
            
            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivity activities={recentJobs} />
            </Suspense>
          </div>

          {/* Center Column - Map */}
          <div className="lg:col-span-5">
            <Suspense fallback={<MapSkeleton />}>
              <PropertyMap />
            </Suspense>
          </div>

          {/* Right Column - Agents & Metrics */}
          <div className="lg:col-span-3 space-y-6">
            <SystemMetrics stats={systemStats} />
            
            <Suspense fallback={<AgentPanelSkeleton />}>
              <AgentControlPanel />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

// System Status Indicator Component
function SystemStatusIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
<>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span
</> className="text-sm text-gray-600">System Active</span>
      </div>
      <Badge variant="outline" className="text-green-600 border-green-200">
        99.9% Uptime
      </Badge>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: "Batch Assessment", icon: "📊", color: "bg-blue-100 text-blue-700" },
    { label: "Upload CSV", icon: "📄", color: "bg-green-100 text-green-700" },
    { label: "Generate Report", icon: "📋", color: "bg-purple-100 text-purple-700" },
    { label: "Run Comparables", icon: "🏠", color: "bg-orange-100 text-orange-700" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action /* , index */) => (
            <button
              key={index}
              className={`p-3 rounded-lg text-left hover:opacity-80 transition-opacity ${action.color}`}
            >
<>
              <div className="text-lg mb-1">{action.icon}</div>
              <div
</> className="text-sm font-medium">{action.label}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity Component
function RecentActivity({ activities }: { activities: AgentJob[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {activity.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : activity.status === 'running' ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
<>
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div
</> className="flex-1">
<>
                <div className="text-sm font-medium text-gray-900">{activity.jobType}</div>
                <div
</> className="text-xs text-gray-600 mt-1">
                  {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time'}
                </div>
                {activity.confidenceScore && (
                  <div className="text-xs text-blue-600 mt-1">
                    Confidence: {(parseFloat(activity.confidenceScore) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                {activity.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeletons
function PropertySearchSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
<>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div
</> className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
<>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div
</> className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-18"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MapSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-[600px] bg-gray-200 animate-pulse rounded-lg"></div>
      </CardContent>
    </Card>
  );
}

function AgentPanelSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-6">
<>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div
</> className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
<>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div
</> className="flex-1">
<>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div
</> className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse">
<>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div
</> className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg">
<>
                <div className="w-4 h-4 bg-gray-200 rounded-full mt-1"></div>
                <div
</> className="flex-1">
<>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div
</> className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-12 h-5 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}