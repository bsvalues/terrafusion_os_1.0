import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Validation schemas
const connectionFormSchema = z.object({
  connectionString: z.string().min(1, 'Connection string is required'),
  databaseType: z.string().min(1, 'Database type is required')
});

const conversionProjectFormSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  sourceConnectionString: z.string().min(1, 'Source connection string is required'),
  sourceType: z.string().min(1, 'Source database type is required'),
  targetConnectionString: z.string().min(1, 'Target connection string is required'),
  targetType: z.string().min(1, 'Target database type is required')
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
type ConversionProjectFormValues = z.infer<typeof conversionProjectFormSchema>;

export default function DatabaseConversionPage() {
  const [activeTab, setActiveTab] = useState('test-connection');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();

  // Connection test form
  const connectionForm = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      connectionString: '',
      databaseType: 'postgresql'
    }
  });

  // Project creation form
  const projectForm = useForm<ConversionProjectFormValues>({
    resolver: zodResolver(conversionProjectFormSchema),
    defaultValues: {
      projectName: '',
      description: '',
      sourceConnectionString: '',
      sourceType: 'postgresql',
      targetConnectionString: '',
      targetType: 'postgresql'
    }
  });

  // Fetch database types
  const { data: databaseTypes, isLoading: isLoadingDatabaseTypes } = useQuery({
    queryKey: ['/api/database-conversion/database-types'],
    enabled: true
  });

  // Fetch conversion projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/database-conversion/projects'],
    enabled: true
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: ConnectionFormValues) => {
      const res = await apiRequest('POST', '/api/database-conversion/test-connection', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Test',
        description: data.status === 'success' ? 'Connection successful!' : `Connection failed: ${data.message}`,
        variant: data.status === 'success' ? 'default' : 'destructive'
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection Test Failed',
        description: error.message || 'An error occurred while testing the connection',
        variant: 'destructive'
      });
    }
  });

  // Analyze schema mutation
  const analyzeSchemasMutation = useMutation({
    mutationFn: async (data: ConnectionFormValues) => {
      const res = await apiRequest('POST', '/api/database-conversion/analyze-schema', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Schema Analysis',
        description: `Successfully analyzed schema with ${data.tables.length} tables`,
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Schema Analysis Failed',
        description: error.message || 'An error occurred while analyzing the schema',
        variant: 'destructive'
      });
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ConversionProjectFormValues) => {
      const projectId = crypto.randomUUID();
      const res = await apiRequest('POST', '/api/database-conversion/projects', {
        projectId,
        name: data.projectName,
        description: data.description,
        sourceConnectionString: data.sourceConnectionString,
        sourceType: data.sourceType,
        targetConnectionString: data.targetConnectionString,
        targetType: data.targetType,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Project Created',
        description: `Successfully created project: ${data.name}`,
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database-conversion/projects'] });
      projectForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Project Creation Failed',
        description: error.message || 'An error occurred while creating the project',
        variant: 'destructive'
      });
    }
  });

  // Start conversion mutation
  const startConversionMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiRequest('POST', '/api/database-conversion/start', { projectId });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Conversion Started',
        description: `Conversion process started for project: ${data.projectId}`,
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/database-conversion/status', selectedProject] });
    },
    onError: (error) => {
      toast({
        title: 'Start Conversion Failed',
        description: error.message || 'An error occurred while starting the conversion',
        variant: 'destructive'
      });
    }
  });

  // Get conversion status for selected project
  const { data: conversionStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['/api/database-conversion/status', selectedProject],
    enabled: !!selectedProject,
    refetchInterval: (data) => {
      // Refetch more frequently when conversion is in progress
      if (data?.status === 'in_progress') return 2000;
      return false;
    }
  });

  // Generate compatibility layer mutation
  const generateCompatibilityLayerMutation = useMutation({
    mutationFn: async ({ projectId, options }: { projectId: string, options: any }) => {
      const res = await apiRequest('POST', '/api/database-conversion/generate-compatibility', {
        projectId,
        options
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Compatibility Layer Generated',
        description: `Successfully generated compatibility layer for project`,
        variant: 'default'
      });
    },
    onError: (error) => {
      toast({
        title: 'Compatibility Layer Generation Failed',
        description: error.message || 'An error occurred while generating the compatibility layer',
        variant: 'destructive'
      });
    }
  });

  // Handle connection test form submission
  const onConnectionTestSubmit = (values: ConnectionFormValues) => {
    testConnectionMutation.mutate(values);
  };

  // Handle schema analysis form submission
  const onSchemaAnalysisSubmit = (values: ConnectionFormValues) => {
    analyzeSchemasMutation.mutate(values);
  };

  // Handle project creation form submission
  const onProjectCreateSubmit = (values: ConversionProjectFormValues) => {
    createProjectMutation.mutate(values);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Conversion System</h1>
      <p className="text-muted-foreground mb-8">
        Convert databases between different systems and generate compatibility layers
      </p>

      <Tabs defaultValue="test-connection" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test-connection">Test Connection</TabsTrigger>
          <TabsTrigger value="analyze-schema">Analyze Schema</TabsTrigger>
          <TabsTrigger value="create-project">Create Project</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Test Connection Tab */}
        <TabsContent value="test-connection">
          <Card>
            <CardHeader>
              <CardTitle>Test Database Connection</CardTitle>
              <CardDescription>
                Verify your database connection before creating conversion projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...connectionForm}>
                <form id="connection-form" onSubmit={connectionForm.handleSubmit(onConnectionTestSubmit)} className="space-y-4">
                  <FormField
                    control={connectionForm.control}
                    name="connectionString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connection String</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., postgresql://user:password@localhost:5432/database" {...field} />
                        </FormControl>
                        <FormDescription>
                          The connection string to your database (credentials are never stored)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={connectionForm.control}
                    name="databaseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a database type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDatabaseTypes ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                                <SelectItem value="sqlserver">SQL Server</SelectItem>
                                <SelectItem value="oracle">Oracle</SelectItem>
                                <SelectItem value="mongodb">MongoDB</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of database you're connecting to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="connection-form" disabled={testConnectionMutation.isPending}>
                {testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    Test Connection
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Analyze Schema Tab */}
        <TabsContent value="analyze-schema">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Database Schema</CardTitle>
              <CardDescription>
                Analyze database structure to prepare for conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...connectionForm}>
                <form id="schema-form" onSubmit={connectionForm.handleSubmit(onSchemaAnalysisSubmit)} className="space-y-4">
                  <FormField
                    control={connectionForm.control}
                    name="connectionString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connection String</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., postgresql://user:password@localhost:5432/database" {...field} />
                        </FormControl>
                        <FormDescription>
                          The connection string to your database (credentials are never stored)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={connectionForm.control}
                    name="databaseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a database type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingDatabaseTypes ? (
                              <SelectItem value="loading">Loading...</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                                <SelectItem value="sqlserver">SQL Server</SelectItem>
                                <SelectItem value="oracle">Oracle</SelectItem>
                                <SelectItem value="mongodb">MongoDB</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of database you're connecting to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>

              {analyzeSchemasMutation.data && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Schema Analysis Results</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded p-4">
                      <p className="text-muted-foreground text-sm">Tables</p>
                      <p className="text-2xl font-bold">{analyzeSchemasMutation.data.statistics.totalTables}</p>
                    </div>
                    <div className="border rounded p-4">
                      <p className="text-muted-foreground text-sm">Views</p>
                      <p className="text-2xl font-bold">{analyzeSchemasMutation.data.statistics.totalViews}</p>
                    </div>
                    <div className="border rounded p-4">
                      <p className="text-muted-foreground text-sm">Procedures/Functions</p>
                      <p className="text-2xl font-bold">
                        {analyzeSchemasMutation.data.statistics.totalProcedures + analyzeSchemasMutation.data.statistics.totalFunctions}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Tables</h4>
                    <div className="border rounded max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="py-2 px-4 text-left text-sm font-medium">Name</th>
                            <th className="py-2 px-4 text-left text-sm font-medium">Columns</th>
                            <th className="py-2 px-4 text-left text-sm font-medium">Est. Rows</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {analyzeSchemasMutation.data.tables.map((table: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/50">
                              <td className="py-2 px-4 text-sm">{table.name}</td>
                              <td className="py-2 px-4 text-sm">{table.columns.length}</td>
                              <td className="py-2 px-4 text-sm">{table.estimatedRowCount || 'Unknown'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="schema-form" disabled={analyzeSchemasMutation.isPending}>
                {analyzeSchemasMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Schema
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Create Project Tab */}
        <TabsContent value="create-project">
          <Card>
            <CardHeader>
              <CardTitle>Create Conversion Project</CardTitle>
              <CardDescription>
                Set up a new database conversion project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...projectForm}>
                <form id="project-form" onSubmit={projectForm.handleSubmit(onProjectCreateSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My DB Conversion" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={projectForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Project description..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Source Database</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="sourceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Database Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source database type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="postgresql">PostgreSQL</SelectItem>
                              <SelectItem value="mysql">MySQL</SelectItem>
                              <SelectItem value="sqlite">SQLite</SelectItem>
                              <SelectItem value="sqlserver">SQL Server</SelectItem>
                              <SelectItem value="oracle">Oracle</SelectItem>
                              <SelectItem value="mongodb">MongoDB</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={projectForm.control}
                      name="sourceConnectionString"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Connection String</FormLabel>
                          <FormControl>
                            <Input placeholder="Source database connection string" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />
                  <h3 className="text-lg font-medium mb-4">Target Database</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={projectForm.control}
                      name="targetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Database Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target database type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="postgresql">PostgreSQL</SelectItem>
                              <SelectItem value="mysql">MySQL</SelectItem>
                              <SelectItem value="sqlite">SQLite</SelectItem>
                              <SelectItem value="sqlserver">SQL Server</SelectItem>
                              <SelectItem value="oracle">Oracle</SelectItem>
                              <SelectItem value="mongodb">MongoDB</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={projectForm.control}
                      name="targetConnectionString"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Connection String</FormLabel>
                          <FormControl>
                            <Input placeholder="Target database connection string" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" form="project-form" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Projects</CardTitle>
              <CardDescription>
                Manage your database conversion projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No conversion projects found</p>
                  <p className="text-sm">Create a new project to get started</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab('create-project')}
                  >
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Projects List */}
                  <div className="border rounded-md">
                    <div className="grid grid-cols-5 bg-muted py-2 px-4 text-sm font-medium">
                      <div>Project Name</div>
                      <div>Source</div>
                      <div>Target</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    <div className="divide-y">
                      {projects.map((project: any) => (
                        <div
                          key={project.projectId}
                          className={`grid grid-cols-5 py-3 px-4 items-center ${
                            selectedProject === project.projectId ? 'bg-muted/50' : ''
                          }`}
                        >
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm">{project.sourceType}</div>
                          <div className="text-sm">{project.targetType}</div>
                          <div>
                            <StatusBadge status={project.status} />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project.projectId)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={project.status === 'in_progress' || project.status === 'completed'}
                              onClick={() => startConversionMutation.mutate(project.projectId)}
                            >
                              Start
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Project Details */}
                  {selectedProject && (
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-4">Project Details</h3>

                      {isLoadingStatus ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {/* Progress Bar */}
                          <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                              <span>Conversion Progress</span>
                              <span>{conversionStatus?.progress || 0}%</span>
                            </div>
                            <Progress value={conversionStatus?.progress || 0} className="h-2" />
                          </div>

                          {/* Status Details */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="border rounded p-3">
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="font-medium">
                                <StatusBadge status={conversionStatus?.status || 'pending'} />
                              </p>
                            </div>
                            <div className="border rounded p-3">
                              <p className="text-xs text-muted-foreground">Current Stage</p>
                              <p className="font-medium">{conversionStatus?.currentStage || 'Not started'}</p>
                            </div>
                            <div className="border rounded p-3">
                              <p className="text-xs text-muted-foreground">Time Remaining</p>
                              <p className="font-medium">
                                {conversionStatus?.estimatedTimeRemaining
                                  ? `${Math.round(conversionStatus.estimatedTimeRemaining / 60)} minutes`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Summary */}
                          {conversionStatus?.summary && (
                            <div className="border rounded-md p-4 mb-6">
                              <h4 className="font-medium mb-3">Conversion Summary</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Tables Converted</p>
                                  <p className="font-medium">
                                    {conversionStatus.summary.tablesConverted} / {conversionStatus.summary.totalTables}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Records Processed</p>
                                  <p className="font-medium">
                                    {conversionStatus.summary.recordsProcessed.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Errors</p>
                                  <p className="font-medium">
                                    {conversionStatus.summary.errors}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Warnings</p>
                                  <p className="font-medium">
                                    {conversionStatus.summary.warnings}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compatibility Layer Generation */}
                          {conversionStatus?.status === 'completed' && (
                            <div className="border rounded-md p-4">
                              <h4 className="font-medium mb-3">Generate Compatibility Layer</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                Generate code to work with your converted database
                              </p>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <Select
                                  defaultValue="drizzle"
                                  onValueChange={(value) => console.log(value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ORM type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="drizzle">Drizzle ORM</SelectItem>
                                    <SelectItem value="prisma">Prisma</SelectItem>
                                    <SelectItem value="typeorm">TypeORM</SelectItem>
                                    <SelectItem value="sequelize">Sequelize</SelectItem>
                                    <SelectItem value="mongoose">Mongoose</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Select
                                  defaultValue="typescript"
                                  onValueChange={(value) => console.log(value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="typescript">TypeScript</SelectItem>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button
                                className="w-full"
                                onClick={() =>
                                  generateCompatibilityLayerMutation.mutate({
                                    projectId: selectedProject,
                                    options: {
                                      ormType: 'drizzle',
                                      language: 'typescript',
                                      includeModels: true,
                                      includeMigrations: true,
                                      includeQueryHelpers: true,
                                      includeCRUDOperations: true
                                    }
                                  })
                                }
                                disabled={generateCompatibilityLayerMutation.isPending}
                              >
                                {generateCompatibilityLayerMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    Generate Compatibility Layer
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          {/* Error Message */}
                          {conversionStatus?.errorMessage && (
                            <div className="bg-destructive/10 border border-destructive rounded-md p-4 mt-4">
                              <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                                <div>
                                  <h4 className="font-medium text-destructive">Error</h4>
                                  <p className="text-sm">{conversionStatus.errorMessage}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}