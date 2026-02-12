import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import SystemOverviewCards from "@/components/system-overview-cards";
import PropertyList from "@/components/property-list";
import AgentControlPanel from "@/components/agent-control-panel";
import PlaygroundIDE from "@/components/playground-ide";
import SystemIntegration from "@/components/system-integration";
import PropertyRecordCard from "@/components/property-record-card";
import PropertyAnalysisDisplay from "@/components/property-analysis-display";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SystemStats {
  totalProperties: number;
  activeAgents: number;
  todayJobs: number;
  avgResponseTime: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'agent_job_completed':
          toast({
            title: "Agent Job Completed",
            description: `${lastMessage.data.agentName} completed processing`,
          });
          break;
        case 'system_alert':
          toast({
            title: "System Alert",
            description: lastMessage.data.message,
            variant: lastMessage.data.severity === 'error' ? 'destructive' : 'default',
          });
          break;
      }
    }
  }, [lastMessage, toast]);

  return (
    <div className="flex h-screen bg-tf-dark text-tf-primary font-inter">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <DashboardHeader isConnected={isConnected} />
        
        <div className="flex-1 overflow-y-auto bg-tf-dark">
          <div className="tf-container space-y-6">
            <SystemOverviewCards 
              stats={stats as any} 
              isLoading={statsLoading} 
            />
            
            <div className="tf-grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PropertyList onPropertySelect={setSelectedPropertyId} />
                <PropertyRecordCard propertyId={selectedPropertyId || undefined} />
<>
                <PropertyAnalysisDisplay propertyId={selectedPropertyId} />
              </div>
              <div
</> className="space-y-6">
                <AgentControlPanel selectedPropertyId={selectedPropertyId} />
              </div>
            </div>
            
            <PlaygroundIDE />
            
            <SystemIntegration />
          </div>
        </div>
      </main>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="tf-button-primary w-14 h-14 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-[#00e5ff]/20 transition-all duration-200 hover:scale-105 tf-glow-pulse">
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
