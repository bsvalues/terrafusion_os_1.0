/**
 * Terrafusion Marketplace Dashboard
 * Comprehensive analytics and management dashboard for the marketplace ecosystem
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, Star, Shield, Users, DollarSign, 
  Activity, Warning, Zap, BarChart3, PieChart, 
  Calendar, Filter, Refresh, ExternalLink 
 } from '@mui/icons-material';
import { MarketplaceAnalytics, PluginMetrics, CountyInsights } from '../services/MarketplaceAnalytics';

interface DashboardProps {
  analytics: MarketplaceAnalytics;
  userRole: 'admin' | 'county' | 'developer';
  countyId?: string;
}

export const MarketplaceDashboard: React.FC<DashboardProps> = ({
  analytics,
  userRole,
  countyId
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'downloads' | 'revenue' | 'adoption'>('downloads');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, selectedMetric, countyId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await Promise.all([
        analytics.getTopPlugins(10),
        analytics.getPerformanceMetrics(),
        countyId ? analytics.getCountyInsights(countyId) : null,
        userRole === 'admin' ? getAdminMetrics() : null
      ]);

      setDashboardData({
        topPlugins: data[0],
        performance: data[1],
        countyInsights: data[2],
        adminMetrics: data[3]
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAdminMetrics = async () => {
    // Mock admin metrics - would be real API calls in production
    return {
      totalPlugins: 45,
      totalCounties: 127,
      totalDevelopers: 23,
      monthlyRevenue: 125000,
      growthRate: 15.3,
      activeInstallations: 2847,
      averageRating: 4.6,
      complianceScore: 94.2
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Refresh className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading marketplace data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Marketplace Overview' : 
             userRole === 'county' ? 'County Dashboard' : 
             'Developer Dashboard'}
          </h1>
          <p
</>
className="text-gray-600 mt-1">
            {userRole === 'admin' ? 'Monitor marketplace performance and growth' :
             userRole === 'county' ? 'Track your plugin usage and insights' :
             'Manage your plugins and track performance'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          ><>

            <option value="7d">Last 7 days</option>
            <option
</>
value="30d">Last 30 days</option><>

            <option value="90d">Last 90 days</option>
            <option
</>
value="1y">Last year</option>
          </select>
          
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Refresh className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {userRole === 'admin' && dashboardData?.adminMetrics && (
        <AdminMetricsCards metrics={dashboardData.adminMetrics} />
      )}

      {userRole === 'county' && dashboardData?.countyInsights && (
        <CountyMetricsCards insights={dashboardData.countyInsights} />
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart 
          data={dashboardData?.performance} 
          timeRange={timeRange}
          selectedMetric={selectedMetric}
          onMetricChange={setSelectedMetric}
        />
        
        <SystemHealthPanel performance={dashboardData?.performance} />
      </div>

      {/* Plugin Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2"><>

          <TopPluginsTable plugins={dashboardData?.topPlugins || []} userRole={userRole} />
        </div>
        
        <div
</>
className="space-y-6">
          <CategoryDistribution plugins={dashboardData?.topPlugins || []} />
          <TierAdoption plugins={dashboardData?.topPlugins || []} />
        </div>
      </div>

      {/* County-specific insights */}
      {userRole === 'county' && dashboardData?.countyInsights && (
        <CountyInsightsPanel insights={dashboardData.countyInsights} />
      )}

      {/* Recent Activity */}
      <RecentActivityFeed userRole={userRole} countyId={countyId} />
    </div>
  );
};

// Admin Metrics Cards Component
const AdminMetricsCards: React.FC<{ metrics: any }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Total Plugins"
      value={metrics.totalPlugins}
      change={`+${metrics.growthRate}%`}
      icon={<Zap className="w-6 h-6 text-indigo-600" />}
      trend="up"
    />
    <MetricCard
      title="Active Counties"
      value={metrics.totalCounties}
      change="+12 this month"
      icon={<Users className="w-6 h-6 text-green-600" />}
      trend="up"
    />
    <MetricCard
      title="Monthly Revenue"
      value={`$${(metrics.monthlyRevenue / 1000).toFixed(0)}k`}
      change="+8.2%"
      icon={<DollarSign className="w-6 h-6 text-blue-600" />}
      trend="up"
    />
    <MetricCard
      title="Avg Rating"
      value={metrics.averageRating.toFixed(1)}
      change="+0.2"
      icon={<Star className="w-6 h-6 text-yellow-500" />}
      trend="up"
    />
  </div>
);

// County Metrics Cards Component
const CountyMetricsCards: React.FC<{ insights: CountyInsights }> = ({ insights }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      title="Plugin Adoption"
      value={`${(insights.plugin_adoption_rate * 100).toFixed(1)}%`}
      change="+5.2%"
      icon={<Download className="w-6 h-6 text-indigo-600" />}
      trend="up"
    />
    <MetricCard
      title="Cost Savings"
      value={`$${(insights.cost_savings / 1000).toFixed(0)}k`}
      change="+12.5%"
      icon={<DollarSign className="w-6 h-6 text-green-600" />}
      trend="up"
    />
    <MetricCard
      title="Performance Rank"
      value={`#${insights.benchmark_comparison.performance_ranking}`}
      change="↑2 positions"
      icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
      trend="up"
    />
    <MetricCard
      title="Active Plugins"
      value={insights.most_used_plugins.length}
      change="+3 this month"
      icon={<Activity className="w-6 h-6 text-purple-600" />}
      trend="up"
    />
  </div>
);

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}> = ({ title, value, change, icon, trend }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div><>

        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p
</>
className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="mt-4 flex items-center"><>

      <span className={`text-sm font-medium ${
        trend === 'up' ? 'text-green-600' : 
        trend === 'down' ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {change}
      </span>
      <span
</>
className="text-sm text-gray-500 ml-2">vs last period</span>
    </div>
  </div>
);

// Performance Chart Component
const PerformanceChart: React.FC<{
  data: any;
  timeRange: string;
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}> = ({ data, timeRange, selectedMetric, onMetricChange }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6"><>

      <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
      <select
</>

        value={selectedMetric}
        onChange={(e) => onMetricChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
      ><>

        <option value="downloads">Downloads</option>
        <option
</>
value="revenue">Revenue</option>
        <option value="adoption">Adoption Rate</option>
      </select>
    </div>
    
    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" /><>

        <p className="text-gray-600">Chart visualization would be rendered here</p>
        <p
</>
className="text-sm text-gray-500">Integration with Chart.js or D3.js</p>
      </div>
    </div>
  </div>
);

// System Health Panel Component
const SystemHealthPanel: React.FC<{ performance: any }> = ({ performance }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6"><>

    <h3 className="text-lg font-semibold text-gray-900 mb-6">System Health</h3>
    
    <div
</>
className="space-y-4">
      <HealthMetric
        label="Overall Health"
        value={performance?.overall_health || 95}
        status="excellent"
      />
      <HealthMetric
        label="System Load"
        value={performance?.system_load || 23}
        status="good"
      />
      <HealthMetric
        label="Error Rate"
        value={2.1}
        status="warning"
        unit="%"
      /><>

      <HealthMetric
        label="Uptime"
        value={99.9}
        status="excellent"
        unit="%"
      />
    </div>

    <div
</>
className="mt-6 pt-6 border-t border-gray-200"><>

      <h4 className="font-medium text-gray-900 mb-3">Recent Alerts</h4>
      <div
</>
className="space-y-2">
        <div className="flex items-center space-x-2 text-sm">
          <Warning className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600">High memory usage on TerraFlow plugin</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Security scan completed successfully</span>
        </div>
      </div>
    </div>
  </div>
);

// Health Metric Component
const HealthMetric: React.FC<{
  label: string;
  value: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  unit?: string;
}> = ({ label, value, status, unit = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="flex items-center justify-between"><>

      <span className="text-sm text-gray-600">{label}</span>
      <span
</>
className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor()}`}>
        {value}{unit}
      </span>
    </div>
  );
};

// Top Plugins Table Component
const TopPluginsTable: React.FC<{ plugins: any[]; userRole: string }> = ({ plugins, userRole }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6"><>

      <h3 className="text-lg font-semibold text-gray-900">Top Performing Plugins</h3>
      <button
</>
className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
        View All
      </button>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200"><>

            <th className="text-left py-3 px-4 font-medium text-gray-600">Plugin</th>
            <th
</>
className="text-left py-3 px-4 font-medium text-gray-600">Tier</th><>

            <th className="text-left py-3 px-4 font-medium text-gray-600">Downloads</th>
            <th
</>
className="text-left py-3 px-4 font-medium text-gray-600">Rating</th><>

            <th className="text-left py-3 px-4 font-medium text-gray-600">Compliance</th>
            <th
</>
className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plugins.slice(0, 8).map((plugin /* , index */) => (
            <tr key={plugin.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {plugin.name.charAt(0)}
                    </span>
                  </div>
                  <div><>

                    <p className="font-medium text-gray-900">{plugin.name}</p>
                    <p
</>
className="text-sm text-gray-500">{plugin.category}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  plugin.tier === 'Tier1CoreFoundation' ? 'bg-green-100 text-green-800' :
                  plugin.tier === 'Tier2CostForgeProfessional' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {plugin.tier.replace('Tier1CoreFoundation', 'Foundation')
                            .replace('Tier2CostForgeProfessional', 'Professional')
                            .replace('Tier3EnterpriseSuite', 'Enterprise')}
                </span>
              </td><>

              <td className="py-3 px-4 text-gray-900">{plugin.downloads.toLocaleString()}</td>
              <td
</>
className="py-3 px-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-gray-900">{plugin.rating}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="text-green-600 font-medium">{plugin.compliance_score}%</span>
              </td>
              <td className="py-3 px-4">
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Category Distribution Component
const CategoryDistribution: React.FC<{ plugins: any[] }> = ({ plugins }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6"><>

    <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h3>
    <div
</>
className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Pie chart would be rendered here</p>
      </div>
    </div>
  </div>
);

// Tier Adoption Component
const TierAdoption: React.FC<{ plugins: any[] }> = ({ plugins }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6"><>

    <h3 className="text-lg font-semibold text-gray-900 mb-6">Tier Adoption</h3>
    <div
</>
className="space-y-4">
      <div className="flex items-center justify-between"><>

        <span className="text-sm text-gray-600">Foundation</span>
        <span
</>
className="text-sm font-medium text-gray-900">45%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
      </div>
      
      <div className="flex items-center justify-between"><>

        <span className="text-sm text-gray-600">Professional</span>
        <span
</>
className="text-sm font-medium text-gray-900">35%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
      </div>
      
      <div className="flex items-center justify-between"><>

        <span className="text-sm text-gray-600">Enterprise</span>
        <span
</>
className="text-sm font-medium text-gray-900">20%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
      </div>
    </div>
  </div>
);

// County Insights Panel Component
const CountyInsightsPanel: React.FC<{ insights: CountyInsights }> = ({ insights }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6"><>

    <h3 className="text-lg font-semibold text-gray-900 mb-6">Your County Insights</h3>
    
    <div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div><>

        <h4 className="font-medium text-gray-900 mb-3">Efficiency Gains</h4>
        <div
</>
className="space-y-2">
          {Object.entries(insights.efficiency_gains).slice(0, 3).map(([plugin, gain]) => (
            <div key={plugin} className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">{plugin}</span>
              <span
</>
className="text-sm font-medium text-green-600">+{gain.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div><>

        <h4 className="font-medium text-gray-900 mb-3">Recommended Plugins</h4>
        <div
</>
className="space-y-2">
          {insights.recommended_plugins.slice(0, 3).map((pluginId) => (
            <div key={pluginId} className="flex items-center justify-between"><>

              <span className="text-sm text-gray-600">{pluginId}</span>
              <button
</>
className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-200">
                Install
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Recent Activity Feed Component
const RecentActivityFeed: React.FC<{ userRole: string; countyId?: string }> = ({ userRole, countyId }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6"><>

    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
    
    <div
</>
className="space-y-4">
      <ActivityItem
        icon={<Download className="w-4 h-4 text-green-600" />}
        title="CostForgeAI installed"
        description="Successfully installed by Benton County"
        timestamp="2 hours ago"
      />
      <ActivityItem
        icon={<Star className="w-4 h-4 text-yellow-500" />}
        title="PropertyWorkbench rated 5 stars"
        description="New review from King County"
        timestamp="4 hours ago"
      />
      <ActivityItem
        icon={<Shield className="w-4 h-4 text-blue-600" />}
        title="Security scan completed"
        description="All plugins passed compliance check"
        timestamp="6 hours ago"
      />
      <ActivityItem
        icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
        title="TerraFlow updated"
        description="Version 2.1.1 now available"
        timestamp="1 day ago"
      />
    </div>
  </div>
);

// Activity Item Component
const ActivityItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
}> = ({ icon, title, description, timestamp }) => (
  <div className="flex items-start space-x-3"><>

    <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
      {icon}
    </div>
    <div
</>
className="flex-1 min-w-0"><>

      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p
</>
className="text-sm text-gray-600">{description}</p>
    </div>
    <div className="flex-shrink-0">
      <span className="text-xs text-gray-500">{timestamp}</span>
    </div>
  </div>
);
