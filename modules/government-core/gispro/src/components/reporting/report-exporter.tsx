import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FilePdf, 
  FileImage,
  Mail,
  Cloud,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Play,
  Pause,
  Upload,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  premium?: boolean;
}

interface ExportJob {
  id: string;
  reportName: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  size?: string;
  downloadUrl?: string;
  error?: string;
}

interface ExportSettings {
  autoDownload: boolean;
  emailNotifications: boolean;
  cloudSync: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  qualityLevel: 'draft' | 'standard' | 'high' | 'premium';
  includeMetadata: boolean;
  watermark: boolean;
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

const jobVariants = {
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

export default function ReportExporter() {
  // State management
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf']);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [settings, setSettings] = useState<ExportSettings>({
    autoDownload: true,
    emailNotifications: false,
    cloudSync: false,
    compressionLevel: 'medium',
    qualityLevel: 'standard',
    includeMetadata: true,
    watermark: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [reportName, setReportName] = useState('Monthly Report');
  const [emailAddress, setEmailAddress] = useState('');
  const [customFileName, setCustomFileName] = useState('');

  // Available export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Document',
      extension: 'pdf',
      description: 'Portable Document Format - Universal compatibility',
      icon: <FilePdf className="h-5 w-5" />,
      available: true
    },
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      extension: 'xlsx',
      description: 'Microsoft Excel format with data tables',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      available: true
    },
    {
      id: 'csv',
      name: 'CSV Data',
      extension: 'csv',
      description: 'Comma-separated values for data analysis',
      icon: <FileText className="h-5 w-5" />,
      available: true
    },
    {
      id: 'word',
      name: 'Word Document',
      extension: 'docx',
      description: 'Microsoft Word format for editing',
      icon: <FileText className="h-5 w-5" />,
      available: true
    },
    {
      id: 'powerpoint',
      name: 'PowerPoint',
      extension: 'pptx',
      description: 'Presentation format with charts and graphs',
      icon: <FileImage className="h-5 w-5" />,
      available: true,
      premium: true
    },
    {
      id: 'json',
      name: 'JSON Data',
      extension: 'json',
      description: 'Structured data format for APIs',
      icon: <FileText className="h-5 w-5" />,
      available: true
    }
  ];

  // Sample export jobs
  const sampleJobs: ExportJob[] = [
    {
      id: 'job-001',
      reportName: 'Q4 Financial Report',
      format: 'PDF',
      status: 'completed',
      progress: 100,
      startTime: '2024-01-15T10:30:00Z',
      endTime: '2024-01-15T10:32:15Z',
      size: '2.4 MB',
      downloadUrl: '/downloads/q4-financial-report.pdf'
    },
    {
      id: 'job-002',
      reportName: 'Usage Analytics',
      format: 'Excel',
      status: 'processing',
      progress: 65,
      startTime: '2024-01-15T11:15:00Z'
    },
    {
      id: 'job-003',
      reportName: 'Compliance Audit',
      format: 'PDF',
      status: 'failed',
      progress: 0,
      startTime: '2024-01-15T09:45:00Z',
      endTime: '2024-01-15T09:47:30Z',
      error: 'Data source unavailable'
    }
  ];

  // Initialize data
  useEffect(() => {
    setExportJobs(sampleJobs);
  }, []);

  // Simulate job progress
  useEffect(() => {
    const interval = setInterval(() => {
      setExportJobs(prev => prev.map(job => {
        if (job.status === 'processing' && job.progress < 100) {
          const newProgress = Math.min(job.progress + Math.random() * 10, 100);
          const newStatus = newProgress >= 100 ? 'completed' : 'processing';
          return {
            ...job,
            progress: newProgress,
            status: newStatus,
            ...(newStatus === 'completed' && {
              endTime: new Date().toISOString(),
              size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
              downloadUrl: `/downloads/${job.reportName.toLowerCase().replace(/\s+/g, '-')}.${job.format.toLowerCase()}`
            })
          };
        }
        return job;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Export handlers
  const handleStartExport = () => {
    if (selectedFormats.length === 0) {
      alert('Please select at least one format');
      return;
    }

    setIsExporting(true);

    selectedFormats.forEach(formatId => {
      const format = exportFormats.find(f => f.id === formatId);
      if (format) {
        const newJob: ExportJob = {
          id: `job-${Date.now()}-${formatId}`,
          reportName: reportName || 'Untitled Report',
          format: format.name,
          status: 'pending',
          progress: 0,
          startTime: new Date().toISOString()
        };

        setExportJobs(prev => [newJob, ...prev]);

        // Start processing after a delay
        setTimeout(() => {
          setExportJobs(prev => prev.map(job =>
            job.id === newJob.id ? { ...job, status: 'processing' } : job
          ));
        }, 1000);
      }
    });

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  const handleCancelJob = (jobId: string) => {
    setExportJobs(prev => prev.map(job =>
      job.id === jobId && job.status === 'processing'
        ? { ...job, status: 'failed', error: 'Cancelled by user' }
        : job
    ));
  };

  const handleRetryJob = (jobId: string) => {
    setExportJobs(prev => prev.map(job =>
      job.id === jobId && job.status === 'failed'
        ? { ...job, status: 'pending', progress: 0, error: undefined }
        : job
    ));

    setTimeout(() => {
      setExportJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: 'processing' } : job
      ));
    }, 500);
  };

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      console.log(`Downloading: ${job.downloadUrl}`);
      // Simulate download
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = `${job.reportName}.${job.format.toLowerCase()}`;
      link.click();
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          Report Exporter
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Export reports in multiple formats with advanced customization options 
          and automated delivery systems.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Download className="h-3 w-3" />
            Multi-Format
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Batch Export
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Target className="h-3 w-3" />
            Auto Delivery
          </Badge>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={cardVariants}>
        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Configuration</CardTitle>
                  <CardDescription>
                    Configure your report export parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Report Name
                    </label>
                    <Input
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Custom File Name (Optional)
                    </label>
                    <Input
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      placeholder="Leave blank for auto-generated name..."
                    />
                  </div>

                  {settings.emailNotifications && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="notification@example.com"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Quality Level
                    </label>
                    <select
                      value={settings.qualityLevel}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        qualityLevel: e.target.value as ExportSettings['qualityLevel']
                      }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="draft">Draft (Fast)</option>
                      <option value="standard">Standard</option>
                      <option value="high">High Quality</option>
                      <option value="premium">Premium (Slow)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Compression Level
                    </label>
                    <select
                      value={settings.compressionLevel}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        compressionLevel: e.target.value as ExportSettings['compressionLevel']
                      }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="none">No Compression</option>
                      <option value="low">Low (Larger files)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Smaller files)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.includeMetadata}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        includeMetadata: checked
                      }))}
                    />
                    <label className="text-sm">Include metadata</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.watermark}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        watermark: checked
                      }))}
                    />
                    <label className="text-sm">Add watermark</label>
                  </div>
                </CardContent>
              </Card>

              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Formats</CardTitle>
                  <CardDescription>
                    Select one or more formats for export
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {exportFormats.map((format) => (
                      <div
                        key={format.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedFormats.includes(format.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!format.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!format.available) return;
                          
                          setSelectedFormats(prev =>
                            prev.includes(format.id)
                              ? prev.filter(id => id !== format.id)
                              : [...prev, format.id]
                          );
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`${
                            selectedFormats.includes(format.id) 
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                          }`}>
                            {format.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm">
                                {format.name}
                              </div>
                              {format.premium && (
                                <Badge variant="outline" className="text-xs">
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleStartExport}
                      disabled={selectedFormats.length === 0 || isExporting}
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Starting Export...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Export ({selectedFormats.length} format{selectedFormats.length !== 1 ? 's' : ''})
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Jobs</CardTitle>
                <CardDescription>
                  Monitor and manage your export operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exportJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No export jobs</h3>
                    <p className="text-muted-foreground">
                      Start an export to see jobs here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {exportJobs.map((job) => (
                        <motion.div
                          key={job.id}
                          variants={jobVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(job.status)}
                              <div>
                                <div className="font-medium">{job.reportName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {job.format} • Started {format(new Date(job.startTime), 'h:mm a')}
                                  {job.endTime && ` • Completed in ${Math.round(
                                    (new Date(job.endTime).getTime() - new Date(job.startTime).getTime()) / 1000
                                  )}s`}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                              
                              {job.status === 'completed' && job.downloadUrl && (
                                <Button size="sm" onClick={() => handleDownload(job)}>
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              )}
                              
                              {job.status === 'processing' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCancelJob(job.id)}
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              
                              {job.status === 'failed' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRetryJob(job.id)}
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>

                          {job.status === 'processing' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(job.progress)}%</span>
                              </div>
                              <Progress value={job.progress} className="h-2" />
                            </div>
                          )}

                          {job.error && (
                            <Alert className="border-red-200 bg-red-50">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{job.error}</AlertDescription>
                            </Alert>
                          )}

                          {job.size && (
                            <div className="text-sm text-muted-foreground">
                              File size: {job.size}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
                <CardDescription>
                  Configure default export behaviors and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Download</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically download files when export completes
                      </div>
                    </div>
                    <Switch
                      checked={settings.autoDownload}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        autoDownload: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Send email when exports complete or fail
                      </div>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        emailNotifications: checked
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Cloud Sync</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically sync exports to cloud storage
                      </div>
                    </div>
                    <Switch
                      checked={settings.cloudSync}
                      onCheckedChange={(checked) => setSettings(prev => ({
                        ...prev,
                        cloudSync: checked
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Features Overview */}
      <motion.div variants={cardVariants}>
        <Alert className="border-green-200 bg-green-50">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Advanced Export System:</strong> Multi-format batch exports with real-time 
            progress tracking, automated delivery options, cloud synchronization, and premium 
            quality settings for professional report distribution.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
