import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Workflow, User } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapIcon, ActivityIcon, CheckSquareIcon, ClockIcon, WarningIcon  } from '@mui/icons-material';
import { workflowTypeLabels, workflowTypeIcons, WorkflowType } from "@/lib/workflow-types";
import { getQueryFn } from "@/lib/queryClient";
import { EnhancedMetricsPanel } from "@/components/dashboard/enhanced-metrics-panel";

export default function HomePage() {
  const [, navigate] = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Get user information
  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch workflows from the server
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    enabled: !!user, // Only run query if user is authenticated
  });
  
  useEffect(() => {
    // Set notification count based on number of workflows with recent updates
    // For now, we'll use a simple counter based on the number of workflows
    if (workflows && workflows.length > 0) {
      // Count in-progress workflows as notifications
      const inProgressCount = workflows.filter(w => w.status === 'in_progress').length;
      setNotificationCount(inProgressCount > 0 ? inProgressCount : 0);
    } else {
      setNotificationCount(0);
    }
  }, [workflows]);
  
  // Create new workflow
  const handleCreateWorkflow = (type: WorkflowType) => {
    navigate(`/workflow/${type}`);
  };
  
  // Open existing workflow
  const handleOpenWorkflow = (workflowId: number, type: string) => {
    navigate(`/workflow/${type}?id=${workflowId}`);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header notificationCount={notificationCount} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* Development Mode Alert */}
          <Alert className="mb-6 border-amber-500 bg-amber-50">
            <WarningIcon className="h-4 w-4 text-amber-600" /><>

            <AlertTitle className="text-amber-800">Development Mode</AlertTitle>
            <AlertDescription
</> className="text-amber-700">
              Authentication is bypassed for development. You are automatically logged in as a developer.
            </AlertDescription>
          </Alert>
          
          {/* Welcome Section */}
          <div className="mb-8"><>

            <h1 className="text-2xl font-bold text-neutral-800 mb-2">
              Welcome, {isUserLoading ? 'Loading...' : ((user as any)?.fullName || user?.username || 'User')}
            </h1>
            <p
</> className="text-neutral-600">
              Benton County Assessor's Office GIS Workflow Assistant
            </p>
          </div>
          
          {/* New Workflow Cards */}<>

          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Start a New Workflow</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(workflowTypeLabels).map(([type, label]) => (
              <Card key={type} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <CardDescription>
                    {type === 'long_plat' && 'Create and process a new long plat'}
                    {type === 'bla' && 'Execute a Boundary Line Adjustment'}
                    {type === 'merge_split' && 'Process parcel merges and splits'}
                    {type === 'sm00_report' && 'Generate monthly segregation reports'}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => handleCreateWorkflow(type as WorkflowType)}
                  >
                    Start
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Recent Workflows */}
          <h2 className="text-lg font-semibold text-neutral-700 mb-4">Recent Workflows</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <ClockIcon className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : workflows && workflows.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr><>

                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th
</> className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Title
                    </th><>

                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th
</> className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {workflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-neutral-600">
                            {workflowTypeLabels[workflow.type as WorkflowType]}
                          </span>
                        </div>
                      </td><>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">
                        {workflow.title}
                      </td>
                      <td
</> className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                          workflow.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          workflow.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-neutral-100 text-neutral-800'
                        }`}>
                          {workflow.status && workflow.status.includes('_') ? 
                            workflow.status.replace('_', ' ') : 
                            workflow.status || 'draft'}
                        </span>
                      </td><>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'Not updated'}
                      </td>
                      <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary-600 hover:text-primary-700"
                          onClick={() => handleOpenWorkflow(workflow.id, workflow.type)}
                        >
                          Continue
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <ActivityIcon className="h-12 w-12 text-neutral-300" /><>

                  <h3 className="text-lg font-medium text-neutral-700">No Recent Workflows</h3>
                  <p
</> className="text-neutral-500">You haven't created any workflows yet. Get started by creating a new workflow above.</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Dashboard Analytics */}<>

          <h2 className="text-lg font-semibold text-neutral-700 mt-8 mb-4">Dashboard Analytics</h2>
          <div
</> className="grid grid-cols-12 gap-6">
            <EnhancedMetricsPanel />
          </div>
          
          {/* Quick Access Shortcuts */}<>

          <h2 className="text-lg font-semibold text-neutral-700 mt-8 mb-4">Quick Access</h2>
          <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="bg-primary-100 p-3 rounded-full"><>

                  <MapIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div
</>><>

                  <h3 className="text-base font-medium text-neutral-800">Map Viewer</h3>
                  <p
</> className="text-sm text-neutral-500">View and interact with GIS maps</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" onClick={() => navigate("/map-viewer")} className="w-full">
                  Open Map
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="bg-primary-100 p-3 rounded-full"><>

                  <CheckSquareIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div
</>><>

                  <h3 className="text-base font-medium text-neutral-800">Parcel ID Generator</h3>
                  <p
</> className="text-sm text-neutral-500">Create new parcel numbers</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" onClick={() => navigate("/parcel-generator")} className="w-full">
                  Generate IDs
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="bg-primary-100 p-3 rounded-full"><>

                  <ActivityIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div
</>><>

                  <h3 className="text-base font-medium text-neutral-800">SM00 Report</h3>
                  <p
</> className="text-sm text-neutral-500">Generate segregation reports</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" onClick={() => navigate("/report")} className="w-full">
                  Create Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
