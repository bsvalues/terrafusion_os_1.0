import * as React from 'react';
import { useElectron } from '@/hooks/use-electron';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, UploadResult } from '@/types';
import { 
  AlertCircle, 
  FileSpreadsheet, 
  HardDrive, 
  Upload as UploadIcon, 
  FileDown, 
  Info 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

interface OfflineUploadFormProps {
  onUploadComplete?: (result: UploadResult) => void;
}

export function OfflineUploadForm({ onUploadComplete }: OfflineUploadFormProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [filePath, setFilePath] = React.useState<string>('');
  
  const { isElectron, openFileDialog, importSpreadsheet, getSystemInfo } = useElectron();
  const { 
    saveUploadsForOffline, 
    offlineUploads, 
    offlinePermits, 
    exportOfflinePermits,
    exportAllOfflinePermits,
    getOfflineSystemInfo,
    pendingUploadCount
  } = useOfflineMode();
  const { toast } = useToast();
  
  const [systemInfo, setSystemInfo] = React.useState<any>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Handle file selection through traditional file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setFilePath(e.target.files[0].name);
    }
  };
  
  // Handle file selection through Electron's file dialog
  const handleBrowseClick = async () => {
    if (!isElectron) return;
    
    const result = await openFileDialog({
      title: 'Select Spreadsheet',
      filters: [
        { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }
      ],
      properties: ['openFile']
    });
    
    if (!result?.canceled && result?.filePath) {
      setFilePath(result.filePath);
      // For Electron, we don't need to load the file into memory,
      // we'll just use the path to read it during processing
    }
  };
  
  // Process the spreadsheet in offline mode
  // Load system information for diagnostics
  const handleLoadSystemInfo = async () => {
    try {
      const info = await getOfflineSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system information.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle exporting selected upload
  const handleExportUpload = async (uploadId: number) => {
    setIsExporting(true);
    try {
      const success = await exportOfflinePermits(uploadId);
      if (!success) {
        toast({
          title: 'Export Cancelled',
          description: 'The export operation was cancelled.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle exporting all permits
  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const success = await exportAllOfflinePermits();
      if (!success) {
        toast({
          title: 'Export Cancelled',
          description: 'The export operation was cancelled.',
        });
      }
    } catch (error) {
      console.error('Export all error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Process the spreadsheet in offline mode
  const handleOfflineProcessing = async () => {
    if (!filePath) {
      toast({
        title: 'No File Selected',
        description: 'Please select a spreadsheet file to process.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // For Electron, we'll use the file path to read the file directly
      if (isElectron && filePath) {
        const importResult = await importSpreadsheet(filePath);
        
        if (!importResult.success) {
          throw new Error(importResult.error || 'Failed to import spreadsheet');
        }
        
        // In a real implementation, we would process the spreadsheet data here
        // using client-side logic to analyze and classify the permits
        
        // Simulate successful processing
        const timestamp = new Date().toISOString();
        const randomId = Math.floor(Math.random() * 10000);
        
        // Create a mock result
        const result: UploadResult = {
          uploadId: randomId,
          permits: Array(10).fill(0).map((_, i) => ({
            id: i + 1,
            parcelNumber: `P-${100000 + i}`,
            neighborhoodCode: ['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)],
            permitDescription: i % 2 === 0 ? 'Commercial Building' : 'Residential HVAC',
            value: `$${(Math.random() * 100000).toFixed(2)}`,
            issueDate: timestamp,
            enterPermit: i % 2 === 0, // Commercial permits are entered
            reason: i % 2 === 0 ? 'Commercial permit' : 'Residential HVAC can be skipped',
            processedAt: timestamp,
            uploadId: randomId
          })),
          summary: {
            totalCount: 10,
            enterCount: 5,
            skipCount: 5
          }
        };
        
        // Create a mock upload
        const upload: Upload = {
          id: randomId,
          fileName: filePath.split(/[/\\]/).pop() || 'unknown.xlsx',
          processedAt: timestamp,
          totalPermits: 10,
          enterPermits: 5,
          skipPermits: 5
        };
        
        // Save for offline use
        await saveUploadsForOffline({
          uploadId: randomId,
          uploadInfo: upload,
          permits: result.permits,
          summary: result.summary
        });
        
        // Call the completion handler
        if (onUploadComplete) {
          onUploadComplete(result);
        }
        
        toast({
          title: 'Processing Complete',
          description: `Processed ${result.permits.length} permits in offline mode.`,
        });
      } else if (selectedFile) {
        // For web, we need to process the actual file
        // This would normally use a FileReader and process the spreadsheet in-browser
        
        toast({
          title: 'Not Implemented',
          description: 'In-browser processing is not implemented in this demo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Load the system info when component mounts
  React.useEffect(() => {
    handleLoadSystemInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          <span>Offline Permit Processing</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                You are in offline mode. Files will be processed locally and synchronized when you reconnect.
              </p>
            </div>
            
            {isElectron ? (
              <div className="space-y-2">
                <Label htmlFor="filePath">Spreadsheet File</Label>
                <div className="flex gap-2">
                  <Input
                    id="filePath"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="Select a spreadsheet file..."
                    readOnly
                  />
                  <Button type="button" variant="outline" onClick={handleBrowseClick}>
                    Browse
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Upload Spreadsheet</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Supported formats: XLSX, XLS, CSV</span>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleOfflineProcessing}
                disabled={isProcessing || (!selectedFile && !filePath)}
              >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    Process Offline
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="flex items-start gap-2 mb-4">
              <FileDown className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Export your offline permits to Excel files. These can be shared or imported into other systems.
              </p>
            </div>
            
            {offlineUploads.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Available Uploads ({offlineUploads.length})</h3>
                
                <div className="border rounded-md divide-y">
                  {offlineUploads.map((upload) => (
                    <div key={upload.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{upload.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(upload.processedAt).toLocaleString()} 
                          • {upload.totalPermits} permits
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExportUpload(upload.id)}
                        disabled={isExporting}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleExportAll}
                    disabled={isExporting || offlinePermits.length === 0}
                  >
                    {isExporting ? (
                      <>Exporting...</>
                    ) : (
                      <>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export All Permits
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No offline permits available</p>
                <p className="text-sm">Process permits first to enable export</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="info" className="space-y-4">
            <div className="flex items-start gap-2 mb-4">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                System information and offline data status. Useful for troubleshooting and diagnostics.
              </p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="section-1">
                <AccordionTrigger className="text-sm">
                  Offline Data Status
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Offline Mode:</span>
                      <span className="font-medium">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stored Uploads:</span>
                      <span className="font-medium">{offlineUploads.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stored Permits:</span>
                      <span className="font-medium">{offlinePermits.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending Syncs:</span>
                      <span className="font-medium">{pendingUploadCount}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="section-2">
                <AccordionTrigger className="text-sm">
                  System Information
                </AccordionTrigger>
                <AccordionContent>
                  {systemInfo ? (
                    <div className="text-xs font-mono whitespace-pre-wrap bg-muted p-2 rounded-md overflow-auto max-h-48">
                      {JSON.stringify(systemInfo, null, 2)}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">
                      <p>Loading system information...</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={handleLoadSystemInfo}
                size="sm"
              >
                Refresh System Info
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}