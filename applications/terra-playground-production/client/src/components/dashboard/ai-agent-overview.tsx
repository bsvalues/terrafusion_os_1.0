import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AIAgent, AIAgentStatus } from '@/lib/types';
import { Database,
  Calculator,
  MessageSquare,
  ClipboardCheck,
  Scale,
  Upload,
  MapPin,
  BrainCircuit,
  FileText,
  PieChart,
  Network,
  Zap,
  RefreshCcw,
  Warning,
  CheckCircle2,
  RotateCcw,
  Settings,
  Plus,
  BookOpen,
 } from '@mui/icons-material';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo, useEffect } from 'react';

// Get icon based on agent type
const getAgentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'data':
      return <Database className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'property':
      return <Calculator className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'citizen':
      return (
        <MessageSquare className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />
      );
    case 'quality':
      return (
        <ClipboardCheck className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />
      );
    case 'legal':
      return <Scale className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'integration':
      return <Upload className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'gis':
      return <MapPin className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'ai':
      return (
        <BrainCircuit className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />
      );
    case 'report':
      return <FileText className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'analytics':
      return <PieChart className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    case 'workflow':
      return <Network className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
    default:
      return <Database className="h-5 w-5 text-primary-500 mr-2" aria-hidden="true" role="img" />;
  }
};

// Get status badge based on agent status
const getStatusBadge = (status: AIAgentStatus) => {
  switch (status) {
    case AIAgentStatus.Active:
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
          aria-label="Agent status: Active"
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Active
        </Badge>
      );
    case AIAgentStatus.Syncing:
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"
          aria-label="Agent status: Syncing"
        >
          <RefreshCcw className="h-3 w-3 animate-spin" aria-hidden="true" /> Syncing
        </Badge>
      );
    case AIAgentStatus.Error:
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
          aria-label="Agent status: Error"
        >
          <Warning className="h-3 w-3" aria-hidden="true" /> Error
        </Badge>
      );
    case AIAgentStatus.Learning:
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1"
          aria-label="Agent status: Learning"
        >
          <BookOpen className="h-3 w-3" aria-hidden="true" /> Learning
        </Badge>
      );
    case AIAgentStatus.Inactive:
    default:
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1"
          aria-label="Agent status: Inactive"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Inactive
        </Badge>
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

// Helper to render mobile card view for each agent
const AgentMobileCard = ({ agent }: { agent: AIAgent }) => {
  return (
    <div
      className="p-4 border rounded-lg mb-3 bg-white"
      role="article"
      aria-labelledby={`agent-title-${agent.id}`}
      tabIndex={0}
    >
      <div className="flex items-start"><>

        <div
          className="h-9 w-9 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 mr-3"
          aria-hidden="true"
        >
          {getAgentIcon(agent.type)}
        </div>
        <div
</> className="flex-1">
          <div className="flex justify-between items-start">
            <div><>

              <div id={`agent-title-${agent.id}`} className="font-medium text-gray-900">
                {agent.name}
              </div>
              <div
</>
                className="text-xs text-gray-500"
                aria-label={`Agent type: ${agent.type}, ID: ${agent.agentId || agent.id}`}
              >
                {agent.type} • ID: {agent.agentId || agent.id}
              </div>
            </div>
            {getStatusBadge(agent.status)}
          </div>

          <div className="mt-3"><>

            <div
              className="text-xs text-gray-500 mb-1"
              aria-label={`Last active ${formatTimeSince(agent.lastActivity)}`}
            >
              Last Activity: {formatTimeSince(agent.lastActivity)}
            </div>
            <div
</> className="flex items-center mb-3">
              <div
                className="w-full bg-gray-200 rounded-full h-2.5 mr-2"
                role="progressbar"
                aria-valuenow={agent.performance}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Agent performance: ${agent.performance}%`}
              >
                <div
                  className={`${
                    agent.status === AIAgentStatus.Syncing
                      ? 'bg-yellow-500'
                      : agent.status === AIAgentStatus.Error
                        ? 'bg-red-500'
                        : agent.status === AIAgentStatus.Learning
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                  } h-2.5 rounded-full`}
                  style={{ width: `${agent.performance}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{agent.performance}%</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              aria-label={`Run ${agent.name}`}
            >
              <Zap className="h-4 w-4 mr-1" aria-hidden="true" /> Run Agent
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper to render loading skeleton for mobile view
const AgentMobileCardSkeleton = () => {
  return (
    <div
      className="p-4 border rounded-lg mb-3 bg-white"
      role="alert"
      aria-busy="true"
      aria-label="Loading agent information"
    >
      <div className="flex items-start">
        <Skeleton className="h-9 w-9 rounded-md mr-3" aria-hidden="true" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-32 rounded mb-1" aria-hidden="true" /><>

              <Skeleton className="h-3 w-24 rounded" aria-hidden="true" />
            </div>
            <Skeleton
</> className="h-5 w-20 rounded-full" aria-hidden="true" />
          </div>

          <div className="mt-3">
            <Skeleton className="h-3 w-32 rounded mb-2" aria-hidden="true" />
            <div className="flex items-center mb-3">
              <Skeleton className="w-full h-2.5 mr-2 rounded-full" aria-hidden="true" /><>

              <Skeleton className="h-4 w-8 rounded" aria-hidden="true" />
            </div>
            <Skeleton
</> className="h-8 w-full rounded" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};

const AIAgentOverview = () => {
  const { data: agents = [], isLoading } = useQuery<AIAgent[]>({
    queryKey: ['/api/ai-agents'],
  });

  const [showAll, setShowAll] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'all'>('active');

  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Effect to handle resize and check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Filter agents based on selected tab using enum
  const displayedAgents = useMemo(() => {
    return agents.filter(agent => {
      if (selectedTab === 'active') {
        return (
          agent.status === AIAgentStatus.Active ||
          agent.status === AIAgentStatus.Syncing ||
          agent.status === AIAgentStatus.Learning
        );
      }
      return true;
    });
  }, [agents, selectedTab]);

  // Calculate agent stats using enum
  const agentStats = useMemo(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(agent => agent.status === AIAgentStatus.Active).length;
    const learningAgents = agents.filter(agent => agent.status === AIAgentStatus.Learning).length;
    const errorAgents = agents.filter(agent => agent.status === AIAgentStatus.Error).length;

    return {
      totalAgents,
      activeAgents,
      learningAgents,
      errorAgents,
    };
  }, [agents]);

  const { totalAgents, activeAgents, learningAgents, errorAgents } = agentStats;

  return (
    <Card className="lg:col-span-2 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div><>

            <CardTitle className="text-xl font-semibold">AI Agents</CardTitle>
            <CardDescription
</>>Monitor and manage system agents</CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            <Button variant="outline" size="sm" className="h-8 gap-1" aria-label="Add Agent">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sm:inline">Add Agent</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1" aria-label="Agent Settings">
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sm:inline">Settings</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center mt-4 border-b border-gray-200">
          <div className="flex items-center space-x-4"><>

            <button
              className={`pb-3 px-1 text-sm font-medium ${selectedTab === 'active' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSelectedTab('active')}
              aria-label="Show active agents"
              aria-pressed={selectedTab === 'active'}
              role="tab"
            >
              Active Agents
            </button>
            <button
</>
              className={`pb-3 px-1 text-sm font-medium ${selectedTab === 'all' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSelectedTab('all')}
              aria-label="Show all agents"
              aria-pressed={selectedTab === 'all'}
              role="tab"
            >
              All Agents
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-0">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50"
              role="status"
              aria-label={`${activeAgents} active agents`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
              <span className="text-xs font-medium">{activeAgents} Active</span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50"
              role="status"
              aria-label={`${learningAgents} learning agents`}
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
              <span className="text-xs font-medium">{learningAgents} Learning</span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50"
              role="status"
              aria-label={`${errorAgents} agents with errors`}
            >
              <Warning className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              <span className="text-xs font-medium">{errorAgents} Error</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Responsive view - show cards on mobile, table on desktop */}
        {isMobile ? (
          // Mobile view - card layout
          <div className="space-y-2">
            {isLoading ? (
              // Loading skeletons for mobile
              Array(3)
                .fill(0)
                .map((_ /* , index */) => <AgentMobileCardSkeleton key={`loading-mobile-${index}`} />)
            ) : displayedAgents.length === 0 ? (
              // Empty state for mobile
              <div className="py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  {selectedTab === 'active' ? (
                    <>
                      <RotateCcw className="h-8 w-8 text-gray-400" aria-hidden="true" /><>

                      <p>No active agents found</p>
                      <Button
</>
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedTab('all')}
                        aria-label="View all agents including inactive ones"
                      >
                        View all agents
                      </Button>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-8 w-8 text-gray-400" aria-hidden="true" /><>

                      <p>No agents found</p>
                      <Button
</>
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        aria-label="Add a new agent to the system"
                      >
                        <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Agent
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Agent cards for mobile
              displayedAgents.map(agent => (
                <AgentMobileCard key={agent.agentId || agent.id} agent={agent} />
              ))
            )}

            {/* Show more/less button for mobile */}
            <div className="mt-4 flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedTab(selectedTab === 'active' ? 'all' : 'active')}
                aria-label={
                  selectedTab === 'active'
                    ? 'Show all agents including inactive ones'
                    : 'Show only active agents'
                }
              >
                {selectedTab === 'active' ? 'Show all agents' : 'Show active agents only'}
              </Button>
            </div>
          </div>
        ) : (
          // Desktop view - table layout
          <div>
            <div className="overflow-x-auto">
              <table
                className="min-w-full divide-y divide-gray-200"
                role="grid"
                aria-label="AI Agents table"
              ><>

                <caption className="sr-only">
                  List of AI agents, their status, activity and performance metrics
                </caption>
                <thead
</>>
                  <tr><>

                    <th
                      scope="col"
                      className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Agent
                    </th>
                    <th
</>
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th><>

                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Activity
                    </th>
                    <th
</>
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Performance
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    Array(4)
                      .fill(0)
                      .map((_ /* , index */) => (
                        <tr
                          key={`loading-${index}`}
                          role="row"
                          aria-busy="true"
                          aria-label="Loading agent information"
                        >
                          <td className="py-3 pl-4 pr-3">
                            <div className="flex items-center">
                              <Skeleton className="h-8 w-8 rounded-md mr-3" aria-hidden="true" />
                              <div>
                                <Skeleton className="h-4 w-32 rounded mb-1" aria-hidden="true" />
                                <Skeleton className="h-3 w-24 rounded" aria-hidden="true" />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3"><>

                            <Skeleton className="h-5 w-20 rounded-full" aria-hidden="true" />
                          </td>
                          <td
</> className="px-3 py-3"><>

                            <Skeleton className="h-4 w-24 rounded" aria-hidden="true" />
                          </td>
                          <td
</> className="px-3 py-3">
                            <div className="flex items-center">
                              <Skeleton
                                className="w-24 h-2.5 mr-2 rounded-full"
                                aria-hidden="true"
                              />
                              <Skeleton className="h-4 w-8 rounded" aria-hidden="true" />
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <Skeleton className="h-8 w-20 rounded" aria-hidden="true" />
                          </td>
                        </tr>
                      ))
                  ) : displayedAgents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {selectedTab === 'active' ? (
                            <>
                              <RotateCcw className="h-8 w-8 text-gray-400" aria-hidden="true" /><>

                              <p>No active agents found</p>
                              <Button
</>
                                variant="link"
                                size="sm"
                                onClick={() => setSelectedTab('all')}
                                aria-label="View all agents including inactive ones"
                              >
                                View all agents
                              </Button>
                            </>
                          ) : (
                            <>
                              <BrainCircuit className="h-8 w-8 text-gray-400" aria-hidden="true" /><>

                              <p>No agents found</p>
                              <Button
</>
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                aria-label="Add a new agent to the system"
                              >
                                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add Agent
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedAgents.map(agent => (
                      <tr
                        key={agent.agentId || agent.id}
                        className="hover:bg-gray-50 transition-colors"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            // Trigger the same action as clicking the Run button
                            e.preventDefault();
                            // This would typically call an agent run function
                          }
                        }}
                      >
                        <td className="py-3 pl-4 pr-3">
                          <div className="flex items-center"><>

                            <div className="h-9 w-9 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 mr-3">
                              {getAgentIcon(agent.type)}
                            </div>
                            <div
</>><>

                              <div className="font-medium text-gray-900">{agent.name}</div>
                              <div
</> className="text-xs text-gray-500">
                                {agent.type} • ID: {agent.agentId || agent.id}
                              </div>
                            </div>
                          </div>
                        </td><>

                        <td className="px-3 py-3 whitespace-nowrap">
                          {getStatusBadge(agent.status)}
                        </td>
                        <td
</> className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatTimeSince(agent.lastActivity)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-24 bg-gray-200 rounded-full h-2.5 mr-2"
                              role="progressbar"
                              aria-valuenow={agent.performance}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`Agent performance: ${agent.performance}%`}
                            >
                              <div
                                className={`${
                                  agent.status === AIAgentStatus.Syncing
                                    ? 'bg-yellow-500'
                                    : agent.status === AIAgentStatus.Error
                                      ? 'bg-red-500'
                                      : agent.status === AIAgentStatus.Learning
                                        ? 'bg-blue-500'
                                        : 'bg-green-500'
                                } h-2.5 rounded-full`}
                                style={{ width: `${agent.performance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{agent.performance}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-600"
                            aria-label={`Run ${agent.name}`}
                          >
                            <Zap className="h-4 w-4 mr-1" aria-hidden="true" /> Run
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedTab(selectedTab === 'active' ? 'all' : 'active')}
                aria-label={
                  selectedTab === 'active'
                    ? 'Show all agents including inactive ones'
                    : 'Show only active agents'
                }
              >
                {selectedTab === 'active' ? 'Show all agents' : 'Show active agents only'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAgentOverview;
