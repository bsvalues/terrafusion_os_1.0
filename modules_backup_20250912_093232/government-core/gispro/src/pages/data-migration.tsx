import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {Database,
  Upload,
  Download,
  Server,
  FileText,
  FolderOpen,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RefreshCw,
  Settings,
  Globe,
  HardDrive,
  Network,
  Zap,
  MapPin,
  Layers,
  File,
  Archive,
  Cloud,
  Shield,
  Link,
  Eye,
  EyeOff,} from 'lucide-react';

// Types
interface MigrationJob {id: string;
  name: string;
  type: 'ftp' | 'database' | 'api' | 'file' | 'batch';
  source: string;
  destination: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'paused';
  progress: number;
  startTime?: string;
  endTime?: string;
  recordsTransferred: number;
  totalRecords: number;
  errorCount: number;
  size: string;}

interface ConnectionConfig {id: string;
  name: string;
  type: 'ftp' | 'sftp' | 'database' | 'api' | 'cloud';
  host: string;
  port?: number;
  username: string;
  password: string;
  database?: string;
  isConnected: boolean;
  lastTested?: string;}

interface DataSource {id: string;
  name: string;
  type: 'shapefile' | 'geodatabase' | 'csv' | 'json' | 'xml' | 'kml';
  size: string;
  recordCount: number;
  lastModified: string;
  geometry: 'point' | 'line' | 'polygon' | 'mixed' | 'none';
  crs: string;}

// Animation variants
const containerVariants = {hidden: { opacity: 0},
  visible: {opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,},
  },
};

const cardVariants = {hidden: { opacity: 0, y: 20},
  visible: {opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut'},
  },
};

const progressVariants = {hidden: { scaleX: 0},
  visible: {scaleX: 1,
    transition: { duration: 1, ease: 'easeOut'},
  },
};

const statusVariants = {pending: { color: '#6B7280'},
  running: {color: '#3B82F6'},
  completed: {color: '#10B981'},
  error: {color: '#EF4444'},
  paused: {color: '#F59E0B'},
};

export default function DataMigrationPage() {// Active tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Migration jobs state
  const [migrationJobs, setMigrationJobs] = useState<MigrationJob[]>([
    {
      id: '1',
      name: 'County Parcels Import',
      type: 'ftp',
      source: 'ftp://county.gov/parcels/',
      destination: 'PostgreSQL/parcels_table',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T08:45:00Z',
      recordsTransferred: 45820,
      totalRecords: 45820,
      errorCount: 0,
      size: '234 MB',},
    {id: '2',
      name: 'Road Network Sync',
      type: 'api',
      source: 'DOT REST API',
      destination: 'PostGIS/roads_layer',
      status: 'running',
      progress: 67,
      startTime: '2024-01-15T09:15:00Z',
      recordsTransferred: 23400,
      totalRecords: 35000,
      errorCount: 2,
      size: '156 MB',},
    {id: '3',
      name: 'Property Documents',
      type: 'batch',
      source: 'Local File Server',
      destination: 'Document Storage',
      status: 'pending',
      progress: 0,
      recordsTransferred: 0,
      totalRecords: 12500,
      errorCount: 0,
      size: '1.2 GB',},
    {id: '4',
      name: 'Zoning Boundaries',
      type: 'ftp',
      source: 'Planning Dept FTP',
      destination: 'PostgreSQL/zoning_table',
      status: 'error',
      progress: 34,
      startTime: '2024-01-15T07:30:00Z',
      recordsTransferred: 1240,
      totalRecords: 3650,
      errorCount: 15,
      size: '89 MB',},
  ]);

  // Connection configurations
  const [connections, setConnections] = useState<ConnectionConfig[]>([
    {id: '1',
      name: 'County FTP Server',
      type: 'ftp',
      host: 'ftp.bentoncounty.org',
      port: 21,
      username: 'gis_user',
      password: '••••••••',
      isConnected: true,
      lastTested: '2024-01-15T10:00:00Z',},
    {id: '2',
      name: 'DOT Database',
      type: 'database',
      host: 'db.transportation.state.gov',
      port: 5432,
      username: 'readonly',
      password: '••••••••',
      database: 'roads_db',
      isConnected: false,
      lastTested: '2024-01-15T09:45:00Z',},
    {id: '3',
      name: 'Cloud Storage',
      type: 'cloud',
      host: 'storage.example.com',
      username: 'api_key',
      password: '••••••••',
      isConnected: true,
      lastTested: '2024-01-15T10:30:00Z',},
  ]);

  // Data sources
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {id: '1',
      name: 'county_parcels.shp',
      type: 'shapefile',
      size: '234 MB',
      recordCount: 45820,
      lastModified: '2024-01-15T08:00:00Z',
      geometry: 'polygon',
      crs: 'EPSG:4326',},
    {id: '2',
      name: 'road_network.gdb',
      type: 'geodatabase',
      size: '156 MB',
      recordCount: 35000,
      lastModified: '2024-01-14T16:30:00Z',
      geometry: 'line',
      crs: 'EPSG:3857',},
    {id: '3',
      name: 'addresses.csv',
      type: 'csv',
      size: '45 MB',
      recordCount: 125000,
      lastModified: '2024-01-13T12:15:00Z',
      geometry: 'point',
      crs: 'EPSG:4326',},
    {id: '4',
      name: 'zoning_data.json',
      type: 'json',
      size: '23 MB',
      recordCount: 8750,
      lastModified: '2024-01-12T14:45:00Z',
      geometry: 'polygon',
      crs: 'EPSG:4326',},
  ]);

  // Form states
  const [newConnectionForm, setNewConnectionForm] = useState({name: '',
    type: 'ftp' as ConnectionConfig['type'],
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',});

  const [showPasswords, setShowPasswords] = useState(false);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Refs
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update progress for running jobs
  useEffect(() =>{progressIntervalRef.current = setInterval(() => {
      setMigrationJobs(prev =>
        prev.map(job => {
          if (job.status === 'running' && job.progress< 100) {
            const newProgress = Math.min(job.progress + Math.random() * 3, 100);
            const newRecordsTransferred = Math.floor((newProgress / 100) * job.totalRecords);

            return {
              ...job,
              progress: newProgress,
              recordsTransferred: newRecordsTransferred,
              ...(newProgress >= 100 && {
                status: 'completed' as const,
                endTime: new Date().toISOString(),}),
            };
          }
          return job;
        })
      );
    }, 2000);

    return () =>{if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);}
    };
  }, []);

  // Helper functions
  const getStatusIcon = (status: MigrationJob['status']) => {switch (status) {
      case 'completed':
        return<CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;}
  };

  const getStatusBadge = (status: MigrationJob['status']) =>{const variants = {
      completed: 'default',
      running: 'default',
      error: 'destructive',
      paused: 'secondary',
      pending: 'outline',} as const;

    return (<Badge variant={variants[status]} className="flex items-center gap-1">{getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>);
  };

  const getTypeIcon = (type: MigrationJob['type']) => {switch (type) {
      case 'ftp':
        return<Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Globe className="h-4 w-4" />;
      case 'file':
        return <File className="h-4 w-4" />;
      case 'batch':
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;}
  };

  const formatDuration = (startTime: string, endTime?: string) =>{
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins< 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const formatFileSize = (size: string) =>{return size;};

  const formatNumber = (num: number) => {return num.toLocaleString();};

  const testConnection = async (connectionId: string) => {setIsConnecting(connectionId);

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    setConnections(prev =>
      prev.map(conn =>
        conn.id === connectionId
          ? {
              ...conn,
              isConnected: Math.random() > 0.3, // 70% success rate
              lastTested: new Date().toISOString(),}
          : conn
      )
    );

    setIsConnecting(null);
  };

  const startJob = (jobId: string) => {setMigrationJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              status: 'running',
              startTime: new Date().toISOString(),
              progress: 0,
              recordsTransferred: 0,
              errorCount: 0,}
          : job
      )
    );
  };

  const pauseJob = (jobId: string) => {setMigrationJobs(prev =>
      prev.map(job =>
        job.id === jobId && job.status === 'running' ? { ...job, status: 'paused'} : job
      )
    );
  };

  const resumeJob = (jobId: string) => {setMigrationJobs(prev =>
      prev.map(job =>
        job.id === jobId && job.status === 'paused' ? { ...job, status: 'running'} : job
      )
    );
  };

  return (<motion.div
      className="container mx-auto p-6 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >{/* Header */}<motion.div className="text-center" variants={cardVariants}><h1 className="text-4xl font-bold text-foreground mb-4">Data Migration System</h1><p className="text-xl text-muted-foreground max-w-3xl mx-auto">Transfer spatial data files, documents, and other information between BentonGeoPro and
          external systems. Connect to FTP servers, databases, and APIs to upload and download data
          for use in the application.</p></motion.div>{/* Status Overview */}<motion.div variants={cardVariants}><Alert className="border-blue-200 bg-blue-50"><Info className="h-4 w-4" /><AlertTitle>Migration Status</AlertTitle><AlertDescription>The Data Migration system allows you to transfer spatial data files, documents, and
            other information between BentonGeoPro and external systems. Connect to FTP servers to
            upload and download data for use in the application.</AlertDescription></Alert></motion.div>{/* Main Content */}<motion.div variants={cardVariants}><Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6"><TabsList className="grid w-full grid-cols-5"><TabsTrigger value="overview" className="flex items-center gap-2"><Database className="h-4 w-4" />Overview</TabsTrigger><TabsTrigger value="jobs" className="flex items-center gap-2"><RefreshCw className="h-4 w-4" />Migration Jobs</TabsTrigger><TabsTrigger value="connections" className="flex items-center gap-2"><Network className="h-4 w-4" />Connections</TabsTrigger><TabsTrigger value="sources" className="flex items-center gap-2"><FolderOpen className="h-4 w-4" />Data Sources</TabsTrigger><TabsTrigger value="settings" className="flex items-center gap-2"><Settings className="h-4 w-4" />Settings</TabsTrigger></TabsList>{/* Overview Tab */}<TabsContent value="overview" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Jobs</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{migrationJobs.filter(j => j.status === 'running').length}</div><p className="text-xs text-muted-foreground">Currently running</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed Today</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{migrationJobs.filter(j => j.status === 'completed').length}</div><p className="text-xs text-muted-foreground">Successful transfers</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Data Transferred</CardTitle><HardDrive className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">2.1 GB</div><p className="text-xs text-muted-foreground">Total today</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Connections</CardTitle><Network className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{connections.filter(c => c.isConnected).length}/{connections.length}</div><p className="text-xs text-muted-foreground">Online connections</p></CardContent></Card></div>{/* Recent Activity */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Recent Migration Activity</CardTitle><CardDescription>Latest data migration jobs and their status</CardDescription></CardHeader><CardContent><div className="space-y-4">{migrationJobs.slice(0, 3).map(job => (<div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    ><div className="flex items-center gap-3">{getTypeIcon(job.type)}<div><div className="font-medium">{job.name}</div><div className="text-sm text-muted-foreground">{job.source} → {job.destination}</div></div></div><div className="flex items-center gap-3">{job.status === 'running' && (<div className="flex items-center gap-2 min-w-[120px]"><Progress value={job.progress} className="flex-1" /><span className="text-sm font-medium">{Math.round(job.progress)}%</span></div>)}
                        {getStatusBadge(job.status)}</div></div>))}</div></CardContent></Card></TabsContent>{/* Migration Jobs Tab */}<TabsContent value="jobs" className="space-y-6"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Migration Jobs</h3><Button className="flex items-center gap-2"><Upload className="h-4 w-4" />New Migration Job</Button></div><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Job Name</TableHead><TableHead>Type</TableHead><TableHead>Source → Destination</TableHead><TableHead>Progress</TableHead><TableHead>Records</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{migrationJobs.map(job => (<TableRow key={job.id}><TableCell className="font-medium">{job.name}</TableCell><TableCell><div className="flex items-center gap-2">{getTypeIcon(job.type)}<span className="capitalize">{job.type}</span></div></TableCell><TableCell><div className="text-sm"><div className="font-medium">{job.source}</div><div className="text-muted-foreground">→ {job.destination}</div></div></TableCell><TableCell><div className="space-y-1"><Progress value={job.progress} className="w-full" /><div className="text-sm text-muted-foreground">{job.progress}% ({formatFileSize(job.size)})</div></div></TableCell><TableCell><div className="text-sm"><div>{formatNumber(job.recordsTransferred)} /{' '}
                              {formatNumber(job.totalRecords)}</div>{job.errorCount > 0 && (<div className="text-red-600">{job.errorCount} errors</div>)}</div></TableCell><TableCell>{getStatusBadge(job.status)}</TableCell><TableCell><div className="flex items-center gap-1">{job.status === 'pending' && (<Button size="sm" onClick={() => startJob(job.id)}><Play className="h-3 w-3" /></Button>)}
                            {job.status === 'running' && (<Button size="sm" variant="outline" onClick={() => pauseJob(job.id)}><Pause className="h-3 w-3" /></Button>)}
                            {job.status === 'paused' && (<Button size="sm" onClick={() => resumeJob(job.id)}><Play className="h-3 w-3" /></Button>)}<Button size="sm" variant="ghost"><Eye className="h-3 w-3" /></Button></div></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></TabsContent>{/* Connections Tab */}<TabsContent value="connections" className="space-y-6"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Connection Configurations</h3><Button className="flex items-center gap-2"><Network className="h-4 w-4" />Add Connection</Button></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{connections.map(connection => (<Card key={connection.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{connection.name}</CardTitle><Badge variant={connection.isConnected ? 'default' : 'destructive'}>{connection.isConnected ? 'Connected' : 'Disconnected'}</Badge></div><CardDescription>{connection.type.toUpperCase()} connection to {connection.host}</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-muted-foreground">Host:</span><div className="font-medium">{connection.host}</div></div>{connection.port && (<div><span className="text-muted-foreground">Port:</span><div className="font-medium">{connection.port}</div></div>)}<div><span className="text-muted-foreground">Username:</span><div className="font-medium">{connection.username}</div></div>{connection.database && (<div><span className="text-muted-foreground">Database:</span><div className="font-medium">{connection.database}</div></div>)}</div>{connection.lastTested && (<div className="text-sm text-muted-foreground">Last tested: {new Date(connection.lastTested).toLocaleString()}</div>)}</CardContent><CardFooter className="flex gap-2"><Button
                      variant="outline"
                      size="sm"
                      onClick={() =>testConnection(connection.id)}
                      disabled={isConnecting === connection.id}
                    >
                      {isConnecting === connection.id ? (<RefreshCw className="h-4 w-4 animate-spin" />) : (<Zap className="h-4 w-4" />)}
                      Test Connection</Button><Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button></CardFooter></Card>))}</div></TabsContent>{/* Data Sources Tab */}<TabsContent value="sources" className="space-y-6"><div className="flex items-center justify-between"><h3 className="text-lg font-medium">Available Data Sources</h3><Button className="flex items-center gap-2"><FolderOpen className="h-4 w-4" />Browse Sources</Button></div><Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Records</TableHead><TableHead>Geometry</TableHead><TableHead>CRS</TableHead><TableHead>Modified</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{dataSources.map(source => (<TableRow key={source.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><FileText className="h-4 w-4" />{source.name}</div></TableCell><TableCell><Badge variant="outline" className="capitalize">{source.type}</Badge></TableCell><TableCell>{source.size}</TableCell><TableCell>{formatNumber(source.recordCount)}</TableCell><TableCell><div className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="capitalize">{source.geometry}</span></div></TableCell><TableCell><code className="text-xs bg-muted px-1 py-0.5 rounded">{source.crs}</code></TableCell><TableCell><div className="text-sm">{new Date(source.lastModified).toLocaleDateString()}</div></TableCell><TableCell><div className="flex items-center gap-1"><TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="ghost"><Eye className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Preview data</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="ghost"><Download className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Download</TooltipContent></Tooltip></TooltipProvider><TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="sm" variant="ghost"><Upload className="h-3 w-3" /></Button></TooltipTrigger><TooltipContent>Import to system</TooltipContent></Tooltip></TooltipProvider></div></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></TabsContent>{/* Settings Tab */}<TabsContent value="settings" className="space-y-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Migration Settings</CardTitle><CardDescription>Configure default migration behavior and performance settings</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="batch-size">Batch Size</Label><Input id="batch-size" placeholder="1000" /><p className="text-sm text-muted-foreground">Number of records to process per batch</p></div><div className="space-y-2"><Label htmlFor="timeout">Connection Timeout (seconds)</Label><Input id="timeout" placeholder="30" /></div><div className="space-y-2"><Label htmlFor="retry">Max Retry Attempts</Label><Input id="retry" placeholder="3" /></div><div className="space-y-2"><Label htmlFor="log-level">Log Level</Label><Select defaultValue="info"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="debug">Debug</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="warn">Warning</SelectItem><SelectItem value="error">Error</SelectItem></SelectContent></Select></div></CardContent><CardFooter><Button>Save Settings</Button></CardFooter></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security Settings</CardTitle><CardDescription>Configure security and authentication options</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center justify-between"><div><div className="font-medium">Show Passwords</div><div className="text-sm text-muted-foreground">Display connection passwords in plain text</div></div><Button
                      variant="outline"
                      size="sm"
                      onClick={() =>setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ?<EyeOff className="h-4 w-4" />:<Eye className="h-4 w-4" />}
                    </Button></div><Separator /><div className="space-y-2"><Label htmlFor="encryption">Encryption Method</Label><Select defaultValue="tls"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="ssl">SSL</SelectItem><SelectItem value="tls">TLS</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="cert-validation">Certificate Validation</Label><Select defaultValue="strict"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="strict">Strict</SelectItem><SelectItem value="permissive">Permissive</SelectItem><SelectItem value="none">None</SelectItem></SelectContent></Select></div></CardContent></Card></div></TabsContent></Tabs></motion.div>{/* Footer Status */}<motion.div variants={cardVariants}><Alert className="border-green-200 bg-green-50"><CheckCircle className="h-4 w-4" /><AlertDescription>Data Migration system is online and ready. All connections are secure and monitored.</AlertDescription></Alert></motion.div></motion.div>
  );
}
