import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertCircle,
  CheckCircle2,
  CloudCog, 
  Database, 
  FileJson,
  Globe,
  Layers,
  Loader2,
  Lock,
  PlusCircle,
  Power,
  RefreshCw,
  Router,
  Server,
  Settings,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface ExternalConnectorsProps {
  className?: string;
}

type ConnectorType = 'api' | 'database' | 'file' | 'service' | 'webhook';
type ConnectorStatus = 'active' | 'inactive' | 'error' | 'pending';
type AuthType = 'none' | 'basic' | 'api_key' | 'oauth2' | 'certificate';

interface Connector {
  id: string;
  name: string;
  description: string;
  type: ConnectorType;
  status: ConnectorStatus;
  config: {
    url?: string;
    method?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    path?: string;
    format?: string;
    serviceType?: string; 
    endpoint?: string;
  };
  auth: {
    type: AuthType;
    username?: string;
    keyName?: string;
    tokenUrl?: string;
    clientId?: string;
    certificateName?: string;
  };
  schedule?: {
    enabled: boolean;
    interval: number; // In minutes
    lastRun?: string;
    nextRun?: string;
  };
  createdAt: string;
  lastConnected?: string;
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number; // ms
    uptimePercentage?: number;
    errorCount: number;
    lastError?: string;
  };
  tags: string[];
}

export function ExternalConnectors({ className = '' }: ExternalConnectorsProps) {
  const [activeTab, setActiveTab] = useState('connectors');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  // Form states for new connector
  const [newConnectorName, setNewConnectorName] = useState('');
  const [newConnectorDescription, setNewConnectorDescription] = useState('');
  const [newConnectorType, setNewConnectorType] = useState<ConnectorType>('api');
  const [newConnectorConfig, setNewConnectorConfig] = useState<Record<string, any>>({});
  const [newConnectorAuth, setNewConnectorAuth] = useState<{type: AuthType; [key: string]: any}>({
    type: 'none'
  });
  const [newConnectorSchedule, setNewConnectorSchedule] = useState({
    enabled: false,
    interval: 60 // Default to hourly
  });
  const [newConnectorTags, setNewConnectorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const { toast } = useToast();

  // Initialize with demo data
  useEffect(() => {
    // Simulate loading connectors from API
    const demoConnectors: Connector[] = [
      {
        id: 'conn-001',
        name: 'City Planning API',
        description: 'External API for city planning department data',
        type: 'api',
        status: 'active',
        config: {
          url: 'https://api.cityplanning.gov/v2/permits',
          method: 'GET'
        },
        auth: {
          type: 'api_key',
          keyName: 'X-API-Key'
        },
        schedule: {
          enabled: true,
          interval: 120,
          lastRun: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          nextRun: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastConnected: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        health: {
          status: 'healthy',
          latency: 187,
          uptimePercentage: 99.8,
          errorCount: 2
        },
        tags: ['external', 'permits', 'planning']
      },
      {
        id: 'conn-002',
        name: 'County Assessor Database',
        description: 'Direct database connection to county assessor records',
        type: 'database',
        status: 'active',
        config: {
          host: 'assessor-db.county.gov',
          port: 5432,
          database: 'property_records'
        },
        auth: {
          type: 'basic',
          username: 'readonly_user'
        },
        schedule: {
          enabled: true,
          interval: 1440, // Daily
          lastRun: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
          nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        lastConnected: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 hours ago
        health: {
          status: 'healthy',
          latency: 35,
          uptimePercentage: 99.95,
          errorCount: 0
        },
        tags: ['database', 'property', 'assessor']
      },
      {
        id: 'conn-003',
        name: 'Building Code Updates Feed',
        description: 'Webhook receiver for building code updates',
        type: 'webhook',
        status: 'inactive',
        config: {
          endpoint: '/api/webhooks/building-codes'
        },
        auth: {
          type: 'basic',
          username: 'webhook_receiver'
        },
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        health: {
          status: 'degraded',
          errorCount: 5,
          lastError: 'Webhook endpoint not responding with valid data format'
        },
        tags: ['webhook', 'building-codes', 'updates']
      },
      {
        id: 'conn-004',
        name: 'GIS Data Import',
        description: 'File import for GIS mapping data',
        type: 'file',
        status: 'error',
        config: {
          path: '/data/imports/gis',
          format: 'shapefile'
        },
        auth: {
          type: 'none'
        },
        schedule: {
          enabled: true,
          interval: 10080, // Weekly
          lastRun: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
          nextRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago (overdue)
        },
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
        lastConnected: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        health: {
          status: 'unhealthy',
          errorCount: 3,
          lastError: 'File path not accessible or insufficient permissions'
        },
        tags: ['file', 'gis', 'import', 'shapefile']
      }
    ];

    setConnectors(demoConnectors);
    setLoading(false);
  }, []);

  const handleCreateConnector = () => {
    setIsCreating(true);
    resetFormStates();
  };

  const resetFormStates = () => {
    setNewConnectorName('');
    setNewConnectorDescription('');
    setNewConnectorType('api');
    setNewConnectorConfig({});
    setNewConnectorAuth({ type: 'none' });
    setNewConnectorSchedule({
      enabled: false,
      interval: 60
    });
    setNewConnectorTags([]);
    setTagInput('');
    setTestResult(null);
  };

  const handleConfigureConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setIsConfiguring(true);
    setTestResult(null);
    
    // Pre-populate form with connector data
    setNewConnectorName(connector.name);
    setNewConnectorDescription(connector.description);
    setNewConnectorType(connector.type);
    setNewConnectorConfig(connector.config || {});
    setNewConnectorAuth(connector.auth || { type: 'none' });
    setNewConnectorSchedule(connector.schedule || { enabled: false, interval: 60 });
    setNewConnectorTags(connector.tags || []);
  };
  
  const handleTestConnection = () => {
    setIsTesting(true);
    
    // Simulate testing connection
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% chance of success
      
      setTestResult({
        success, 
        message: success 
          ? 'Connection established successfully. All required resources are accessible.'
          : 'Failed to establish connection. Please check credentials and network connectivity.'
      });
      
      setIsTesting(false);
    }, 2000);
  };

  const handleSaveConnector = () => {
    if (!newConnectorName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Connector name is required',
        variant: 'destructive',
      });
      return;
    }
    
    const newConnector: Connector = {
      id: `conn-${Math.random().toString(36).substring(2, 8)}`,
      name: newConnectorName,
      description: newConnectorDescription,
      type: newConnectorType,
      status: 'pending',
      config: newConnectorConfig,
      auth: newConnectorAuth,
      schedule: newConnectorSchedule.enabled ? newConnectorSchedule : undefined,
      createdAt: new Date().toISOString(),
      health: {
        status: 'healthy',
        errorCount: 0
      },
      tags: newConnectorTags
    };
    
    setConnectors(prev => [...prev, newConnector]);
    setIsCreating(false);
    
    toast({
      title: 'Connector Created',
      description: `"${newConnectorName}" has been created successfully.`,
    });
  };

  const handleUpdateConnector = () => {
    if (!selectedConnector) return;
    
    const updatedConnector: Connector = {
      ...selectedConnector,
      name: newConnectorName,
      description: newConnectorDescription,
      type: newConnectorType,
      config: newConnectorConfig,
      auth: newConnectorAuth,
      schedule: newConnectorSchedule.enabled ? newConnectorSchedule : undefined,
      tags: newConnectorTags
    };
    
    setConnectors(prev => prev.map(conn => 
      conn.id === selectedConnector.id ? updatedConnector : conn
    ));
    
    setIsConfiguring(false);
    
    toast({
      title: 'Connector Updated',
      description: `"${newConnectorName}" has been updated successfully.`,
    });
  };

  const handleDeleteConnector = (connectorId: string) => {
    setConnectors(prev => prev.filter(conn => conn.id !== connectorId));
    
    toast({
      title: 'Connector Deleted',
      description: 'The connector has been deleted successfully.',
    });
  };
  
  const handleToggleConnector = (connector: Connector) => {
    const newStatus = connector.status === 'active' ? 'inactive' : 'active';
    
    setConnectors(prev => prev.map(conn => 
      conn.id === connector.id 
        ? { 
            ...conn, 
            status: newStatus,
            lastConnected: newStatus === 'active' ? new Date().toISOString() : conn.lastConnected
          }
        : conn
    ));
    
    toast({
      title: newStatus === 'active' ? 'Connector Activated' : 'Connector Deactivated',
      description: `"${connector.name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
    });
  };
  
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!newConnectorTags.includes(newTag)) {
      setNewConnectorTags(prev => [...prev, newTag]);
    }
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tag: string) => {
    setNewConnectorTags(prev => prev.filter(t => t !== tag));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: ConnectorStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getHealthIndicator = (health: Connector['health']) => {
    switch (health.status) {
      case 'healthy':
        return <Badge className="bg-green-500 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge variant="warning" className="bg-yellow-500 flex items-center"><AlertCircle className="h-3 w-3 mr-1" />Degraded</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive" className="flex items-center"><AlertCircle className="h-3 w-3 mr-1" />Unhealthy</Badge>;
      default:
        return <Badge variant="outline">{health.status}</Badge>;
    }
  };
  
  const getConnectorIcon = (type: ConnectorType, className = "h-5 w-5") => {
    switch (type) {
      case 'api':
        return <Globe className={className} />;
      case 'database':
        return <Database className={className} />;
      case 'file':
        return <FileJson className={className} />;
      case 'service':
        return <CloudCog className={className} />;
      case 'webhook':
        return <Router className={className} />;
      default:
        return <Server className={className} />;
    }
  };
  
  const getAuthTypeLabel = (type: AuthType) => {
    switch (type) {
      case 'none': return 'No Authentication';
      case 'basic': return 'Basic Auth';
      case 'api_key': return 'API Key';
      case 'oauth2': return 'OAuth 2.0';
      case 'certificate': return 'Certificate';
      default: return type;
    }
  };
  
  const renderConnectorConfigForm = () => {
    switch (newConnectorType) {
      case 'api':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="config-url">API URL</Label>
              <Input
                id="config-url"
                placeholder="https://api.example.com/v1/endpoint"
                value={newConnectorConfig.url || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-method">Method</Label>
              <Select
                value={newConnectorConfig.method || 'GET'}
                onValueChange={(value) => setNewConnectorConfig(prev => ({ ...prev, method: value }))}
              >
                <SelectTrigger id="config-method">
                  <SelectValue placeholder="Select HTTP method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      
      case 'database':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="config-host">Host</Label>
              <Input
                id="config-host"
                placeholder="db.example.com"
                value={newConnectorConfig.host || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-port">Port</Label>
              <Input
                id="config-port"
                type="number"
                placeholder="5432"
                value={newConnectorConfig.port || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, port: parseInt(e.target.value) || '' }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-database">Database Name</Label>
              <Input
                id="config-database"
                placeholder="mydatabase"
                value={newConnectorConfig.database || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, database: e.target.value }))}
              />
            </div>
          </>
        );
      
      case 'file':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="config-path">File Path</Label>
              <Input
                id="config-path"
                placeholder="/data/imports"
                value={newConnectorConfig.path || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, path: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-format">File Format</Label>
              <Select
                value={newConnectorConfig.format || ''}
                onValueChange={(value) => setNewConnectorConfig(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger id="config-format">
                  <SelectValue placeholder="Select file format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="shapefile">Shapefile (GIS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      
      case 'service':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="config-service-type">Service Type</Label>
              <Select
                value={newConnectorConfig.serviceType || ''}
                onValueChange={(value) => setNewConnectorConfig(prev => ({ ...prev, serviceType: value }))}
              >
                <SelectTrigger id="config-service-type">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws-s3">AWS S3</SelectItem>
                  <SelectItem value="azure-blob">Azure Blob Storage</SelectItem>
                  <SelectItem value="gcp-storage">Google Cloud Storage</SelectItem>
                  <SelectItem value="sftp">SFTP Server</SelectItem>
                  <SelectItem value="elasticsearch">Elasticsearch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config-service-url">Service URL/Endpoint</Label>
              <Input
                id="config-service-url"
                placeholder="https://service-endpoint.example.com"
                value={newConnectorConfig.url || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
          </>
        );
      
      case 'webhook':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="config-endpoint">Webhook Endpoint</Label>
              <Input
                id="config-endpoint"
                placeholder="/api/webhooks/my-webhook"
                value={newConnectorConfig.endpoint || ''}
                onChange={(e) => setNewConnectorConfig(prev => ({ ...prev, endpoint: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                The endpoint where webhook requests will be received
              </p>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  const renderAuthForm = () => {
    switch (newConnectorAuth.type) {
      case 'basic':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="auth-username">Username</Label>
              <Input
                id="auth-username"
                placeholder="Username"
                value={newConnectorAuth.username || ''}
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, password: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Password is securely stored</p>
            </div>
          </>
        );
      
      case 'api_key':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="auth-key-name">API Key Name/Header</Label>
              <Input
                id="auth-key-name"
                placeholder="X-API-Key"
                value={newConnectorAuth.keyName || ''}
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, keyName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-key-value">API Key Value</Label>
              <Input
                id="auth-key-value"
                type="password"
                placeholder="Enter API key"
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, keyValue: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">API key is securely stored</p>
            </div>
          </>
        );
      
      case 'oauth2':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="auth-token-url">Token URL</Label>
              <Input
                id="auth-token-url"
                placeholder="https://auth.example.com/oauth/token"
                value={newConnectorAuth.tokenUrl || ''}
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, tokenUrl: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-client-id">Client ID</Label>
              <Input
                id="auth-client-id"
                placeholder="client_id"
                value={newConnectorAuth.clientId || ''}
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, clientId: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-client-secret">Client Secret</Label>
              <Input
                id="auth-client-secret"
                type="password"
                placeholder="Enter client secret"
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, clientSecret: e.target.value }))}
              />
            </div>
          </>
        );
      
      case 'certificate':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="auth-cert-name">Certificate Name</Label>
              <Input
                id="auth-cert-name"
                placeholder="my-certificate"
                value={newConnectorAuth.certificateName || ''}
                onChange={(e) => setNewConnectorAuth(prev => ({ ...prev, certificateName: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 mt-2">
              <Button variant="outline" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Certificate
              </Button>
            </div>
          </>
        );
      
      case 'none':
      default:
        return (
          <div className="text-sm text-muted-foreground py-2">
            No authentication required for this connector.
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>External Connectors</CardTitle>
          <CardDescription>Connect to external data sources and services</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading connectors...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>External Connectors</CardTitle>
          <CardDescription>Connect to external data sources and services</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>External Connectors</CardTitle>
            <CardDescription>Connect to external data sources and services</CardDescription>
          </div>
          {!isCreating && !isConfiguring && (
            <Button onClick={handleCreateConnector}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Connector
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create New Connector</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="connector-name">Connector Name</Label>
                <Input
                  id="connector-name"
                  placeholder="Enter a descriptive name"
                  value={newConnectorName}
                  onChange={(e) => setNewConnectorName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="connector-description">Description</Label>
                <Textarea
                  id="connector-description"
                  placeholder="Describe the purpose of this connector"
                  value={newConnectorDescription}
                  onChange={(e) => setNewConnectorDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="connector-type">Connector Type</Label>
                <Select
                  value={newConnectorType}
                  onValueChange={(value: ConnectorType) => {
                    setNewConnectorType(value);
                    setNewConnectorConfig({});
                  }}
                >
                  <SelectTrigger id="connector-type">
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">External API</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="file">File System</SelectItem>
                    <SelectItem value="service">Cloud Service</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Connection Configuration</h4>
              <div className="space-y-4">
                {renderConnectorConfigForm()}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Authentication</h4>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="auth-type">Authentication Type</Label>
                  <Select
                    value={newConnectorAuth.type}
                    onValueChange={(value: AuthType) => {
                      setNewConnectorAuth({ type: value });
                    }}
                  >
                    <SelectTrigger id="auth-type">
                      <SelectValue placeholder="Select authentication type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Authentication</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {renderAuthForm()}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Scheduling</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="schedule-enabled"
                    checked={newConnectorSchedule.enabled}
                    onCheckedChange={(checked) => 
                      setNewConnectorSchedule(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="schedule-enabled">Enable scheduled synchronization</Label>
                </div>
                
                {newConnectorSchedule.enabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="schedule-interval">Sync Interval (minutes)</Label>
                    <Select
                      value={String(newConnectorSchedule.interval)}
                      onValueChange={(value) => 
                        setNewConnectorSchedule(prev => ({ ...prev, interval: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="schedule-interval">
                        <SelectValue placeholder="Select sync interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Hourly</SelectItem>
                        <SelectItem value="360">Every 6 hours</SelectItem>
                        <SelectItem value="720">Every 12 hours</SelectItem>
                        <SelectItem value="1440">Daily</SelectItem>
                        <SelectItem value="10080">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Tags</h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" onClick={handleAddTag} variant="secondary">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {newConnectorTags.map(tag => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)} 
                        className="h-3.5 w-3.5 rounded-full hover:bg-muted"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {newConnectorTags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags added</span>
                  )}
                </div>
              </div>
            </div>
            
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
                {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{testResult.success ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                <Button onClick={handleSaveConnector}>Create Connector</Button>
              </div>
            </div>
          </div>
        )}

        {isConfiguring && selectedConnector && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Configure Connector</h3>
              <Badge className="ml-2">{getStatusBadge(selectedConnector.status)}</Badge>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Connector Name</Label>
                <Input
                  id="edit-name"
                  value={newConnectorName}
                  onChange={(e) => setNewConnectorName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newConnectorDescription}
                  onChange={(e) => setNewConnectorDescription(e.target.value)}
                />
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Connection Configuration</h4>
              <div className="space-y-4">
                {renderConnectorConfigForm()}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Authentication</h4>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-auth-type">Authentication Type</Label>
                  <Select
                    value={newConnectorAuth.type}
                    onValueChange={(value: AuthType) => {
                      setNewConnectorAuth({ type: value });
                    }}
                  >
                    <SelectTrigger id="edit-auth-type">
                      <SelectValue placeholder="Select authentication type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Authentication</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {renderAuthForm()}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Scheduling</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-schedule-enabled"
                    checked={newConnectorSchedule.enabled}
                    onCheckedChange={(checked) => 
                      setNewConnectorSchedule(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="edit-schedule-enabled">Enable scheduled synchronization</Label>
                </div>
                
                {newConnectorSchedule.enabled && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-schedule-interval">Sync Interval (minutes)</Label>
                    <Select
                      value={String(newConnectorSchedule.interval)}
                      onValueChange={(value) => 
                        setNewConnectorSchedule(prev => ({ ...prev, interval: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id="edit-schedule-interval">
                        <SelectValue placeholder="Select sync interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Hourly</SelectItem>
                        <SelectItem value="360">Every 6 hours</SelectItem>
                        <SelectItem value="720">Every 12 hours</SelectItem>
                        <SelectItem value="1440">Daily</SelectItem>
                        <SelectItem value="10080">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {selectedConnector.schedule?.lastRun && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last run:</span> {formatDate(selectedConnector.schedule.lastRun)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Next run:</span> {formatDate(selectedConnector.schedule.nextRun)}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-medium">Tags</h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button type="button" onClick={handleAddTag} variant="secondary">
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {newConnectorTags.map(tag => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)} 
                        className="h-3.5 w-3.5 rounded-full hover:bg-muted"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {newConnectorTags.length === 0 && (
                    <span className="text-sm text-muted-foreground">No tags added</span>
                  )}
                </div>
              </div>
            </div>
            
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
                {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{testResult.success ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsConfiguring(false)}
              >
                Cancel
              </Button>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                <Button onClick={handleUpdateConnector}>Update Connector</Button>
              </div>
            </div>
          </div>
        )}

        {!isCreating && !isConfiguring && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="connectors">All Connectors</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
            </TabsList>
            
            <TabsContent value="connectors" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auth</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No connectors configured. Click "New Connector" to add one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      connectors.map((connector) => (
                        <TableRow key={connector.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="mr-2">
                                {getConnectorIcon(connector.type)}
                              </div>
                              <div>
                                {connector.name}
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {connector.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="capitalize">{connector.type}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(connector.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {connector.auth.type !== 'none' && (
                                <Lock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              )}
                              <span>{getAuthTypeLabel(connector.auth.type)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {connector.schedule?.enabled ? (
                              <div className="text-sm">
                                <div className="flex items-center">
                                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                  {connector.schedule.interval >= 1440 ? (
                                    `Every ${connector.schedule.interval / 1440} day${connector.schedule.interval / 1440 > 1 ? 's' : ''}`
                                  ) : connector.schedule.interval >= 60 ? (
                                    `Every ${connector.schedule.interval / 60} hour${connector.schedule.interval / 60 > 1 ? 's' : ''}`
                                  ) : (
                                    `Every ${connector.schedule.interval} min`
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Manual</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleConnector(connector)}
                                disabled={connector.status === 'error'}
                                title={connector.status === 'active' ? 'Deactivate' : 'Activate'}
                              >
                                <Power className={`h-4 w-4 ${connector.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConfigureConnector(connector)}
                                title="Configure"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteConnector(connector.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Last Connected</TableHead>
                      <TableHead>Next Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectors.filter(c => c.status === 'active').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No active connectors. Activate a connector to see it here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      connectors
                        .filter(c => c.status === 'active')
                        .map((connector) => (
                          <TableRow key={connector.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="mr-2">
                                  {getConnectorIcon(connector.type)}
                                </div>
                                <div>
                                  {connector.name}
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {connector.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="capitalize">{connector.type}</div>
                            </TableCell>
                            <TableCell>{getHealthIndicator(connector.health)}</TableCell>
                            <TableCell>{formatDate(connector.lastConnected)}</TableCell>
                            <TableCell>
                              {connector.schedule?.enabled ? (
                                formatDate(connector.schedule.nextRun)
                              ) : (
                                <span className="text-muted-foreground">Manual</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleConnector(connector)}
                                  title="Deactivate"
                                >
                                  <Power className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleConfigureConnector(connector)}
                                  title="Configure"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="health" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {connectors.map((connector) => (
                  <Card key={connector.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {getConnectorIcon(connector.type, "h-5 w-5 mr-2")}
                            <span>{connector.name}</span>
                          </div>
                          {getStatusBadge(connector.status)}
                        </div>
                      </CardTitle>
                      <CardDescription>{connector.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold">
                              {connector.health.status === 'healthy' ? (
                                <span className="text-green-500">✓</span>
                              ) : connector.health.status === 'degraded' ? (
                                <span className="text-yellow-500">⚠</span>
                              ) : (
                                <span className="text-red-500">✗</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">Status</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold">{connector.health.errorCount}</div>
                            <div className="text-xs text-muted-foreground">Errors</div>
                          </div>
                        </div>
                        
                        {connector.health.latency !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Latency</span>
                              <span className="font-medium">{connector.health.latency} ms</span>
                            </div>
                            <Progress 
                              value={Math.min(100, (connector.health.latency / 1000) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        {connector.health.uptimePercentage !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Uptime</span>
                              <span className="font-medium">{connector.health.uptimePercentage.toFixed(1)}%</span>
                            </div>
                            <Progress 
                              value={connector.health.uptimePercentage} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        {connector.health.lastError && (
                          <div className="text-xs text-red-500 mt-2">
                            <div className="font-semibold">Last Error:</div>
                            <div>{connector.health.lastError}</div>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Last connected: {formatDate(connector.lastConnected) || 'Never'}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 py-2">
                      <div className="flex w-full justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => handleToggleConnector(connector)}
                        >
                          <Power className={`h-4 w-4 mr-1 ${connector.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                          {connector.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => handleConfigureConnector(connector)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          <span>All external connections are monitored for health and security</span>
        </div>
      </CardFooter>
    </Card>
  );
}