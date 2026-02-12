import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RefreshCw,
  Bug,
  Shield,
  Zap,
  Activity,
  Clock,
  User,
  Settings,
  Download,
  Copy,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Database,
  Network,
  Server
} from 'lucide-react';

// Types
interface ErrorEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  category: 'system' | 'user' | 'network' | 'data' | 'security';
  message: string;
  details?: string;
  component?: string;
  userId?: string;
  resolved: boolean;
  stack?: string;
}

interface ErrorStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  resolved: number;
  unresolved: number;
}

interface ErrorHandlingConfig {
  autoRetry: boolean;
  maxRetries: number;
  enableLogging: boolean;
  enableNotifications: boolean;
  enableRecovery: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const errorVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

export default function ErrorHandlingDemo() {
  // State management
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [config, setConfig] = useState<ErrorHandlingConfig>({
    autoRetry: true,
    maxRetries: 3,
    enableLogging: true,
    enableNotifications: true,
    enableRecovery: true
  });

  // Sample error data
  const sampleErrors: Omit<ErrorEntry, 'id' | 'timestamp'>[] = [
    {
      level: 'error',
      category: 'network',
      message: 'Failed to connect to map service',
      details: 'Connection timeout after 30 seconds',
      component: 'MapProvider',
      resolved: false,
      stack: 'Error: Network timeout\n  at MapProvider.connect()\n  at async loadMap()'
    },
    {
      level: 'warning',
      category: 'data',
      message: 'Large dataset detected',
      details: 'Processing 10,000+ features may impact performance',
      component: 'DataProcessor',
      resolved: false
    },
    {
      level: 'error',
      category: 'user',
      message: 'Invalid file format uploaded',
      details: 'Expected GeoJSON, received PDF',
      component: 'FileUploader',
      userId: 'user-123',
      resolved: true
    },
    {
      level: 'info',
      category: 'system',
      message: 'Automatic backup completed',
      details: 'Backup saved to cloud storage',
      component: 'BackupService',
      resolved: true
    },
    {
      level: 'error',
      category: 'security',
      message: 'Unauthorized access attempt',
      details: 'Failed login from IP 192.168.1.100',
      component: 'AuthService',
      resolved: false
    }
  ];

  // Initialize with sample data
  useEffect(() => {
    const initialErrors = sampleErrors.map((error, index) => ({
      ...error,
      id: `error-${index}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));
    setErrors(initialErrors);
  }, []);

  // Simulate real-time error monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to generate error
        const sampleError = sampleErrors[Math.floor(Math.random() * sampleErrors.length)];
        const newError: ErrorEntry = {
          ...sampleError,
          id: `error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          resolved: false
        };
        
        setErrors(prev => [newError, ...prev.slice(0, 19)]); // Keep last 20 errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Calculate statistics
  const stats: ErrorStats = errors.reduce((acc, error) => {
    acc.total++;
    acc[error.level]++;
    if (error.resolved) acc.resolved++;
    else acc.unresolved++;
    return acc;
  }, { total: 0, errors: 0, warnings: 0, info: 0, resolved: 0, unresolved: 0 });

  // Filter errors by category
  const filteredErrors = selectedCategory === 'all' 
    ? errors 
    : errors.filter(error => error.category === selectedCategory);

  // Error handling functions
  const handleResolveError = (errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ));
  };

  const handleRetryError = (errorId: string) => {
    console.log(`Retrying error: ${errorId}`);
    // Simulate retry logic
    setTimeout(() => {
      if (Math.random() > 0.5) {
        handleResolveError(errorId);
      }
    }, 2000);
  };

  const handleClearResolved = () => {
    setErrors(prev => prev.filter(error => !error.resolved));
  };

  const handleSimulateError = (type: ErrorEntry['level']) => {
    const sampleError = sampleErrors.find(e => e.level === type) || sampleErrors[0];
    const newError: ErrorEntry = {
      ...sampleError,
      id: `simulated-${Date.now()}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      message: `Simulated ${type}: ${sampleError.message}`
    };
    setErrors(prev => [newError, ...prev]);
  };

  const getErrorIcon = (level: ErrorEntry['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Bug className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: ErrorEntry['category']) => {
    switch (category) {
      case 'system':
        return <Server className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return <Bug className="h-4 w-4" />;
    }
  };

  const getErrorColor = (level: ErrorEntry['level']) => {
    switch (level) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <motion.div 
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground">
          Error Handling & Monitoring Demo
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive error tracking, automatic recovery, and real-time monitoring 
          system for enterprise applications.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            Auto Recovery
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Real-time Monitoring
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Instant Alerts
          </Badge>
        </div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={cardVariants}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All monitoring events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unresolved}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Successfully handled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Resolution efficiency
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Control Panel */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={cardVariants}
      >
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Error Monitoring</CardTitle>
                  <CardDescription>
                    Real-time error tracking and management system
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isMonitoring ? "default" : "outline"}
                    onClick={() => setIsMonitoring(!isMonitoring)}
                  >
                    {isMonitoring ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {isMonitoring ? 'Pause' : 'Resume'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleClearResolved}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear Resolved
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Category Filter */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium">Filter by category:</span>
                <div className="flex flex-wrap gap-1">
                  {['all', 'system', 'network', 'data', 'user', 'security'].map((category) => (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="text-xs"
                    >
                      {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Error List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredErrors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                      <p>No errors to display</p>
                      <p className="text-sm">System is running smoothly</p>
                    </div>
                  ) : (
                    filteredErrors.map((error) => (
                      <motion.div
                        key={error.id}
                        variants={errorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`p-4 border rounded-lg ${getErrorColor(error.level)} ${
                          error.resolved ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getErrorIcon(error.level)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm">{error.message}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {getCategoryIcon(error.category)}
                                  <span className="ml-1">{error.category}</span>
                                </Badge>
                                {error.resolved && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              
                              {error.details && (
                                <p className="text-xs text-muted-foreground mb-2">{error.details}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(error.timestamp)}
                                </span>
                                {error.component && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {error.component}
                                  </span>
                                )}
                                {error.userId && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {error.userId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            {!error.resolved && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRetryError(error.id)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleResolveError(error.id)}
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {error.stack && (
                          <details className="mt-3">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              Stack trace
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                              {error.stack}
                            </pre>
                          </details>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>
                Error handling system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto Retry</span>
                  <Button
                    size="sm"
                    variant={config.autoRetry ? "default" : "outline"}
                    onClick={() => setConfig(prev => ({ ...prev, autoRetry: !prev.autoRetry }))}
                  >
                    {config.autoRetry ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Logging</span>
                  <Button
                    size="sm"
                    variant={config.enableLogging ? "default" : "outline"}
                    onClick={() => setConfig(prev => ({ ...prev, enableLogging: !prev.enableLogging }))}
                  >
                    {config.enableLogging ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  <Button
                    size="sm"
                    variant={config.enableNotifications ? "default" : "outline"}
                    onClick={() => setConfig(prev => ({ ...prev, enableNotifications: !prev.enableNotifications }))}
                  >
                    {config.enableNotifications ? 'On' : 'Off'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recovery</span>
                  <Button
                    size="sm"
                    variant={config.enableRecovery ? "default" : "outline"}
                    onClick={() => setConfig(prev => ({ ...prev, enableRecovery: !prev.enableRecovery }))}
                  >
                    {config.enableRecovery ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSimulateError('error')}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Simulate Error
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSimulateError('warning')}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Simulate Warning
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSimulateError('info')}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Simulate Info
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Error Rate</span>
                  <span>{stats.total > 0 ? Math.round((stats.errors / stats.total) * 100) : 0}%</span>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.errors / stats.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Resolution Rate</span>
                  <span>{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0} 
                  className="h-2" 
                />
              </div>

              <div className="pt-4 border-t">
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="h-3 w-3 mr-1" />
                  Export Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Features Overview */}
      <motion.div variants={cardVariants}>
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Error Handling Features:</strong> Automatic retry mechanisms, 
            real-time monitoring, intelligent recovery, stack trace analysis, 
            and comprehensive logging for enterprise-grade reliability.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
