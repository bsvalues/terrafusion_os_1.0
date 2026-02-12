import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Eye,
  Edit,
  Trash2,
  Plus,
  Settings,
  RefreshCw,
  Share2,
  Printer,
  FileSpreadsheet,
  FilePdf,
  Activity,
  Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Types
interface ReportMetadata {
  id: string;
  title: string;
  description: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  size: string;
  downloads: number;
  type: 'financial' | 'operational' | 'compliance' | 'analytics';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  isCustomizable: boolean;
  lastUsed?: string;
}

interface ReportStats {
  totalReports: number;
  publishedReports: number;
  draftReports: number;
  totalDownloads: number;
  avgGenerationTime: number;
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

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

export default function ReportsDashboard() {
  // State management
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample data
  const sampleReports: ReportMetadata[] = [
    {
      id: 'rpt-001',
      title: 'Monthly GIS Usage Report',
      description: 'Comprehensive analysis of GIS system usage and performance metrics',
      templateName: 'Usage Analytics',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: 'John Smith',
      status: 'published',
      size: '2.4 MB',
      downloads: 45,
      type: 'analytics'
    },
    {
      id: 'rpt-002',
      title: 'Property Assessment Summary',
      description: 'Quarterly property valuation and assessment report',
      templateName: 'Assessment Report',
      createdAt: '2024-01-14T15:45:00Z',
      updatedAt: '2024-01-14T16:20:00Z',
      createdBy: 'Sarah Johnson',
      status: 'published',
      size: '5.1 MB',
      downloads: 78,
      type: 'financial'
    },
    {
      id: 'rpt-003',
      title: 'Compliance Audit Results',
      description: 'Annual compliance audit findings and recommendations',
      templateName: 'Audit Template',
      createdAt: '2024-01-13T09:15:00Z',
      updatedAt: '2024-01-13T11:30:00Z',
      createdBy: 'Mike Davis',
      status: 'draft',
      size: '3.7 MB',
      downloads: 12,
      type: 'compliance'
    },
    {
      id: 'rpt-004',
      title: 'Operational Efficiency Metrics',
      description: 'Daily operational performance and efficiency analysis',
      templateName: 'Operations Dashboard',
      createdAt: '2024-01-12T14:20:00Z',
      updatedAt: '2024-01-12T14:20:00Z',
      createdBy: 'Lisa Chen',
      status: 'published',
      size: '1.8 MB',
      downloads: 23,
      type: 'operational'
    }
  ];

  const sampleTemplates: ReportTemplate[] = [
    {
      id: 'tpl-001',
      name: 'Usage Analytics',
      description: 'Track system usage, user activity, and performance metrics',
      category: 'Analytics',
      fields: ['Users', 'Sessions', 'Features Used', 'Performance'],
      isCustomizable: true,
      lastUsed: '2024-01-15T10:30:00Z'
    },
    {
      id: 'tpl-002',
      name: 'Assessment Report',
      description: 'Property valuation and assessment documentation',
      category: 'Financial',
      fields: ['Property ID', 'Valuation', 'Assessment Date', 'Notes'],
      isCustomizable: true,
      lastUsed: '2024-01-14T15:45:00Z'
    },
    {
      id: 'tpl-003',
      name: 'Audit Template',
      description: 'Compliance audit findings and recommendations',
      category: 'Compliance',
      fields: ['Audit Items', 'Findings', 'Risk Level', 'Actions'],
      isCustomizable: false,
      lastUsed: '2024-01-13T09:15:00Z'
    }
  ];

  // Initialize data
  useEffect(() => {
    setReports(sampleReports);
    setTemplates(sampleTemplates);
  }, []);

  // Calculate statistics
  const stats: ReportStats = {
    totalReports: reports.length,
    publishedReports: reports.filter(r => r.status === 'published').length,
    draftReports: reports.filter(r => r.status === 'draft').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.downloads, 0),
    avgGenerationTime: 4.2
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Report actions
  const handleGenerateReport = (templateId: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      console.log(`Generated report from template: ${templateId}`);
    }, 3000);
  };

  const handleDownloadReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, downloads: r.downloads + 1 } : r
      ));
      console.log(`Downloaded report: ${report.title}`);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getStatusColor = (status: ReportMetadata['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ReportMetadata['type']) => {
    switch (type) {
      case 'financial':
        return 'bg-blue-100 text-blue-800';
      case 'operational':
        return 'bg-purple-100 text-purple-800';
      case 'compliance':
        return 'bg-red-100 text-red-800';
      case 'analytics':
        return 'bg-green-100 text-green-800';
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
          Reports Dashboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Generate, manage, and analyze comprehensive reports with automated 
          templates and real-time data visualization.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <BarChart3 className="h-3 w-3" />
            Advanced Analytics
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Auto Generation
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Real-time Data
          </Badge>
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
        variants={cardVariants}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              All report documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.publishedReports}</div>
            <p className="text-xs text-muted-foreground">
              Ready for distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.draftReports}</div>
            <p className="text-xs text-muted-foreground">
              In development
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Total downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgGenerationTime}s</div>
            <p className="text-xs text-muted-foreground">
              Generation time
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={cardVariants}>
        <Tabs defaultValue="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-auto grid-cols-3">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Report Library</CardTitle>
                    <CardDescription>
                      Manage and organize your generated reports
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                      <Button size="sm" variant="outline">
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                      
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="all">All Types</option>
                        <option value="financial">Financial</option>
                        <option value="operational">Operational</option>
                        <option value="compliance">Compliance</option>
                        <option value="analytics">Analytics</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground">
                      No reports match your current filters. Try adjusting your search criteria.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Downloads</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredReports.map((report: ReportMetadata) => (
                            <motion.tr
                              key={report.id}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit={{ opacity: 0, x: 20 }}
                              className="group"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{report.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {report.description}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{report.templateName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getTypeColor(report.type)}>
                                  {report.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(parseISO(report.createdAt), 'MMM d, yyyy h:mm a')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  by {report.createdBy}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Download className="h-3 w-3" />
                                  {report.downloads}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => console.log('View report:', report.id)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleDownloadReport(report.id)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => console.log('Share report:', report.id)}
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleDeleteReport(report.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>
                  Select a template and customize your report parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          {template.isCustomizable && (
                            <Badge variant="outline" className="text-xs">
                              Customizable
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium mb-1">Category</div>
                            <Badge variant="outline">{template.category}</Badge>
                          </div>
                          
                          <div>
                            <div className="text-sm font-medium mb-1">Fields</div>
                            <div className="flex flex-wrap gap-1">
                              {template.fields.slice(0, 3).map((field, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                              {template.fields.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.fields.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          {template.lastUsed && (
                            <div className="text-xs text-muted-foreground">
                              Last used: {format(parseISO(template.lastUsed), 'MMM d, yyyy')}
                            </div>
                          )}

                          <Button 
                            className="w-full" 
                            onClick={() => handleGenerateReport(template.id)}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-2" />
                                Generate Report
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>
                  Automate report generation with custom schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No scheduled reports</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up automated report generation to save time and ensure consistency.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Features Overview */}
      <motion.div variants={cardVariants}>
        <Alert className="border-blue-200 bg-blue-50">
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            <strong>Advanced Reporting:</strong> Generate comprehensive reports from templates, 
            schedule automated generation, export in multiple formats, and track usage analytics 
            with real-time data integration.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
