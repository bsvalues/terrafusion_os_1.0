import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { AIAgent } from "@/lib/types";
import { Database, Calculator, MessageSquare, ClipboardCheck, Scale, Upload } from "lucide-react";

// Get icon based on agent type
const getAgentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'data':
      return <Database className="h-5 w-5 text-primary-500 mr-2" />;
    case 'property':
      return <Calculator className="h-5 w-5 text-primary-500 mr-2" />;
    case 'citizen':
      return <MessageSquare className="h-5 w-5 text-primary-500 mr-2" />;
    case 'quality':
      return <ClipboardCheck className="h-5 w-5 text-primary-500 mr-2" />;
    case 'legal':
      return <Scale className="h-5 w-5 text-primary-500 mr-2" />;
    case 'integration':
      return <Upload className="h-5 w-5 text-primary-500 mr-2" />;
    default:
      return <Database className="h-5 w-5 text-primary-500 mr-2" />;
  }
};

// Get status badge based on agent status
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    case 'syncing':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Syncing
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Inactive
        </span>
      );
  }
};

// Format time since last activity
const formatTimeSince = (timestamp: string) => {
  const now = new Date();
  const lastActivity = new Date(timestamp);
  const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const AIAgentOverview = () => {
  const { data: agents = [], isLoading } = useQuery<AIAgent[]>({
    queryKey: ['/api/ai-agents'],
  });

  return (
    <Card className="lg:col-span-2 bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">AI Agents Overview</h3>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Agent</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Activity</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">Loading agents...</td>
                    </tr>
                  ) : agents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">No agents found</td>
                    </tr>
                  ) : (
                    agents.map((agent) => (
                      <tr key={agent.agentId || agent.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          <div className="flex items-center">
                            {getAgentIcon(agent.type)}
                            {agent.name}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {getStatusBadge(agent.status)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatTimeSince(agent.lastActivity)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                              <div 
                                className={`${agent.status === 'syncing' ? 'bg-yellow-500' : 'bg-green-500'} h-2.5 rounded-full`} 
                                style={{ width: `${agent.performance}%` }}
                              ></div>
                            </div>
                            <span>{agent.performance}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAgentOverview;
