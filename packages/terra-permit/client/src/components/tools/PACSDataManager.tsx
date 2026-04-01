import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  FileOutput,
  Inbox,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * FormatDate utility function to format date strings
 */
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

/**
 * Component for managing PACS data integration
 * This includes staging import, export snapshots, and viewing logs
 */
export const PACSDataManager: React.FC = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importLogs, setImportLogs] = useState<any[]>([]);
  const [exportLogs, setExportLogs] = useState<any[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Handle file selection
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setValidationResult(null);
    setImportResult(null);
  };

  /**
   * Fetch import logs from the API
   */
  const fetchImportLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pacs/tools/import_logs');
      if (!response.ok) {
        throw new Error('Failed to fetch import logs');
      }
      const data = await response.json();
      setImportLogs(data);
    } catch (error) {
      console.error('Error fetching import logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch import logs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch export logs from the API
   */
  const fetchExportLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/pacs/tools/export_logs');
      if (!response.ok) {
        throw new Error('Failed to fetch export logs');
      }
      const data = await response.json();
      setExportLogs(data);
    } catch (error) {
      console.error('Error fetching export logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch export logs. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate the selected file before import
   */
  const validateFile = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to validate.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/pacs/tools/validate_property_values', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Validation failed');
      }
      
      setValidationResult(result);
      
      toast({
        title: result.valid ? 'Validation Successful' : 'Validation Failed',
        description: `File contains ${result.record_count} records with ${result.errors.length} errors.`,
        variant: result.valid ? 'default' : 'destructive',
      });
      
    } catch (error: any) {
      console.error('Error validating file:', error);
      toast({
        title: 'Validation Error',
        description: error.message || 'Failed to validate file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Import the validated file data
   */
  const importFile = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/pacs/tools/import_property_values', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.detail || 'Import failed');
      }
      
      setImportResult(result);
      
      toast({
        title: 'Import Completed',
        description: `Imported ${result.success_count} of ${result.total_records} records.`,
        variant: 'default',
      });
      
    } catch (error: any) {
      console.error('Error importing file:', error);
      toast({
        title: 'Import Error',
        description: error.message || 'Failed to import file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export data from the system
   */
  const exportData = async (format: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/pacs/tools/export_parcel_snapshot?format=${format}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Export failed');
      }
      
      // For proper file downloads, we need to process the response
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      if (format === 'json') {
        filename = `${filename}.json`;
      } else if (format === 'csv') {
        filename = `${filename}.csv`;
      } else if (format === 'xlsx') {
        filename = `${filename}.xlsx`;
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: `Data exported as ${format.toUpperCase()} file.`,
        variant: 'default',
      });
      
      // Refresh export logs after exporting
      fetchExportLogs();
      
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check the health status of the PACS service
   */
  const checkHealth = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/pacs/health');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Health check failed');
      }
      
      const result = await response.json();
      setHealthStatus(result);
      
    } catch (error: any) {
      console.error('Error checking health:', error);
      setHealthStatus({
        status: 'error',
        error: error.message || 'Failed to check service health',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load logs when component mounts
  useEffect(() => {
    fetchImportLogs();
    fetchExportLogs();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>PACS Data Manager</CardTitle>
        <CardDescription>Manage property value imports and exports for PACS integration</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import">
          <TabsList className="mb-4">
            <TabsTrigger value="import">Data Import</TabsTrigger>
            <TabsTrigger value="import-logs">Import Logs</TabsTrigger>
            <TabsTrigger value="export-logs">Export Logs</TabsTrigger>
            <TabsTrigger value="health">Health Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={validateFile}
                    disabled={!file || isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Validate
                  </Button>
                  
                  <Button
                    onClick={importFile}
                    disabled={!file || isLoading || (validationResult && !validationResult.valid)}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Import
                  </Button>
                </div>
              </div>
              
              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Validation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Badge variant={validationResult.valid ? "default" : "destructive"}>
                          {validationResult.valid ? "Valid" : "Invalid"}
                        </Badge>
                        <span className="ml-2">Records: {validationResult.record_count}</span>
                      </div>
                      
                      {validationResult.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium">Errors ({validationResult.errors.length})</h4>
                          <ul className="text-sm space-y-1 mt-1">
                            {validationResult.errors.slice(0, 5).map((err: any, i: number) => (
                              <li key={i} className="text-destructive">
                                {err.message || err.reason || JSON.stringify(err)}
                              </li>
                            ))}
                            {validationResult.errors.length > 5 && (
                              <li className="text-muted-foreground">
                                ...and {validationResult.errors.length - 5} more errors
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.warnings.length > 0 && (
                        <div>
                          <h4 className="font-medium">Warnings ({validationResult.warnings.length})</h4>
                          <ul className="text-sm space-y-1 mt-1">
                            {validationResult.warnings.slice(0, 5).map((warn: any, i: number) => (
                              <li key={i} className="text-amber-500">
                                {warn.message || warn.reason || JSON.stringify(warn)}
                              </li>
                            ))}
                            {validationResult.warnings.length > 5 && (
                              <li className="text-muted-foreground">
                                ...and {validationResult.warnings.length - 5} more warnings
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Import Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium">Status</p>
                          <Badge 
                            variant={
                              importResult.status === 'completed' ? "default" : 
                              importResult.status === 'failed' ? "destructive" : 
                              "secondary"
                            }
                          >
                            {importResult.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Import ID</p>
                          <p className="text-sm">{importResult.import_id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Records</p>
                          <p className="text-sm">{importResult.total_records}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Processed</p>
                          <p className="text-sm">{importResult.processed_records}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Success</p>
                          <p className="text-sm text-green-600">{importResult.success_count}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Errors</p>
                          <p className="text-sm text-red-600">{importResult.error_count}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="import-logs">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Import Logs</h3>
                <div className="flex items-center gap-2">
                  <Select 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        fetchImportLogs();
                        return;
                      }
                      
                      setIsLoading(true);
                      fetch(`/api/pacs/tools/import_logs?status=${value}`)
                        .then(response => response.json())
                        .then(data => {
                          setImportLogs(data);
                          setIsLoading(false);
                        })
                        .catch(error => {
                          console.error('Error fetching filtered logs:', error);
                          setIsLoading(false);
                          toast({
                            title: 'Error',
                            description: 'Failed to filter logs',
                            variant: 'destructive',
                          });
                        });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchImportLogs}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                  </Button>
                </div>
              </div>

              {importLogs.length > 0 ? (
                <div>
                  <Table>
                    <TableCaption>Recent import operations</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importLogs.map((log) => (
                        <TableRow key={log.import_id}>
                          <TableCell>{log.import_id}</TableCell>
                          <TableCell>{log.import_type}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                log.status === 'completed' ? "default" : 
                                log.status === 'failed' ? "destructive" : 
                                "secondary"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.total_records}</TableCell>
                          <TableCell>{log.success_count}/{log.total_records}</TableCell>
                          <TableCell>{formatDate(log.started_at)}</TableCell>
                          <TableCell>{log.completed_at ? formatDate(log.completed_at) : 'In progress'}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  View Details
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Import Log Details</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-4 py-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-sm font-medium">Import ID</p>
                                          <p className="text-sm">{log.import_id}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Status</p>
                                          <Badge 
                                            variant={
                                              log.status === 'completed' ? "default" : 
                                              log.status === 'failed' ? "destructive" : 
                                              "secondary"
                                            }
                                          >
                                            {log.status}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Import Type</p>
                                          <p className="text-sm">{log.import_type}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Started At</p>
                                          <p className="text-sm">{formatDate(log.started_at)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Completed At</p>
                                          <p className="text-sm">{log.completed_at ? formatDate(log.completed_at) : 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Total Records</p>
                                          <p className="text-sm">{log.total_records}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Success Count</p>
                                          <p className="text-sm text-green-600">{log.success_count}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Error Count</p>
                                          <p className="text-sm text-red-600">{log.error_count}</p>
                                        </div>
                                      </div>
                                      {log.notes && (
                                        <div>
                                          <p className="text-sm font-medium">Notes</p>
                                          <p className="text-sm">{log.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Showing {importLogs.length} logs. Use filters to narrow results.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No import logs found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import logs will appear here after you import data
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="export-logs">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Export Logs</h3>
                <div className="flex items-center gap-2">
                  <Select 
                    onValueChange={(value) => {
                      if (value === 'all') {
                        fetchExportLogs();
                        return;
                      }
                      
                      setIsLoading(true);
                      fetch(`/api/pacs/tools/export_logs?status=${value}`)
                        .then(response => response.json())
                        .then(data => {
                          setExportLogs(data);
                          setIsLoading(false);
                        })
                        .catch(error => {
                          console.error('Error fetching filtered logs:', error);
                          setIsLoading(false);
                          toast({
                            title: 'Error',
                            description: 'Failed to filter logs',
                            variant: 'destructive',
                          });
                        });
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchExportLogs}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('csv')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('json')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('xlsx')}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export Excel
                </Button>
              </div>

              {exportLogs.length > 0 ? (
                <div>
                  <Table>
                    <TableCaption>Recent export operations</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exportLogs.map((log) => (
                        <TableRow key={log.export_id}>
                          <TableCell>{log.export_id}</TableCell>
                          <TableCell>{log.export_type}</TableCell>
                          <TableCell>{log.format}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                log.status === 'completed' ? "default" : 
                                log.status === 'failed' ? "destructive" : 
                                "secondary"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.record_count}</TableCell>
                          <TableCell>{formatDate(log.started_at)}</TableCell>
                          <TableCell>{log.completed_at ? formatDate(log.completed_at) : 'In progress'}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  View Details
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Export Log Details</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-4 py-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <p className="text-sm font-medium">Export ID</p>
                                          <p className="text-sm">{log.export_id}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Status</p>
                                          <Badge 
                                            variant={
                                              log.status === 'completed' ? "default" : 
                                              log.status === 'failed' ? "destructive" : 
                                              "secondary"
                                            }
                                          >
                                            {log.status}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Export Type</p>
                                          <p className="text-sm">{log.export_type}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Format</p>
                                          <p className="text-sm">{log.format.toUpperCase()}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Started At</p>
                                          <p className="text-sm">{formatDate(log.started_at)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Completed At</p>
                                          <p className="text-sm">{log.completed_at ? formatDate(log.completed_at) : 'N/A'}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Record Count</p>
                                          <p className="text-sm">{log.record_count}</p>
                                        </div>
                                      </div>
                                      {log.notes && (
                                        <div>
                                          <p className="text-sm font-medium">Notes</p>
                                          <p className="text-sm">{log.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Showing {exportLogs.length} logs. Use filters to narrow results.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No export logs found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export logs will appear here after you export data
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="health">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">PACS Service Health</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkHealth}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                  Check Health
                </Button>
              </div>

              {healthStatus ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Badge 
                          variant={healthStatus.status === 'healthy' ? "default" : "destructive"}
                          className="mr-2"
                        >
                          {healthStatus.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm">
                          {healthStatus.timestamp ? `Last checked: ${formatDate(healthStatus.timestamp)}` : ''}
                        </span>
                      </div>

                      {healthStatus.details && (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(healthStatus.details).map(([key, value]: [string, any]) => (
                            <div key={key}>
                              <p className="text-sm font-medium capitalize">{key.replace('_', ' ')}</p>
                              <p className="text-sm">{value?.toString() || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {healthStatus.error && (
                        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                          {healthStatus.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Health status not available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Check Health" to see the current status of the PACS service
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          This tool interacts with the PACS API microservice for property value management.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PACSDataManager;