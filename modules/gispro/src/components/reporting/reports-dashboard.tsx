import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, 
  FileText, 
  Calendar, 
  Search, 
  Plus, 
  Clock, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Clock4, 
  Download,
  Refresh,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ClipboardList
 } from '@mui/icons-material';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { cn } from '@/lib/utils';
import { ReportGenerator } from './report-generator';
import { ReportScheduler } from './report-scheduler';

interface ReportMetadata {
  id: number;
  name: string;
  templateId: number;
  templateName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  totalRows?: number;
}

export const ReportsDashboard = () => {
  const [tab, setTab] = useState('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch reports
  const reportsQuery = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return response.json();
    },
    refetchInterval: tab === 'reports' ? 10000 : false // Auto-refresh if viewing reports tab
  });
  
  // Filter and sort reports
  const filteredReports = reportsQuery.data
    ? reportsQuery.data
        .filter((report: ReportMetadata) => {
          // Apply search filter
          if (searchTerm && !report.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
              !report.templateName.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
          }
          
          // Apply status filter
          if (statusFilter && report.status !== statusFilter) {
            return false;
          }
          
          return true;
        })
        // Sort by created date (newest first)
        .sort((a: ReportMetadata, b: ReportMetadata) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    : [];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </Badge>;
      case 'processing':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Refresh className="h-3 w-3 animate-spin" />
          <span>Processing</span>
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3" />
          <span>Completed</span>
        </Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          <span>Failed</span>
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Reports
            <IllustratedTooltip
              illustration={illustrations.report.general}
              title="Reports Dashboard"
              content={
                <div><>

                  <p className="mb-1">• View your reports and their status</p>
                  <p
</>
className="mb-1">• Generate new reports from templates</p><>

                  <p className="mb-1">• Schedule automated report generation</p>
                  <p
</>
</>>• Export reports in various formats</p>
                </div>
              }
              position="right"
            />
          </h2>
          <p className="text-muted-foreground">
            Generate, schedule, and view analytical reports
          </p>
        </div>
      </div>
      
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="reports"><>

            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger
</>
value="generate"><>

            <Plus className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger
</>
value="schedule">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><>

              <CardTitle>Reports List</CardTitle>
              <CardDescription
</>
</>>
                View and manage previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><>

                  <Input
                    placeholder="Search reports..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div
</>
className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1">
                        <Filter className="h-4 w-4" />
                        <span>Filter</span>
                        {statusFilter && (
                          <Badge variant="secondary" className="ml-1 px-1">1</Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setStatusFilter(null)}
                        className={cn(
                          "flex items-center gap-2",
                          statusFilter === null && "font-medium bg-accent"
                        )}
                      >
                        <ClipboardList className="h-4 w-4" />
                        <span>All Status</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setStatusFilter('pending')}
                        className={cn(
                          "flex items-center gap-2",
                          statusFilter === 'pending' && "font-medium bg-accent"
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        <span>Pending</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setStatusFilter('processing')}
                        className={cn(
                          "flex items-center gap-2",
                          statusFilter === 'processing' && "font-medium bg-accent"
                        )}
                      >
                        <Refresh className="h-4 w-4" />
                        <span>Processing</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setStatusFilter('completed')}
                        className={cn(
                          "flex items-center gap-2",
                          statusFilter === 'completed' && "font-medium bg-accent"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Completed</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setStatusFilter('failed')}
                        className={cn(
                          "flex items-center gap-2",
                          statusFilter === 'failed' && "font-medium bg-accent"
                        )}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Failed</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => reportsQuery.refetch()}
                    disabled={reportsQuery.isFetching}
                  >
                    <Refresh className={cn(
                      "h-4 w-4",
                      reportsQuery.isFetching && "animate-spin"
                    )} />
                  </Button>
                </div>
              </div>
              
              {reportsQuery.isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  <p>Loading reports...</p>
                </div>
              ) : reportsQuery.isError ? (
                <div className="flex items-center justify-center p-8 text-destructive">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <p>Failed to load reports</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center p-8 border rounded-md bg-muted/10">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" /><>

                  <h3 className="text-lg font-medium">No reports found</h3>
                  <p
</>
className="text-muted-foreground">
                    {searchTerm || statusFilter
                      ? "Try adjusting your filters or create a new report"
                      : "Start by generating a new report from the 'Generate' tab"}
                  </p>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow><>

                        <TableHead>Name</TableHead>
                        <TableHead
</>
</>>Template</TableHead><>

                        <TableHead>Status</TableHead>
                        <TableHead
</>
</>>Created</TableHead><>

                        <TableHead>Completed</TableHead>
                        <TableHead
</>
className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report: ReportMetadata) => (
                        <TableRow key={report.id}><>

                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell
</>
</>>{report.templateName}</TableCell><>

                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell
</>
className="whitespace-nowrap">
                            {format(parseISO(report.createdAt), 'MMM d, yyyy h:mm a')}
                          </TableCell><>

                          <TableCell className="whitespace-nowrap">
                            {report.completedAt 
                              ? format(parseISO(report.completedAt), 'MMM d, yyyy h:mm a')
                              : '-'
                            }
                          </TableCell>
                          <TableCell
</>
className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                disabled={report.status !== 'completed'}
                              >
                                <Link to={`/reports/${report.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    disabled={report.status !== 'completed'}
                                    asChild
                                  >
                                    <Link to={`/reports/${report.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      <span>View Report</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem
                                    disabled={report.status !== 'completed'}
                                    onClick={() => window.open(`/api/reports/${report.id}/exports/pdf`, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    <span>Download PDF</span>
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem
                                    disabled={report.status === 'processing'}
                                    onClick={() => reportsQuery.refetch()}
                                  >
                                    <Refresh className="h-4 w-4 mr-2" />
                                    <span>Refresh Status</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="generate"><>

          <ReportGenerator />
        </TabsContent>
        
        <TabsContent
</>
value="schedule">
          <ReportScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
};