import { useState } from 'react';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import KPICard from '@/components/dashboard/kpi-card';
import GISMap from '@/components/dashboard/gis-map';
import PropertyList from '@/components/dashboard/property-list';
import AIAgentOverview from '@/components/dashboard/ai-agent-overview';
import SystemActivityFeed from '@/components/dashboard/system-activity';
import { Home, TrendingUp, FileText, CheckSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardKPI } from '@/lib/types';

const Dashboard = () => {
  // In a real app, this would fetch from an API
  const { data: kpiData, isLoading } = useQuery<DashboardKPI>({
    queryKey: ['/api/dashboard/kpi'],
    // Enable this when the API is available
    enabled: false,
  });
  
  // Default KPI data for demo
  const defaultKPI: DashboardKPI = {
    propertiesProcessed: 14325,
    valueIncrease: '+8.2%',
    protestsSubmitted: 482,
    complianceScore: '97%'
  };
  
  const kpi = kpiData || defaultKPI;

  // Page header actions
  const headerActions = (
    <>
      <Button variant="outline">
        Generate Report
      </Button>
      <Button>
        New Property
      </Button>
      <Button variant="link" asChild>
        <a href="/property-stories">Test Property Stories Link</a>
      </Button>
    </>
  );

  return (
    <>
      <PageHeader 
        title="MCP Property Tax Platform" 
        subtitle="Beta"
        actions={headerActions}
      />
      
      <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8 py-6">
        <h2 className="text-lg font-medium text-gray-900">Dashboard Overview</h2>
        
        {/* KPI Cards Row */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard 
            title="Properties Processed" 
            value={kpi.propertiesProcessed.toLocaleString()}
            icon={<Home className="h-6 w-6" />}
            actionLabel="View all"
            actionUrl="/properties"
          />
          
          <KPICard 
            title="Value Increase (YoY)" 
            value={kpi.valueIncrease}
            icon={<TrendingUp className="h-6 w-6" />}
            actionLabel="View details"
            actionUrl="/valuation"
            valueColor="text-green-600"
          />
          
          <KPICard 
            title="Protests Submitted" 
            value={kpi.protestsSubmitted}
            icon={<FileText className="h-6 w-6" />}
            actionLabel="View protests"
            actionUrl="/protests"
          />
          
          <KPICard 
            title="Compliance Score" 
            value={kpi.complianceScore}
            icon={<CheckSquare className="h-6 w-6" />}
            actionLabel="View audit logs"
            actionUrl="/audit-logs"
          />
        </div>
        
        {/* GIS Map & Property Listing */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GISMap />
          <PropertyList />
        </div>
        
        {/* AI Agents Overview & System Activity */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <AIAgentOverview />
          <SystemActivityFeed />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
