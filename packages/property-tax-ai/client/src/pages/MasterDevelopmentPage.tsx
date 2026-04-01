import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { LoaderCircle, Shield, Database, Zap, CheckCircle, XCircle, AlertCircle, PackageOpen, Code, Brain } from 'lucide-react';
import RealTimeMonitoringDashboard from '@/components/master-development/RealTimeMonitoringDashboard';
import ApplicationManagerPanel from '@/components/master-development/ApplicationManagerPanel';
import CodeAssistantPanel from '@/components/master-development/CodeAssistantPanel.test';

// Schema for schema validation form
const schemaValidationFormSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  entity: z.string().min(2, "Entity data is required").refine(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Must be valid JSON"
  })
});

// Schema for schema update form
const schemaUpdateFormSchema = z.object({
  entityType: z.string().min(1, "Entity type is required"),
  schemaUpdate: z.string().min(2, "Schema update is required").refine(value => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Must be valid JSON"
  })
});

type SchemaValidationFormValues = z.infer<typeof schemaValidationFormSchema>;
type SchemaUpdateFormValues = z.infer<typeof schemaUpdateFormSchema>;

export default function MasterDevelopmentPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [schemaUpdateResult, setSchemaUpdateResult] = useState<any>(null);

  // Query for agent status
  const { 
    data: agentStatus, 
    isLoading: isLoadingStatus,
    error: statusError
  } = useQuery({
    queryKey: ['/api/agents/master-development-status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Query for security policies
  const {
    data: securityPolicies,
    isLoading: isLoadingPolicies,
    error: policiesError
  } = useQuery({
    queryKey: ['/api/agents/master-development/security-policies'],
    enabled: activeTab === "security"
  });

  // Form setup for schema validation
  const validationForm = useForm<SchemaValidationFormValues>({
    resolver: zodResolver(schemaValidationFormSchema),
    defaultValues: {
      entityType: "",
      entity: "{}"
    }
  });

  // Form setup for schema update
  const schemaUpdateForm = useForm<SchemaUpdateFormValues>({
    resolver: zodResolver(schemaUpdateFormSchema),
    defaultValues: {
      entityType: "",
      schemaUpdate: "{}"
    }
  });

  // Mutation for schema validation
  const validateSchemaMutation = useMutation({
    mutationFn: async (data: SchemaValidationFormValues) => {
      const response = await fetch('/api/agents/master-development/validate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entityType: data.entityType,
          entity: JSON.parse(data.entity)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to validate schema');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
    }
  });

  // Mutation for schema update
  const updateSchemaMutation = useMutation({
    mutationFn: async (data: SchemaUpdateFormValues) => {
      const response = await fetch('/api/agents/master-development/update-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entityType: data.entityType,
          schemaUpdate: JSON.parse(data.schemaUpdate)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update schema');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setSchemaUpdateResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/agents/master-development-status'] });
    }
  });

  // Handle form submissions
  const onValidationSubmit = (data: SchemaValidationFormValues) => {
    validateSchemaMutation.mutate(data);
  };

  const onSchemaUpdateSubmit = (data: SchemaUpdateFormValues) => {
    updateSchemaMutation.mutate(data);
  };

  // Format JSON for display
  const formatJSON = (json: any) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">BCBS GeoAssessment Development Hub</h1>
      <p className="text-gray-500 mb-6">
        BSBCmaster Lead - Manage architecture, authentication, and advanced development tools for Benton County
      </p>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-7 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Schema Registry</TabsTrigger>
          <TabsTrigger value="security">Security Policies</TabsTrigger>
          <TabsTrigger value="services">Active Services</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="applications">
            <PackageOpen className="h-4 w-4 mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="developer">
            <Code className="h-4 w-4 mr-2" />
            Developer
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading agent status...</span>
            </div>
          ) : statusError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load Master Development Agent status.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Status</CardTitle>
                  <CardDescription>Current operational status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={agentStatus?.status === 'operational' ? 'default' : 'destructive'}>
                        {agentStatus?.status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Updated:</span>
                      <span className="text-sm">{agentStatus?.lastUpdated ? new Date(agentStatus.lastUpdated).toLocaleString() : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Component:</span>
                      <span className="text-sm">{agentStatus?.componentName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Role:</span>
                      <span className="text-sm">{agentStatus?.role || 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents/master-development-status'] })}>
                    Refresh
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Agent Capabilities</CardTitle>
                  <CardDescription>Available agent functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <ul className="space-y-2">
                      {agentStatus?.capabilities?.map((capability: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          <span className="text-sm">{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Specialist Agents</CardTitle>
                  <CardDescription>Specialist agents managed by the Master Development Agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {agentStatus?.specialists?.map((specialist: string, index: number) => (
                      <Badge key={index} variant="outline" className="justify-center py-2 px-4">
                        {specialist}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Schema Registry Tab */}
        <TabsContent value="schema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validate Entity</CardTitle>
                <CardDescription>Validate an entity against its schema</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...validationForm}>
                  <form onSubmit={validationForm.handleSubmit(onValidationSubmit)} className="space-y-4">
                    <FormField
                      control={validationForm.control}
                      name="entityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity Type</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., property, user, assessment" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The type of entity to validate
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={validationForm.control}
                      name="entity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity Data (JSON)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='{"id": "123", "name": "Example"}' 
                              className="font-mono h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            JSON representation of the entity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={validateSchemaMutation.isPending}
                      className="w-full"
                    >
                      {validateSchemaMutation.isPending && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Validate
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Schema</CardTitle>
                <CardDescription>Update or create a schema definition</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...schemaUpdateForm}>
                  <form onSubmit={schemaUpdateForm.handleSubmit(onSchemaUpdateSubmit)} className="space-y-4">
                    <FormField
                      control={schemaUpdateForm.control}
                      name="entityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity Type</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., property, user, assessment" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The type of schema to update
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={schemaUpdateForm.control}
                      name="schemaUpdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schema Definition (JSON)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder='{"required": ["id"], "properties": {"id": {"type": "string"}}}' 
                              className="font-mono h-[200px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            JSON schema definition
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updateSchemaMutation.isPending}
                      className="w-full"
                    >
                      {updateSchemaMutation.isPending && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Schema
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Validation Results Card */}
            {validationResult && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>
                    Entity type: {validationResult.entityType} • 
                    Timestamp: {new Date(validationResult.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status:</span>
                      {validationResult.validationResult.valid ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                          <CheckCircle className="h-4 w-4 mr-1" /> Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" /> Invalid
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!validationResult.validationResult.valid && validationResult.validationResult.errors && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Validation Errors:</h4>
                      <ul className="space-y-1 text-sm text-red-600">
                        {validationResult.validationResult.errors.map((error: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Schema Update Results Card */}
            {schemaUpdateResult && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Schema Update Results</CardTitle>
                  <CardDescription>
                    Entity type: {schemaUpdateResult.entityType} • 
                    Timestamp: {new Date(schemaUpdateResult.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Status:</span>
                      {schemaUpdateResult.success ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                          <CheckCircle className="h-4 w-4 mr-1" /> Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" /> Failed
                        </Badge>
                      )}
                    </div>
                    <div>
                      <span className="font-medium mr-2">Version:</span>
                      <Badge variant="outline">{schemaUpdateResult.version}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Security Policies Tab */}
        <TabsContent value="security">
          {isLoadingPolicies ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading security policies...</span>
            </div>
          ) : policiesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load security policies.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Security Policy Overview</CardTitle>
                    <CardDescription>
                      Version: {securityPolicies?.version} • 
                      Last Updated: {securityPolicies?.lastUpdated ? new Date(securityPolicies.lastUpdated).toLocaleString() : 'Unknown'}
                    </CardDescription>
                  </div>
                  <Shield className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Authentication</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Multi-Factor Auth:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.authentication?.mfaRequired ? 'Required for some roles' : 'Optional'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>SSO Enabled:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.authentication?.ssoEnabled ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Token Expiry:</span>
                          <span>{securityPolicies?.authentication?.tokenExpiry?.access || 0} seconds</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Data Protection</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Encryption at Rest:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.dataProtection?.encryptionAtRest ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Field-Level Encryption:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.dataProtection?.fieldLevelEncryption?.length || 0} fields
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Masking:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.dataProtection?.maskingSensitiveData ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">API Security</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-2">
                        <div className="flex justify-between">
                          <span>Rate Limiting:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.apiSecurity?.rateLimiting?.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Default Limit:</span>
                          <span>{securityPolicies?.apiSecurity?.rateLimiting?.defaultLimit || 0} req/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CORS Policy:</span>
                          <Badge variant="outline" className="text-xs">
                            {securityPolicies?.apiSecurity?.corsPolicy?.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Security Policy Details</CardTitle>
                  <CardDescription>Complete security policy configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                      {formatJSON(securityPolicies)}
                    </pre>
                  </ScrollArea>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents/master-development/security-policies'] })}>
                    Refresh Policies
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Active Services Tab */}
        <TabsContent value="services">
          {isLoadingStatus ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading active services...</span>
            </div>
          ) : statusError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load active services.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Active Services</CardTitle>
                    <CardDescription>
                      Currently active system services
                    </CardDescription>
                  </div>
                  <Zap className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {agentStatus?.activeServices?.map((service: string, index: number) => (
                      <div key={index} className="flex items-center p-2 rounded-md bg-gray-100 dark:bg-gray-800">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm font-medium">{service.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle>Integration State</CardTitle>
                    <CardDescription>
                      Current integration system status
                    </CardDescription>
                  </div>
                  <Database className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Connection Status:</span>
                      <Badge 
                        variant={
                          agentStatus?.integrationState?.connectionStatus === 'connected' 
                            ? 'default' 
                            : agentStatus?.integrationState?.connectionStatus === 'initializing'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {agentStatus?.integrationState?.connectionStatus || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Last Sync:</span>
                      <span className="text-sm">
                        {agentStatus?.integrationState?.lastSyncTimestamp 
                          ? new Date(agentStatus.integrationState.lastSyncTimestamp).toLocaleString() 
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Connections:</span>
                      <Badge variant="outline">
                        {agentStatus?.integrationState?.activeConnections || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pending Requests:</span>
                      <Badge variant={agentStatus?.integrationState?.pendingRequests > 0 ? 'outline' : 'default'}>
                        {agentStatus?.integrationState?.pendingRequests || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Service Health Status</CardTitle>
                  <CardDescription>Health metrics for core services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Authentication Service Health */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="font-medium">Authentication Service</span>
                          <Badge className="ml-2" variant={agentStatus?.healthDetails?.authentication?.status === 'healthy' ? 'default' : 'destructive'}>
                            {agentStatus?.healthDetails?.authentication?.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Uptime: {agentStatus?.healthDetails?.authentication?.uptime || 0}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Latency:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.authentication?.latency || 0} ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Error Rate:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.authentication?.errorRate || 0}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Active Sessions:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.authentication?.activeSessions || 0}</span>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>

                    {/* Data Services Health */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="font-medium">Data Services</span>
                          <Badge className="ml-2" variant={agentStatus?.healthDetails?.dataServices?.status === 'healthy' ? 'default' : 'destructive'}>
                            {agentStatus?.healthDetails?.dataServices?.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Uptime: {agentStatus?.healthDetails?.dataServices?.uptime || 0}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Latency:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.dataServices?.latency || 0} ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cache Hit Rate:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.dataServices?.cacheHitRate || 0}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Active Txns:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.dataServices?.activeTxns || 0}</span>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>

                    {/* Integration Services Health */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="font-medium">Integration Services</span>
                          <Badge className="ml-2" variant={agentStatus?.healthDetails?.integrationServices?.status === 'healthy' ? 'default' : 'destructive'}>
                            {agentStatus?.healthDetails?.integrationServices?.status || 'Unknown'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Uptime: {agentStatus?.healthDetails?.integrationServices?.uptime || 0}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Latency:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.integrationServices?.latency || 0} ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Error Rate:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.integrationServices?.errorRate || 0}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Queue Size:</span>
                          <span className="ml-2 font-medium">{agentStatus?.healthDetails?.integrationServices?.messageQueue?.size || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents/master-development-status'] })}
                  >
                    Refresh Health Status
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <RealTimeMonitoringDashboard />
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applications">
          <ApplicationManagerPanel />
        </TabsContent>
        
        {/* Developer Tab */}
        <TabsContent value="developer">
          <div className="mb-4">
            <h2 className="text-xl font-bold">County-Specific Development Tools</h2>
            <p className="text-gray-500">
              Professional development environment specialized for Benton County property assessment applications
            </p>
          </div>
          <CodeAssistantPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}