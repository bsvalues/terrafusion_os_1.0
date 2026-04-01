import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from "@/lib/queryClient";
import { LoaderCircle, Package, Play, Pause, Settings, RefreshCw, Edit, Plus, Trash2, Boxes, Code, Copy, Cpu } from 'lucide-react';

// Schema for application deployment
const deployApplicationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["service", "api", "ui", "agent", "integration"]),
  configuration: z.string().refine(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Must be valid JSON"
  }),
  autoStart: z.boolean().default(true)
});

// Schema for integration configuration
const integrationConfigSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  targetSystem: z.string().min(3, "Target system is required"),
  endpointUrl: z.string().url("Must be a valid URL"),
  authType: z.enum(["none", "basic", "oauth", "apikey"]),
  credentials: z.string().optional(),
  transformations: z.string().refine(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return value === "";
    }
  }, {
    message: "Must be valid JSON or empty"
  }),
  enabled: z.boolean().default(true)
});

type DeployApplicationValues = z.infer<typeof deployApplicationSchema>;
type IntegrationConfigValues = z.infer<typeof integrationConfigSchema>;

interface Application {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  version: string;
  lastDeployed: string;
  health: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface Integration {
  id: string;
  name: string;
  targetSystem: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  transferRate: number;
  successRate: number;
}

const ApplicationManagerPanel: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('applications');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCreatingIntegration, setIsCreatingIntegration] = useState(false);

  // Application deployment form
  const deployForm = useForm<DeployApplicationValues>({
    resolver: zodResolver(deployApplicationSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "service",
      configuration: "{\n  \"resources\": {\n    \"cpu\": 1,\n    \"memory\": 512\n  },\n  \"endpoints\": [],\n  \"environment\": {}\n}",
      autoStart: true
    }
  });

  // Integration configuration form
  const integrationForm = useForm<IntegrationConfigValues>({
    resolver: zodResolver(integrationConfigSchema),
    defaultValues: {
      name: "",
      targetSystem: "",
      endpointUrl: "",
      authType: "none",
      credentials: "",
      transformations: "",
      enabled: true
    }
  });

  // Query for deployed applications
  const { 
    data: applications, 
    isLoading: isLoadingApplications,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['/api/agents/master-development/applications'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Query for integrations
  const { 
    data: integrations, 
    isLoading: isLoadingIntegrations,
    refetch: refetchIntegrations,
  } = useQuery({
    queryKey: ['/api/agents/master-development/integrations'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mutation for deploying an application
  const deployApplicationMutation = useMutation({
    mutationFn: async (data: DeployApplicationValues) => {
      const response = await fetch('/api/agents/master-development/applications/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          configuration: JSON.parse(data.configuration)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deploy application');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Application Deployed',
        description: 'Your application has been successfully deployed',
      });
      deployForm.reset();
      setIsDeploying(false);
      refetchApplications();
    },
    onError: (error) => {
      toast({
        title: 'Deployment Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation for creating an integration
  const createIntegrationMutation = useMutation({
    mutationFn: async (data: IntegrationConfigValues) => {
      const response = await fetch('/api/agents/master-development/integrations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          transformations: data.transformations ? JSON.parse(data.transformations) : {}
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create integration');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Integration Created',
        description: 'Your integration has been successfully created',
      });
      integrationForm.reset();
      setIsCreatingIntegration(false);
      refetchIntegrations();
    },
    onError: (error) => {
      toast({
        title: 'Integration Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation for starting/stopping an application
  const toggleApplicationMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'start' | 'stop' }) => {
      const response = await fetch(`/api/agents/master-development/applications/${id}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} application`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Application ${variables.action === 'start' ? 'Started' : 'Stopped'}`,
        description: `Application has been successfully ${variables.action === 'start' ? 'started' : 'stopped'}`,
      });
      refetchApplications();
    }
  });

  // Mutation for enabling/disabling an integration
  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string, enabled: boolean }) => {
      const response = await fetch(`/api/agents/master-development/integrations/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update integration`);
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Integration ${variables.enabled ? 'Enabled' : 'Disabled'}`,
        description: `Integration has been successfully ${variables.enabled ? 'enabled' : 'disabled'}`,
      });
      refetchIntegrations();
    }
  });

  // Handle form submissions
  const onDeploySubmit = (data: DeployApplicationValues) => {
    deployApplicationMutation.mutate(data);
  };

  const onIntegrationSubmit = (data: IntegrationConfigValues) => {
    createIntegrationMutation.mutate(data);
  };

  // Toggle application status
  const handleToggleApplication = (app: Application) => {
    toggleApplicationMutation.mutate({
      id: app.id,
      action: app.status === 'running' ? 'stop' : 'start'
    });
  };

  // Toggle integration status
  const handleToggleIntegration = (integration: Integration, enabled: boolean) => {
    toggleIntegrationMutation.mutate({
      id: integration.id,
      enabled
    });
  };

  // Get application type icon
  const getApplicationTypeIcon = (type: string) => {
    switch (type) {
      case 'service': return <Cpu className="h-4 w-4" />;
      case 'api': return <Code className="h-4 w-4" />;
      case 'ui': return <Boxes className="h-4 w-4" />;
      case 'agent': return <Package className="h-4 w-4" />;
      case 'integration': return <Copy className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Get application status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected': return 'bg-green-500';
      case 'stopped':
      case 'disconnected': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Application Manager</h2>
          <p className="text-gray-500">
            Deploy, monitor, and manage applications and integrations
          </p>
        </div>
      </div>

      <Tabs defaultValue="applications" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="deployment">New Deployment</TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Deployed Applications</span>
                  <Button variant="outline" size="icon" onClick={() => refetchApplications()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Currently deployed application instances
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="flex justify-center py-8">
                    <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start mb-2"
                        onClick={() => {
                          setActiveTab('deployment');
                          setSelectedApplication(null);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Deploy New Application
                      </Button>

                      {/* Application list */}
                      {applications?.length > 0 ? applications.map((app: Application) => (
                        <div 
                          key={app.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedApplication?.id === app.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getApplicationTypeIcon(app.type)}
                              <span className="font-medium ml-2">{app.name}</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(app.status)}`} />
                              <span className="text-xs ml-1.5 text-gray-500">{app.status}</span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {app.description.length > 50 
                              ? `${app.description.substring(0, 50)}...` 
                              : app.description}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No applications deployed</p>
                          <p className="text-xs mt-1">Deploy your first application to get started</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Application details */}
            {selectedApplication ? (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {getApplicationTypeIcon(selectedApplication.type)}
                        <span className="ml-2">{selectedApplication.name}</span>
                        <Badge className="ml-2" variant="outline">{selectedApplication.version}</Badge>
                      </CardTitle>
                      <CardDescription>{selectedApplication.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggleApplicationMutation.isPending}
                        onClick={() => handleToggleApplication(selectedApplication)}
                      >
                        {toggleApplicationMutation.isPending ? (
                          <LoaderCircle className="h-4 w-4 mr-1 animate-spin" />
                        ) : selectedApplication.status === 'running' ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {selectedApplication.status === 'running' ? 'Stop' : 'Start'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Status</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Status</p>
                              <div className="flex items-center mt-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedApplication.status)}`} />
                                <span className="text-sm font-medium ml-2 capitalize">{selectedApplication.status}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Health</p>
                              <p className="text-sm font-medium mt-1">{selectedApplication.health}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Last Deployed</p>
                              <p className="text-sm font-medium mt-1">{formatDate(selectedApplication.lastDeployed)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Type</p>
                              <p className="text-sm font-medium mt-1 capitalize">{selectedApplication.type}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Resource Usage</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-gray-500">CPU Usage</p>
                                <p className="text-xs font-medium">{selectedApplication.cpuUsage}%</p>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-500 h-1.5 rounded-full" 
                                  style={{ width: `${selectedApplication.cpuUsage}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-gray-500">Memory Usage</p>
                                <p className="text-xs font-medium">{selectedApplication.memoryUsage}%</p>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-purple-500 h-1.5 rounded-full" 
                                  style={{ width: `${selectedApplication.memoryUsage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Configuration</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md h-[200px] overflow-auto">
                          <pre className="text-xs">
                            <code>
                              {JSON.stringify({
                                id: selectedApplication.id,
                                name: selectedApplication.name,
                                type: selectedApplication.type,
                                version: selectedApplication.version,
                                resources: {
                                  cpu: 1,
                                  memory: 512
                                },
                                endpoints: [
                                  {
                                    path: "/api/v1",
                                    method: "GET",
                                    authentication: true
                                  }
                                ],
                                environment: {
                                  NODE_ENV: "production",
                                  LOG_LEVEL: "info"
                                }
                              }, null, 2)}
                            </code>
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="justify-start">
                            <Settings className="h-4 w-4 mr-2" />
                            View Logs
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Restart
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Config
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Application Details</CardTitle>
                  <CardDescription>
                    Select an application or deploy a new one to view details
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Application Selected</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Select an application from the list to view details, or deploy a new application to get started.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('deployment')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Deploy New Application
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Active Integrations</span>
                  <Button variant="outline" size="icon" onClick={() => refetchIntegrations()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Configured system integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingIntegrations ? (
                  <div className="flex justify-center py-8">
                    <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start mb-2"
                        onClick={() => {
                          setIsCreatingIntegration(true);
                          setSelectedIntegration(null);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Integration
                      </Button>

                      {/* Integration list */}
                      {integrations?.length > 0 ? integrations.map((integration: Integration) => (
                        <div 
                          key={integration.id}
                          className={`p-3 border rounded-md cursor-pointer transition-colors ${
                            selectedIntegration?.id === integration.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedIntegration(integration)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Copy className="h-4 w-4" />
                              <span className="font-medium ml-2">{integration.name}</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`} />
                              <span className="text-xs ml-1.5 text-gray-500">{integration.status}</span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {integration.targetSystem}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Copy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No integrations configured</p>
                          <p className="text-xs mt-1">Create your first integration to get started</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Integration details or form */}
            {isCreatingIntegration ? (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>New Integration</CardTitle>
                  <CardDescription>
                    Configure a new system integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...integrationForm}>
                    <form onSubmit={integrationForm.handleSubmit(onIntegrationSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={integrationForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Integration Name</FormLabel>
                              <FormControl>
                                <Input placeholder="FTP Data Sync" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={integrationForm.control}
                          name="targetSystem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target System</FormLabel>
                              <FormControl>
                                <Input placeholder="County Records System" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={integrationForm.control}
                        name="endpointUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://api.example.com/data" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={integrationForm.control}
                        name="authType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Authentication Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select authentication type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Authentication</SelectItem>
                                <SelectItem value="basic">Basic Auth</SelectItem>
                                <SelectItem value="oauth">OAuth 2.0</SelectItem>
                                <SelectItem value="apikey">API Key</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {integrationForm.watch('authType') !== 'none' && (
                        <FormField
                          control={integrationForm.control}
                          name="credentials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credentials</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={
                                    integrationForm.watch('authType') === 'basic' 
                                      ? 'username:password' 
                                      : integrationForm.watch('authType') === 'apikey'
                                      ? 'API Key'
                                      : '{"client_id": "...", "client_secret": "..."}'
                                  } 
                                  className="font-mono"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                {integrationForm.watch('authType') === 'basic' 
                                  ? 'Enter username and password separated by colon' 
                                  : integrationForm.watch('authType') === 'apikey'
                                  ? 'Enter the API key'
                                  : 'Enter OAuth credentials as JSON'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={integrationForm.control}
                        name="transformations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Transformations (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder='{"fieldMappings": {"source_id": "id", "source_name": "name"}}' 
                                className="font-mono h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              JSON configuration for data transformations between systems
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={integrationForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Integration</FormLabel>
                              <FormDescription>
                                Activate this integration immediately after creation
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setIsCreatingIntegration(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createIntegrationMutation.isPending}
                        >
                          {createIntegrationMutation.isPending && (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Integration
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : selectedIntegration ? (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Copy className="h-4 w-4 mr-2" />
                        {selectedIntegration.name}
                      </CardTitle>
                      <CardDescription>
                        Integration with {selectedIntegration.targetSystem}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <FormField
                        control={integrationForm.control}
                        name="enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormLabel className="mt-0">Enable</FormLabel>
                            <FormControl>
                              <Switch
                                checked={selectedIntegration.status === 'connected'}
                                onCheckedChange={(checked) => 
                                  handleToggleIntegration(selectedIntegration, checked)
                                }
                                disabled={toggleIntegrationMutation.isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Status</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Connection Status</p>
                              <div className="flex items-center mt-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedIntegration.status)}`} />
                                <span className="text-sm font-medium ml-2 capitalize">{selectedIntegration.status}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Success Rate</p>
                              <p className="text-sm font-medium mt-1">{selectedIntegration.successRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Last Sync</p>
                              <p className="text-sm font-medium mt-1">{formatDate(selectedIntegration.lastSync)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Transfer Rate</p>
                              <p className="text-sm font-medium mt-1">{selectedIntegration.transferRate} KB/s</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2">Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="justify-start">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Now
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Settings className="h-4 w-4 mr-2" />
                            View Logs
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Config
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Configuration</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md h-[300px] overflow-auto">
                        <pre className="text-xs">
                          <code>
                            {JSON.stringify({
                              id: selectedIntegration.id,
                              name: selectedIntegration.name,
                              targetSystem: selectedIntegration.targetSystem,
                              endpointUrl: "https://api.example.com/data",
                              authType: "apikey",
                              schedule: {
                                frequency: "hourly",
                                startTime: "00:00",
                                daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
                              },
                              dataMapping: {
                                fieldMappings: {
                                  "source_id": "id",
                                  "source_name": "name",
                                  "source_address": "location.address",
                                  "source_owner": "ownership.primary"
                                },
                                transformations: [
                                  {
                                    field: "source_date",
                                    transformation: "formatDate",
                                    format: "YYYY-MM-DD"
                                  }
                                ]
                              }
                            }, null, 2)}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Integration Details</CardTitle>
                  <CardDescription>
                    Select an integration or create a new one to view details
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Copy className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Integration Selected</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Select an integration from the list to view details, or create a new integration to get started.
                  </p>
                  <Button 
                    onClick={() => setIsCreatingIntegration(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Integration
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Deploy New Application</CardTitle>
              <CardDescription>
                Configure and deploy a new application component
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...deployForm}>
                <form onSubmit={deployForm.handleSubmit(onDeploySubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField
                        control={deployForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Property Analysis Service" {...field} />
                            </FormControl>
                            <FormDescription>
                              A unique name for this application
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deployForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Service for analyzing property data trends" 
                                className="h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Brief description of what this application does
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deployForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select application type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="service">Background Service</SelectItem>
                                <SelectItem value="api">API Service</SelectItem>
                                <SelectItem value="ui">User Interface</SelectItem>
                                <SelectItem value="agent">Intelligent Agent</SelectItem>
                                <SelectItem value="integration">Integration Service</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              The type of application component to deploy
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={deployForm.control}
                        name="autoStart"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Auto-Start Application</FormLabel>
                              <FormDescription>
                                Start the application automatically after deployment
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        control={deployForm.control}
                        name="configuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Configuration (JSON)</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="font-mono h-[400px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              JSON configuration for the application
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        deployForm.reset();
                        setActiveTab('applications');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={deployApplicationMutation.isPending}
                    >
                      {deployApplicationMutation.isPending && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Deploy Application
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationManagerPanel;