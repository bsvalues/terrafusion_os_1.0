import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { SystemActivity, AIAgent } from "@/lib/types";
import { MessageSquare, FileText, CheckCircle, AlertTriangle, Clock } from "lucide-react";

// Format time for activity
const formatActivityTime = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Get activity icon based on entity type
const getActivityIcon = (activity: SystemActivity, agents: AIAgent[] = []) => {
  const agentColor = activity.agentId ? 
    (agents.find(a => a.id === activity.agentId)?.type === 'integration' ? 'bg-yellow-500' : 'bg-primary-500') : 
    'bg-gray-400';
    
  switch (activity.entityType) {
    case 'protest':
      return (
        <div className={`h-8 w-8 ${agentColor} rounded-full flex items-center justify-center ring-8 ring-white`}>
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
      );
    case 'import':
      return (
        <div className={`h-8 w-8 bg-secondary-600 rounded-full flex items-center justify-center ring-8 ring-white`}>
          <FileText className="h-5 w-5 text-white" />
        </div>
      );
    case 'valuation':
      return (
        <div className={`h-8 w-8 bg-green-600 rounded-full flex items-center justify-center ring-8 ring-white`}>
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
      );
    case 'property':
      return (
        <div className={`h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center ring-8 ring-white`}>
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
      );
    case 'system':
    default:
      return (
        <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center ring-8 ring-white">
          <Clock className="h-5 w-5 text-white" />
        </div>
      );
  }
};

// Get agent name from agent ID
const getAgentName = (agentId: number | null, agents: AIAgent[] = []) => {
  if (!agentId) return 'System';
  const agent = agents.find(a => a.id === agentId);
  return agent ? agent.name : 'Unknown Agent';
};

const SystemActivityFeed = () => {
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<SystemActivity[]>({
    queryKey: ['/api/system-activities'],
  });
  
  const { data: agents = [] } = useQuery<AIAgent[]>({
    queryKey: ['/api/ai-agents'],
  });

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">System Activity</h3>
        <div className="mt-4 flow-root">
          <ul role="list" className="-mb-8">
            {activitiesLoading ? (
              <li className="py-4 text-center text-gray-500">Loading activities...</li>
            ) : activities.length === 0 ? (
              <li className="py-4 text-center text-gray-500">No activities found</li>
            ) : (
              activities.slice(0, 5).map((activity, idx) => (
                <li key={activity.activityId || activity.id}>
                  <div className="relative pb-8">
                    {idx < activities.slice(0, 5).length - 1 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div className="relative px-1">
                          {getActivityIcon(activity, agents)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-1.5">
                        <div className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">{getAgentName(activity.agentId, agents)}</span> {activity.activity}
                          <span className="whitespace-nowrap ml-2">{formatActivityTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-6 text-center">
          <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all activity
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemActivityFeed;
