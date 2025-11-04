import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '../lib/queryClient';
import { Loader2,
  CheckCircle2,
  AlertCircle,
  BellRing,
  Laptop,
  Database,
  ArrowRightCircle,
  Share2,
  Code2,
  GitBranch,
  History,
  LineChart,
  Terminal,
  Check,
  X,
  ChevronRight,
  Copy,
  Sparkles,
  Eye,
  EyeOff,
 } from '@mui/icons-material';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Enum Types
enum DatabaseType {
  PostgreSQL = 'postgresql',
  MySQL = 'mysql',
  SQLite = 'sqlite',
  SQLServer = 'sqlserver',
  MongoDB = 'mongodb',
  Oracle = 'oracle',
  DynamoDB = 'dynamodb',
  Cassandra = 'cassandra',
  Redis = 'redis',
  ElasticSearch = 'elasticsearch',
  Neo4j = 'neo4j',
  Firestore = 'firestore',
  CosmosDB = 'cosmosdb',
}

enum ORMType {
  Drizzle = 'drizzle',
  Prisma = 'prisma',
  TypeORM = 'typeorm',
  Sequelize = 'sequelize',
  Mongoose = 'mongoose',
}

enum ConnectionStatus {
  Success = 'success',
  Failed = 'failed',
  Pending = 'pending',
}

enum ConversionStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Paused = 'paused',
}

// Interface Types
interface DatabaseInfo {
  id: string;
  name: string;
  description: string;
  supportLevel: 'Full' | 'Partial' | 'Basic';
}

interface ConnectionTestResult {
  status: 'success' | 'failed';
  databaseName?: string;
  databaseVersion?: string;
  error?: string;
  timestamp: string;
}

interface ConversionStatusInfo {
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    tablesConverted: number;
    totalTables: number;
    recordsProcessed: number;
    estimatedTotalRecords: number;
    overallProgress: number;
  };
  statusMessage: string;
  error?: string;
  startTime: string;
  endTime?: string;
}

interface TableSchema {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
  }>;
  statistics?: {
    totalColumns: number;
    nullableColumns: number;
    primaryKeyColumns: number;
    foreignKeyCount: number;
    indexCount: number;
  };
}

interface SchemaAnalysisResult {
  id?: string;
  databaseType: DatabaseType;
  tables: TableSchema[];
  views: any[];
  schemaIssues?: {
    tablesWithoutPrimaryKey: any[];
    columnsWithoutType: any[];
    inconsistentNaming: any[];
    redundantIndexes: any[];
    missingIndexes: any[];
    circularDependencies: any[];
  };
  performanceIssues?: {
    tablesWithoutIndexes: any[];
    wideIndexes: any[];
    largeTextColumnsWithoutIndexes: any[];
    inefficientDataTypes: any[];
    highCardinalityTextColumns: any[];
  };
  analysisTimestamp: string;
}

interface CompatibilityLayerResult {
  id: string;
  projectId: string;
  generatedFiles: Array<{
    path: string;
    content: string;
    type: string;
  }>;
  statusMessage: string;
  timestamp: string;
}

interface ConversionProject {
  id: string;
  name: string;
  description?: string;
  sourceType: DatabaseType;
  targetType: DatabaseType;
  status: string;
  progress?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

// Zod Form Schemas
const connectionFormSchema = z.object({
  databaseType: z.nativeEnum(DatabaseType, {
    required_error: 'Please select a database type',
  }),
  connectionString: z.string().min(1, {
    message: 'Connection string is required',
  }),
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters',
  }),
  description: z.string().optional(),
  includeViews: z.boolean().default(true),
  includeProcedures: z.boolean().default(false),
  includeFunctions: z.boolean().default(false),
  includeTriggers: z.boolean().default(false),
});

const conversionFormSchema = z.object({
  projectId: z.string().min(1, {
    message: 'Project ID is required',
  }),
  sourceType: z.nativeEnum(DatabaseType, {
    required_error: 'Please select a source database type',
  }),
  sourceConnectionString: z.string().min(1, {
    message: 'Source connection string is required',
  }),
  targetType: z.nativeEnum(DatabaseType, {
    required_error: 'Please select a target database type',
  }),
  targetConnectionString: z.string().min(1, {
    message: 'Target connection string is required',
  }),
  generateCompatibilityLayer: z.boolean().default(true),
  ormType: z.nativeEnum(ORMType).optional(),
  includeExamples: z.boolean().default(true),
  generateMigrations: z.boolean().default(true),
});

const compatibilityFormSchema = z.object({
  projectId: z.string().min(1, {
    message: 'Project ID is required',
  }),
  ormType: z.nativeEnum(ORMType, {
    required_error: 'Please select an ORM type',
  }),
  includeExamples: z.boolean().default(true),
  generateMigrations: z.boolean().default(true),
  targetDirectory: z.string().default('./compatibility'),
});

// Component to display database type icon
const DatabaseTypeIcon = ({ type }: { type: DatabaseType }) => {
  switch (type) {
    case DatabaseType.PostgreSQL:
      return (
        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 p-1 rounded">
          <Database className="h-4 w-4" />
        </span>
      );
    case DatabaseType.MySQL:
      return (
        <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 p-1 rounded">
          <Database className="h-4 w-4" />
        </span>
      );
    case DatabaseType.SQLite:
      return (
        <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-1 rounded">
          <Database className="h-4 w-4" />
        </span>
      );
    case DatabaseType.MongoDB:
      return (
        <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 p-1 rounded">
          <Database className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 p-1 rounded">
          <Database className="h-4 w-4" />
        </span>
      );
  }
};

// Database Card Component
const DatabaseCard = ({
  database,
  selected,
  onClick,
}: {
  database: DatabaseInfo;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary ${selected ? 'border-2 border-primary' : 'border'}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DatabaseTypeIcon type={database.id as DatabaseType} />
            <div><>

              <h4 className="font-medium">{database.name}</h4>
              <p
</> className="text-xs text-muted-foreground">{database.description}</p>
            </div>
          </div>
          <Badge
            variant={
              database.supportLevel === 'Full'
                ? 'default'
                : database.supportLevel === 'Partial'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {database.supportLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
// Helper function to mask connection strings for display
const maskConnectionString = (connectionString: string): string => {
  try {
    // For typical database connection strings with username and password
    if (connectionString.includes('@') && connectionString.includes(':')) {
      const parts = connectionString.split('@');
      const credentialsPart = parts[0];
      const hostPart = parts[1];

      // Find username and password
      const userPassRegex = /^(.*?):(.*)$/;
      const matches = credentialsPart.match(userPassRegex);

      if (matches && matches.length >= 3) {
        const protocol = matches[1].split('://')[0];
        const username = matches[1].split('://')[1] || matches[1];
        const password = matches[2];

        // Mask the password
        const maskedPassword = '*'.repeat(Math.min(password.length, 8));

        return `${protocol}://${username}:${maskedPassword}@${hostPart}`;
      }
    }

    // For MongoDB or other special formats
    if (connectionString.includes('mongodb+srv://')) {
      return connectionString.replace(/(mongodb\+srv:\/\/[^:]+:)([^@]+)(@.*)/, '$1********$3');
    }

    // For other formats or if parsing fails, mask the middle part
    const len = connectionString.length;
    if (len > 12) {
      return `${connectionString.substring(0, 6)}...${connectionString.substring(len - 6)}`;
    }

    return '********'; // Fallback
  } catch (e) {
    console.error('Error masking connection string:', e);
    return '********';
  }
};

const DatabaseConversionPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('connect');
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(null);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(
    null
  );
  const [schemaAnalysisResult, setSchemaAnalysisResult] = useState<SchemaAnalysisResult | null>(
    null
  );
  const [conversionStatus, setConversionStatus] = useState<ConversionStatusInfo | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [statusPolling, setStatusPolling] = useState<NodeJS.Timeout | null>(null);
  const [databaseTypes, setDatabaseTypes] = useState<DatabaseInfo[]>([]);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityLayerResult | null>(
    null
  );
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showConnectionStrings, setShowConnectionStrings] = useState(false);

  // Forms
  const connectionForm = useForm<z.infer<typeof connectionFormSchema>>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      databaseType: DatabaseType.PostgreSQL,
      connectionString: '',
      name: '',
      description: '',
      includeViews: true,
      includeProcedures: false,
      includeFunctions: false,
      includeTriggers: false,
    },
  });

  const conversionForm = useForm<z.infer<typeof conversionFormSchema>>({
    resolver: zodResolver(conversionFormSchema),
    defaultValues: {
      projectId: '',
      sourceType: DatabaseType.PostgreSQL,
      sourceConnectionString: '',
      targetType: DatabaseType.PostgreSQL,
      targetConnectionString: '',
      generateCompatibilityLayer: true,
      ormType: ORMType.Drizzle,
      includeExamples: true,
      generateMigrations: true,
    },
  });

  const compatibilityForm = useForm<z.infer<typeof compatibilityFormSchema>>({
    resolver: zodResolver(compatibilityFormSchema),
    defaultValues: {
      projectId: '',
      ormType: ORMType.Drizzle,
      includeExamples: true,
      generateMigrations: true,
      targetDirectory: './compatibility',
    },
  });

  // Queries
  const { data: supportedDatabases, isLoading: isLoadingDatabases } = useQuery({
    queryKey: ['/api/database-conversion/supported-databases'],
    queryFn: async () => {
      const response = await fetch('/api/database-conversion/supported-databases');
      if (!response.ok) {
        throw new Error('Failed to fetch supported databases');
      }
      return response.json();
    },
  });

  const { data: conversionProjects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/database-conversion/projects'],
    queryFn: async () => {
      const response = await fetch('/api/database-conversion/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch conversion projects');
      }
      return response.json();
    },
  });

  // Mutations
  const testConnectionMutation = useMutation({
    mutationFn: async (data: { connectionString: string; databaseType: DatabaseType }) => {
      const response = await fetch('/api/database-conversion/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to test connection');
      }

      return response.json();
    },
    onSuccess: data => {
      setConnectionTestResult(data.result);

      if (data.success) {
        toast({
          title: 'Connection successful',
          description: `Connected to ${data.result.databaseName || 'database'} (${data.result.databaseVersion || 'unknown version'})`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection failed',
          description: data.result.error || 'Could not connect to database',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const analyzeSchemasMutation = useMutation({
    mutationFn: async (data: z.infer<typeof connectionFormSchema>) => {
      const response = await fetch('/api/database-conversion/analyze-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze schema');
      }

      return response.json();
    },
    onSuccess: data => {
      if (data.success) {
        setSchemaAnalysisResult(data.result);
        setProjectId(data.result.id || '');
        compatibilityForm.setValue('projectId', data.result.id || '');
        conversionForm.setValue('projectId', data.result.id || '');
        conversionForm.setValue('sourceType', connectionForm.getValues('databaseType'));
        conversionForm.setValue(
          'sourceConnectionString',
          connectionForm.getValues('connectionString')
        );

        toast({
          title: 'Schema analysis complete',
          description: `Analyzed ${data.result?.tables?.length || 0} tables and ${data.result?.views?.length || 0} views`,
          variant: 'default',
        });

        // Auto-navigate to the next tab
        setActiveTab('convert');
      } else {
        toast({
          title: 'Schema analysis failed',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Schema analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startConversionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof conversionFormSchema>) => {
      const response = await fetch('/api/database-conversion/start-conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversion');
      }

      return response.json();
    },
    onSuccess: data => {
      if (data.success) {
        toast({
          title: 'Conversion started',
          description: 'Database conversion process has been initiated',
          variant: 'default',
        });

        // Set up polling for conversion status updates
        const interval = setInterval(async () => {
          try {
            const response = await fetch(
              `/api/database-conversion/conversion-status?projectId=${data.projectId}`
            );
            if (response.ok) {
              const statusData = await response.json();

              if (statusData.success) {
                setConversionStatus(statusData.result);

                // Check if conversion is complete
                if (
                  statusData.result.status === 'completed' ||
                  statusData.result.status === 'failed'
                ) {
                  if (statusPolling) {
                    clearInterval(statusPolling);
                    setStatusPolling(null);
                  }

                  if (statusData.result.status === 'completed') {
                    toast({
                      title: 'Conversion complete',
                      description: 'Database conversion has been completed successfully',
                      variant: 'default',
                    });

                    // If compatibility layer generation was enabled, auto-navigate
                    if (conversionForm.getValues('generateCompatibilityLayer')) {
                      setActiveTab('compatibility');
                    }
                  } else {
                    toast({
                      title: 'Conversion failed',
                      description: statusData.result.error || 'Unknown error',
                      variant: 'destructive',
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error polling conversion status:', error);
          }
        }, 2000);

        setStatusPolling(interval);
      } else {
        toast({
          title: 'Conversion failed to start',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion failed to start',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const generateCompatibilityLayerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof compatibilityFormSchema>) => {
      const response = await fetch('/api/database-conversion/generate-compatibility-layer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate compatibility layer');
      }

      return response.json();
    },
    onSuccess: data => {
      if (data.success) {
        setCompatibilityResult(data.result);

        toast({
          title: 'Compatibility layer generated',
          description: `Generated ${data.result.generatedFiles.length} files for ${compatibilityForm.getValues('ormType')}`,
          variant: 'default',
        });

        // Auto-navigate to results tab
        setActiveTab('results');
        setShowFinalReport(true);
      } else {
        toast({
          title: 'Failed to generate compatibility layer',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate compatibility layer',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Effects
  useEffect(() => {
    if (supportedDatabases) {
      setDatabaseTypes(supportedDatabases);
    }
  }, [supportedDatabases]);

  // Effect to clean up the interval on unmount
  useEffect(() => {
    return () => {
      if (statusPolling) {
        clearInterval(statusPolling);
      }
    };
  }, [statusPolling]);

  // Handlers
  const handleTestConnection = () => {
    const databaseType = connectionForm.getValues('databaseType');
    const connectionString = connectionForm.getValues('connectionString');

    if (!databaseType || !connectionString) {
      toast({
        title: 'Missing information',
        description: 'Please provide database type and connection string',
        variant: 'destructive',
      });
      return;
    }

    testConnectionMutation.mutate({
      databaseType,
      connectionString,
    });
  };

  const handleAnalyzeSchema = (data: z.infer<typeof connectionFormSchema>) => {
    analyzeSchemasMutation.mutate(data);
  };

  const handleStartConversion = (data: z.infer<typeof conversionFormSchema>) => {
    startConversionMutation.mutate(data);
  };

  const handleGenerateCompatibilityLayer = (data: z.infer<typeof compatibilityFormSchema>) => {
    generateCompatibilityLayerMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return 'text-green-500 dark:text-green-400';
      case 'failed':
        return 'text-red-500 dark:text-red-400';
      case 'in_progress':
      case 'running':
        return 'text-blue-500 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-500 dark:text-yellow-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div><>

          <h1 className="text-3xl font-bold">Database Conversion System</h1>
          <p
</> className="text-gray-500 dark:text-gray-400 mt-2">
            Convert your existing database to a new system with intelligent schema analysis and
            optimizations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6"><>

            <TabsTrigger value="connect">1. Connect</TabsTrigger>
            <TabsTrigger
</> value="convert">2. Convert</TabsTrigger><>

            <TabsTrigger value="compatibility">3. Compatibility</TabsTrigger>
            <TabsTrigger
</> value="results">4. Results</TabsTrigger>
          </TabsList>

          {/* Connect Tab */}
          <TabsContent value="connect">
            <Card>
              <CardHeader><>

                <CardTitle>Connect to Database</CardTitle>
                <CardDescription
</>>
                  Connect to your source database to begin the conversion process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...connectionForm}>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Select Database Type</h3>

                      {isLoadingDatabases ? (
                        <div className="flex items-center justify-center p-6">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2">Loading supported databases...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {databaseTypes?.map((db: DatabaseInfo) => (
                            <DatabaseCard
                              key={db.id}
                              database={db}
                              selected={connectionForm.getValues('databaseType') === db.id}
                              onClick={() => {
                                connectionForm.setValue('databaseType', db.id as DatabaseType);
                                setSelectedDatabase(db.id as DatabaseType);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Connection Details</h3>

                      <FormField
</>
                        control={connectionForm.control}
                        name="connectionString"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Connection String</FormLabel>
                            <FormControl
</>><>

                              <Input
                                placeholder="e.g. postgresql://user:password@localhost:5432/mydatabase"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription
</>>
                              The connection string for your {selectedDatabase || 'database'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
                        >
                          {testConnectionMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Test Connection
                        </Button>

                        {connectionTestResult && (
                          <div
                            className={`flex items-center ${getStatusColor(connectionTestResult.status)}`}
                          >
                            {connectionTestResult.status === 'success' ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                <span>Connection successful</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                <span>Connection failed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {connectionTestResult && connectionTestResult.status === 'success' && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" /><>

                          <AlertTitle>Connected Successfully</AlertTitle>
                          <AlertDescription
</>>
                            Connected to {connectionTestResult.databaseName || 'database'} (
                            {connectionTestResult.databaseVersion || 'unknown version'})
                          </AlertDescription>
                        </Alert>
                      )}

                      {connectionTestResult && connectionTestResult.status === 'failed' && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" /><>

                          <AlertTitle>Connection Failed</AlertTitle>
                          <AlertDescription
</>>
                            {connectionTestResult.error || 'Unknown error occurred'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Project Information</h3>

                      <FormField
</>
                        control={connectionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Project Name</FormLabel>
                            <FormControl
</>><>

                              <Input placeholder="e.g. My Database Conversion" {...field} />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={connectionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Description</FormLabel>
                            <FormControl
</>><>

                              <Textarea
                                placeholder="Optional description for this conversion project"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage
</> />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Schema Analysis Options</h3>

                      <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={connectionForm.control}
                          name="includeViews"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5"><>

                                <FormLabel>Include Views</FormLabel>
                                <FormDescription
</>>Analyze database views</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={connectionForm.control}
                          name="includeProcedures"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5"><>

                                <FormLabel>Include Procedures</FormLabel>
                                <FormDescription
</>>Analyze stored procedures</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={connectionForm.control}
                          name="includeFunctions"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5"><>

                                <FormLabel>Include Functions</FormLabel>
                                <FormDescription
</>>Analyze database functions</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={connectionForm.control}
                          name="includeTriggers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5"><>

                                <FormLabel>Include Triggers</FormLabel>
                                <FormDescription
</>>Analyze database triggers</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between"><>

                <Button variant="outline" onClick={() => connectionForm.reset()}>
                  Reset
                </Button>
                <Button
</>
                  onClick={connectionForm.handleSubmit(handleAnalyzeSchema)}
                  disabled={
                    analyzeSchemasMutation.isPending ||
                    !connectionTestResult ||
                    connectionTestResult.status !== 'success'
                  }
                >
                  {analyzeSchemasMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Analyze Schema
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Convert Tab */}
          <TabsContent value="convert">
            <Card>
              <CardHeader><>

                <CardTitle>Convert Database</CardTitle>
                <CardDescription
</>>
                  Configure your conversion process and target database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Conversion Progress */}
                {conversionStatus && conversionStatus.status === 'running' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
                      <h4 className="font-medium">Conversion in Progress</h4>
                    </div><>

                    <p className="text-sm mt-1 mb-3">
                      {conversionStatus.statusMessage ||
                        'Your database is being converted. Please wait...'}
                    </p>

                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-xs"><>

                        <span>Overall Progress</span>
                        <span
</>>{Math.round(conversionStatus.progress.overallProgress * 100)}%</span>
                      </div>
                      <Progress
                        value={conversionStatus.progress.overallProgress * 100}
                        className="h-2"
                      />

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded border"><>

                          <div className="text-xs text-muted-foreground">Tables</div>
                          <div
</> className="font-medium">
                            {conversionStatus.progress.tablesConverted} /{' '}
                            {conversionStatus.progress.totalTables}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2 rounded border"><>

                          <div className="text-xs text-muted-foreground">Records</div>
                          <div
</> className="font-medium">
                            {conversionStatus.progress.recordsProcessed.toLocaleString()} /{' '}
                            {conversionStatus.progress.estimatedTotalRecords.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {conversionStatus && conversionStatus.status === 'failed' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <h4 className="font-medium">Conversion Failed</h4>
                    </div><>

                    <p className="text-sm mt-1">
                      {conversionStatus.error ||
                        'There was an error during the conversion process.'}
                    </p>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setConversionStatus(null)}
                    >
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Success State */}
                {conversionStatus && conversionStatus.status === 'completed' && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md mb-6">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="font-medium">Conversion Complete</h4>
                    </div><>

                    <p className="text-sm mt-1">Database conversion was successfully completed.</p>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setActiveTab('compatibility')}
                    >
                      Continue to Compatibility Layer
                    </Button>
                  </div>
                )}

                {!schemaAnalysisResult ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                      <h4 className="font-medium">No Schema Analysis</h4>
                    </div><>

                    <p className="text-sm mt-1">
                      You need to connect to a database and analyze its schema first.
                    </p>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setActiveTab('connect')}
                    >
                      Go to Connect Tab
                    </Button>
                  </div>
                ) : (
                  <Form {...conversionForm}>
                    <form className="space-y-6">
                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Schema Analysis Results</h3>

                        <div
</> className="bg-primary/5 p-4 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div><>

                              <p className="text-sm font-medium text-muted-foreground">
                                Database Type
                              </p>
                              <p
</> className="text-sm font-bold">
                                {schemaAnalysisResult?.databaseType}
                              </p>
                            </div>
                            <div><>

                              <p className="text-sm font-medium text-muted-foreground">Tables</p>
                              <p
</> className="text-sm font-bold">
                                {schemaAnalysisResult?.tables?.length}
                              </p>
                            </div>
                            <div><>

                              <p className="text-sm font-medium text-muted-foreground">Views</p>
                              <p
</> className="text-sm font-bold">
                                {schemaAnalysisResult?.views?.length}
                              </p>
                            </div>
                          </div>

                          {schemaAnalysisResult?.schemaIssues && (
                            <div className="mt-4"><>

                              <p className="text-sm font-medium text-muted-foreground">
                                Detected Issues
                              </p>
                              <div
</> className="mt-1 space-y-1">
                                {(schemaAnalysisResult?.schemaIssues?.tablesWithoutPrimaryKey
                                  ?.length ?? 0) > 0 && (
                                  <div className="flex items-center">
                                    <AlertCircle className="w-3 h-3 text-yellow-500 mr-2" />
                                    <p className="text-xs">
                                      {schemaAnalysisResult?.schemaIssues?.tablesWithoutPrimaryKey
                                        ?.length ?? 0}{' '}
                                      tables without primary key
                                    </p>
                                  </div>
                                )}
                                {(schemaAnalysisResult?.schemaIssues?.inconsistentNaming?.length ??
                                  0) > 0 && (
                                  <div className="flex items-center">
                                    <AlertCircle className="w-3 h-3 text-yellow-500 mr-2" />
                                    <p className="text-xs">
                                      {schemaAnalysisResult?.schemaIssues?.inconsistentNaming
                                        ?.length ?? 0}{' '}
                                      inconsistent naming patterns
                                    </p>
                                  </div>
                                )}
                                {(schemaAnalysisResult?.performanceIssues?.tablesWithoutIndexes
                                  ?.length ?? 0) > 0 && (
                                  <div className="flex items-center">
                                    <AlertCircle className="w-3 h-3 text-yellow-500 mr-2" />
                                    <p className="text-xs">
                                      {schemaAnalysisResult?.performanceIssues?.tablesWithoutIndexes
                                        ?.length ?? 0}{' '}
                                      tables without indexes
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Project Information</h3>

                        <FormField
</>
                          control={conversionForm.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Project ID</FormLabel>
                              <FormControl
</>><>

                                <Input readOnly {...field} />
                              </FormControl>
                              <FormDescription
</>>Auto-generated project identifier</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Source Database</h3>

                        <FormField
</>
                          control={conversionForm.control}
                          name="sourceType"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Source Database Type</FormLabel>
                              <FormControl
</>>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled
                                >
                                  <SelectTrigger><>

                                    <SelectValue placeholder="Select database type" />
                                  </SelectTrigger>
                                  <SelectContent
</>>
                                    {databaseTypes
                                      ?.filter((db: DatabaseInfo) => db.supportLevel === 'Full')
                                      .map((db: DatabaseInfo) => (
                                        <SelectItem key={db.id} value={db.id}>
                                          {db.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </FormControl><>

                              <FormDescription>
                                Type of the source database (auto-filled from analysis)
                              </FormDescription>
                              <FormMessage
</> />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={conversionForm.control}
                          name="sourceConnectionString"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Source Connection String</FormLabel>
                              <div
</> className="flex items-center space-x-2">
                                <FormControl><>

                                  <Input
                                    {...field}
                                    disabled
                                    type={showConnectionStrings ? 'text' : 'password'}
                                    value={
                                      showConnectionStrings
                                        ? field.value
                                        : maskConnectionString(field.value)
                                    }
                                  />
                                </FormControl>
                                <Button
</>
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowConnectionStrings(!showConnectionStrings)}
                                >
                                  {showConnectionStrings ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div><>

                              <FormDescription>
                                Connection string for the source database (auto-filled from
                                analysis)
                              </FormDescription>
                              <FormMessage
</> />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Target Database</h3>

                        <FormField
</>
                          control={conversionForm.control}
                          name="targetType"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Target Database Type</FormLabel>
                              <FormControl
</>>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger><>

                                    <SelectValue placeholder="Select database type" />
                                  </SelectTrigger>
                                  <SelectContent
</>>
                                    {databaseTypes
                                      ?.filter((db: DatabaseInfo) => db.supportLevel === 'Full')
                                      .map((db: DatabaseInfo) => (
                                        <SelectItem key={db.id} value={db.id}>
                                          {db.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </FormControl><>

                              <FormDescription>Type of the target database</FormDescription>
                              <FormMessage
</> />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={conversionForm.control}
                          name="targetConnectionString"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Target Connection String</FormLabel>
                              <div
</> className="flex items-center space-x-2">
                                <FormControl><>

                                  <Input
                                    placeholder="e.g. postgresql://user:password@localhost:5432/target_db"
                                    {...field}
                                    type={showConnectionStrings ? 'text' : 'password'}
                                    value={field.value}
                                    onChange={field.onChange}
                                  />
                                </FormControl>
                                <Button
</>
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowConnectionStrings(!showConnectionStrings)}
                                >
                                  {showConnectionStrings ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div><>

                              <FormDescription>
                                Connection string for the target database
                              </FormDescription>
                              <FormMessage
</> />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Compatibility Options</h3>

                        <FormField
</>
                          control={conversionForm.control}
                          name="generateCompatibilityLayer"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5"><>

                                <FormLabel>Generate Compatibility Layer</FormLabel>
                                <FormDescription
</>>Generate code for ORM integration</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {conversionForm.watch('generateCompatibilityLayer') && (
                          <>
                            <FormField
                              control={conversionForm.control}
                              name="ormType"
                              render={({ field }) => (
                                <FormItem><>

                                  <FormLabel>ORM Type</FormLabel>
                                  <FormControl
</>>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <SelectTrigger><>

                                        <SelectValue placeholder="Select ORM type" />
                                      </SelectTrigger>
                                      <SelectContent
</>>
                                        {Object.entries(ORMType).map(([key, value]) => (
                                          <SelectItem key={value} value={value}>
                                            {key}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl><>

                                  <FormDescription>
                                    Type of ORM to generate compatibility layer for
                                  </FormDescription>
                                  <FormMessage
</> />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={conversionForm.control}
                                name="includeExamples"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5"><>

                                      <FormLabel>Include Examples</FormLabel>
                                      <FormDescription
</>>Generate example code</FormDescription>
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

                              <FormField
                                control={conversionForm.control}
                                name="generateMigrations"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5"><>

                                      <FormLabel>Generate Migrations</FormLabel>
                                      <FormDescription
</>>
                                        Create database migration files
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
                          </>
                        )}
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('connect')}>
                  Back
                </Button>
                {schemaAnalysisResult && (
                  <Button
                    onClick={conversionForm.handleSubmit(handleStartConversion)}
                    disabled={startConversionMutation.isPending}
                  >
                    {startConversionMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Start Conversion
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Compatibility Tab */}
          <TabsContent value="compatibility">
            <Card>
              <CardHeader><>

                <CardTitle>Compatibility Layer</CardTitle>
                <CardDescription
</>>
                  Generate a compatibility layer for your converted database to use with ORM
                  frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!schemaAnalysisResult ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                      <h4 className="font-medium">No Schema Analysis</h4>
                    </div><>

                    <p className="text-sm mt-1">
                      You need to connect to a database and analyze its schema first.
                    </p>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setActiveTab('connect')}
                    >
                      Go to Connect Tab
                    </Button>
                  </div>
                ) : (
                  <Form {...compatibilityForm}>
                    <form className="space-y-6">
                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Project Information</h3>

                        <FormField
</>
                          control={compatibilityForm.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Project ID</FormLabel>
                              <FormControl
</>><>

                                <Input readOnly {...field} />
                              </FormControl>
                              <FormDescription
</>>Auto-generated project identifier</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4"><>

                        <h3 className="text-lg font-medium">Compatibility Options</h3>

                        <FormField
</>
                          control={compatibilityForm.control}
                          name="ormType"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>ORM Type</FormLabel>
                              <FormControl
</>>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger><>

                                    <SelectValue placeholder="Select ORM type" />
                                  </SelectTrigger>
                                  <SelectContent
</>>
                                    {Object.entries(ORMType).map(([key, value]) => (
                                      <SelectItem key={value} value={value}>
                                        {key}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl><>

                              <FormDescription>
                                Type of ORM to generate compatibility layer for
                              </FormDescription>
                              <FormMessage
</> />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={compatibilityForm.control}
                            name="includeExamples"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><>

                                  <FormLabel>Include Examples</FormLabel>
                                  <FormDescription
</>>Generate example code</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={compatibilityForm.control}
                            name="generateMigrations"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><>

                                  <FormLabel>Generate Migrations</FormLabel>
                                  <FormDescription
</>>Create database migration files</FormDescription>
                                </div>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={compatibilityForm.control}
                          name="targetDirectory"
                          render={({ field }) => (
                            <FormItem><>

                              <FormLabel>Target Directory</FormLabel>
                              <FormControl
</>><>

                                <Input {...field} />
                              </FormControl>
                              <FormDescription
</>>
                                Directory where compatibility layer files will be generated
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('convert')}>
                  Back
                </Button>
                {schemaAnalysisResult && (
                  <Button
                    onClick={compatibilityForm.handleSubmit(handleGenerateCompatibilityLayer)}
                    disabled={generateCompatibilityLayerMutation.isPending}
                  >
                    {generateCompatibilityLayerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Compatibility Layer
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader><>

                <CardTitle>Results and Summary</CardTitle>
                <CardDescription
</>>
                  Review the results of the database conversion process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showFinalReport && compatibilityResult ? (
                  <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                        <h4 className="font-medium">Conversion Completed Successfully</h4>
                      </div>
                      <p className="text-sm mt-1">
                        Your database schema has been converted and compatibility layer generated
                        successfully.
                      </p>
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Conversion Summary</h3>

                      <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-primary/5 p-4 rounded-md"><>

                          <p className="text-sm font-medium text-muted-foreground">
                            Source Database
                          </p>
                          <p
</> className="text-sm font-bold">{schemaAnalysisResult?.databaseType}</p>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-md"><>

                          <p className="text-sm font-medium text-muted-foreground">
                            Target Database
                          </p>
                          <p
</> className="text-sm font-bold">
                            {conversionForm.getValues('targetType')}
                          </p>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-md"><>

                          <p className="text-sm font-medium text-muted-foreground">ORM Type</p>
                          <p
</> className="text-sm font-bold">
                            {compatibilityForm.getValues('ormType')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Generated Files</h3>

                      <div
</> className="space-y-2">
                        {compatibilityResult.generatedFiles.map((file /* , index */) => (
                          <div key={index} className="bg-muted p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Code2 className="w-4 h-4 mr-2 text-primary" />
                                <span className="text-sm font-medium">{file.path}</span>
                              </div>
                              <Badge variant="outline">{file.type}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4"><>

                      <h3 className="text-lg font-medium">Next Steps</h3>

                      <div
</> className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5"><>

                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                          <div
</>><>

                            <p className="font-medium">Review Generated Code</p>
                            <p
</> className="text-sm text-muted-foreground">
                              Review the generated compatibility layer code and make any necessary
                              adjustments.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5"><>

                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                          <div
</>><>

                            <p className="font-medium">Run Migrations</p>
                            <p
</> className="text-sm text-muted-foreground">
                              Run the generated migrations to create the schema in your target
                              database.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <div className="mt-0.5"><>

                            <Check className="h-5 w-5 text-green-500" />
                          </div>
                          <div
</>><>

                            <p className="font-medium">Test the Integration</p>
                            <p
</> className="text-sm text-muted-foreground">
                              Test your application with the new database and compatibility layer.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3"><>

                      <Button
                        onClick={() => {
                          connectionForm.reset();
                          conversionForm.reset();
                          compatibilityForm.reset();
                          setActiveTab('connect');
                        }}
                      >
                        Start New Conversion
                      </Button>
                      <Button
</> type="button">Download Conversion Report</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                      <h4 className="font-medium">No Completed Conversion</h4>
                    </div><>

                    <p className="text-sm mt-1">
                      You don't have any completed database conversions yet. Please complete the
                      previous steps.
                    </p>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setActiveTab('convert')}
                    >
                      Go to Convert Tab
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatabaseConversionPage;
