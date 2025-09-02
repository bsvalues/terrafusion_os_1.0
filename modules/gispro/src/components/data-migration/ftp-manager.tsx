/**
 * FTP Manager Component
 * 
 * Provides UI for interacting with FTP server to migrate data.
 * Allows users to connect to an FTP server, browse directories,
 * upload and download files.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileIcon, FolderIcon, UploadIcon, DownloadIcon, RefreshIcon, PlusCircleIcon, TrashIcon, HomeIcon, FolderPlusIcon, ArrowLeftIcon, CheckIcon, XIcon, AlertCircleIcon  } from '@mui/icons-material';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { queryClient } from '@/lib/queryClient';
import { ftpConnect, ftpCreateDirectory, ftpDeleteFile, ftpListFiles, ftpStatus, ftpDisconnect } from '@/lib/api';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// FTP connection form schema
const ftpConnectSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.string().transform(val => val ? parseInt(val) : 21),
  user: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  secure: z.boolean().default(false)
});

// File type options
const fileTypes = [
  { id: 'shapefile', name: 'Shapefile' },
  { id: 'geojson', name: 'GeoJSON' },
  { id: 'csv', name: 'CSV Data' },
  { id: 'xml', name: 'XML Data' },
  { id: 'kml', name: 'KML File' },
  { id: 'parcel_data', name: 'Parcel Data' },
  { id: 'document', name: 'Document' },
  { id: 'image', name: 'Image' },
  { id: 'other', name: 'Other' }
];

// FTP file interface
interface FtpFile {
  name: string;
  type: number;
  size: number;
  date: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}

// FTP transfer status interface
interface TransferStatus {
  filename: string;
  bytesTransferred: number;
  totalBytes: number;
  percentComplete: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  type: string;
  direction: 'upload' | 'download';
  startTime: Date;
  endTime?: Date;
}

// API response interfaces
interface FtpStatusResponse {
  success: boolean;
  connected: boolean;
  transfers: TransferStatus[];
  message?: string;
}

interface FtpFilesResponse {
  success: boolean;
  path: string;
  files: FtpFile[];
  message?: string;
}

/**
 * Format bytes to human-readable form
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date in a more readable way
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

/**
 * FTP Manager Component
 */
export default function FtpManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Connection status
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Files and navigation
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FtpFile[]>([]);
  const [pathHistory, setPathHistory] = useState<string[]>(['/']);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // Transfers
  const [transfers, setTransfers] = useState<TransferStatus[]>([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [fileUploadType, setFileUploadType] = useState('other');
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // FTP connection form
  const connectForm = useForm<z.infer<typeof ftpConnectSchema>>({
    resolver: zodResolver(ftpConnectSchema),
    defaultValues: {
      host: 'ftp.spatialest.com',
      port: '21',
      user: '',
      password: '',
      secure: false
    }
  });
  
  /**
   * Connect to FTP server
   */
  const connectToFtp = async (values: z.infer<typeof ftpConnectSchema>) => {
    setConnecting(true);
    
    try {
      const response = await ftpConnect(
        values.host, 
        Number(values.port), 
        values.user, 
        values.password, 
        values.secure
      );
      
      if (response.success) {
        setConnected(true);
        toast({
          title: 'Connected',
          description: `Successfully connected to ${values.host}`,
        });
        loadFiles('/');
      } else {
        throw new Error(response.message || 'Failed to connect');
      }
    } catch (error) {
      console.error('FTP connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to FTP server',
        variant: 'destructive'
      });
    } finally {
      setConnecting(false);
    }
  };
  
  /**
   * Disconnect from FTP server
   */
  const disconnectFromFtp = async () => {
    try {
      const response = await ftpDisconnect();
      
      if (response.success) {
        setConnected(false);
        setFiles([]);
        setCurrentPath('/');
        setPathHistory(['/']);
        
        toast({
          title: 'Disconnected',
          description: 'Disconnected from FTP server',
        });
      } else {
        throw new Error(response.message || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('FTP disconnect error:', error);
      toast({
        title: 'Disconnect Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect from FTP server',
        variant: 'destructive'
      });
    }
  };
  
  /**
   * Load files from FTP server
   */
  const loadFiles = async (path: string) => {
    if (!connected) return;
    
    setLoadingFiles(true);
    
    try {
      const response = await ftpListFiles(path);
      
      if (response.success) {
        setFiles(response.files || []);
        setCurrentPath(path);
        
        // Add to path history if navigating forward
        if (!pathHistory.includes(path)) {
          setPathHistory(prev => [...prev, path]);
        }
        
        // Reset selection when changing directories
        setSelectedFiles([]);
      } else {
        throw new Error(response.message || 'Failed to load files');
      }
    } catch (error) {
      console.error('FTP list files error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load files',
        variant: 'destructive'
      });
    } finally {
      setLoadingFiles(false);
    }
  };
  
  /**
   * Navigate to a directory
   */
  const navigateToDirectory = (dirName: string) => {
    let newPath;
    
    if (dirName === '/') {
      // Go to root
      newPath = '/';
    } else if (dirName === '..') {
      // Go up one level
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      newPath = parts.length ? '/' + parts.join('/') : '/';
    } else {
      // Go into directory
      newPath = currentPath.endsWith('/')
        ? `${currentPath}${dirName}`
        : `${currentPath}/${dirName}`;
    }
    
    loadFiles(newPath);
  };
  
  /**
   * Go back in navigation history
   */
  const goBack = () => {
    if (pathHistory.length <= 1) return;
    
    const previousPath = pathHistory[pathHistory.length - 2];
    
    // Remove current path from history
    setPathHistory(prev => prev.slice(0, -1));
    
    // Load previous directory
    loadFiles(previousPath);
  };
  
  /**
   * Toggle file selection
   */
  const toggleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(name => name !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };
  
  /**
   * Create a new directory
   */
  const createDirectory = async () => {
    const dirName = prompt('Enter directory name:');
    
    if (!dirName) return;
    
    try {
      const newPath = currentPath.endsWith('/')
        ? `${currentPath}${dirName}`
        : `${currentPath}/${dirName}`;
        
      const response = await ftpCreateDirectory(newPath);
      
      if (response.success) {
        toast({
          title: 'Directory Created',
          description: `Created directory: ${dirName}`,
        });
        
        // Refresh file list
        loadFiles(currentPath);
      } else {
        throw new Error(response.message || 'Failed to create directory');
      }
    } catch (error) {
      console.error('Error creating directory:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create directory',
        variant: 'destructive'
      });
    }
  };
  
  /**
   * Delete selected files
   */
  const deleteSelectedFiles = async () => {
    if (!selectedFiles.length) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedFiles.length} item(s)?`);
    
    if (!confirmed) return;
    
    let successCount = 0;
    
    for (const fileName of selectedFiles) {
      try {
        const filePath = currentPath.endsWith('/')
          ? `${currentPath}${fileName}`
          : `${currentPath}/${fileName}`;
        
        const response = await ftpDeleteFile(filePath);
        
        if (response.success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error);
      }
    }
    
    if (successCount > 0) {
      toast({
        title: 'Files Deleted',
        description: `Successfully deleted ${successCount} item(s)`,
      });
      
      // Refresh file list
      loadFiles(currentPath);
      setSelectedFiles([]);
    } else {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete files',
        variant: 'destructive'
      });
    }
  };
  
  /**
   * Handle file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    // Use the first file (for now we only support single file upload)
    const file = files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remotePath', currentPath);
    formData.append('fileType', fileUploadType);
    
    toast({
      title: 'Uploading',
      description: `Uploading ${file.name}...`,
    });
    
    try {
      const response = await fetch('/api/ftp/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${file.name}`,
        });
        
        // Refresh file list
        loadFiles(currentPath);
        
        // Track the transfer
        if (data.transfer) {
          setTransfers(prev => [...prev, data.transfer]);
        }
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  /**
   * Download a file
   */
  const downloadFile = async (fileName: string) => {
    try {
      const filePath = currentPath.endsWith('/')
        ? `${currentPath}${fileName}`
        : `${currentPath}/${fileName}`;
      
      // Determine file type based on extension
      let fileType = 'OTHER';
      const ext = fileName.split('.').pop()?.toLowerCase();
      
      if (ext === 'shp' || ext === 'dbf' || ext === 'shx') fileType = 'SHAPEFILE';
      else if (ext === 'geojson') fileType = 'GEOJSON';
      else if (ext === 'csv') fileType = 'CSV';
      else if (ext === 'xml') fileType = 'XML';
      else if (ext === 'kml') fileType = 'KML';
      else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') fileType = 'DOCUMENT';
      else if (ext === 'jpg' || ext === 'png' || ext === 'gif') fileType = 'IMAGE';
      
      toast({
        title: 'Downloading',
        description: `Starting download of ${fileName}...`,
      });
      
      // Trigger direct download using window.location
      window.location.href = `/api/ftp/download?path=${encodeURIComponent(filePath)}&fileType=${fileType}`;
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive'
      });
    }
  };
  
  /**
   * Download selected files
   */
  const downloadSelectedFiles = async () => {
    if (!selectedFiles.length) return;
    
    for (const fileName of selectedFiles) {
      await downloadFile(fileName);
      
      // Small delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };
  
  /**
   * Check FTP connection status
   */
  const checkFtpStatus = useCallback(async () => {
    try {
      const response = await ftpStatus();
      
      setConnected(response.connected || false);
      
      if (response.transfers) {
        setTransfers(response.transfers);
      }
    } catch (error) {
      console.error('FTP status check error:', error);
      setConnected(false);
    }
  }, []);
  
  // Check FTP status on mount
  useEffect(() => {
    checkFtpStatus();
  }, [checkFtpStatus]);
  
  // Load files when connection status changes
  useEffect(() => {
    if (connected) {
      loadFiles('/');
    }
  }, [connected]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>FTP Data Migration</span>
          {connected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
              <CheckIcon size={14} /> Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect to ftp.spatialest.com to upload and download data files
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!connected ? (
          <Form {...connectForm}>
            <form onSubmit={connectForm.handleSubmit(connectToFtp)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={connectForm.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Host</FormLabel>
                      <FormControl
</>><>

                        <Input placeholder="ftp.spatialest.com" {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={connectForm.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Port</FormLabel>
                      <FormControl
</>><>

                        <Input placeholder="21" {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={connectForm.control}
                  name="user"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Username</FormLabel>
                      <FormControl
</>><>

                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={connectForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Password</FormLabel>
                      <FormControl
</>><>

                        <Input type="password" placeholder="password" {...field} />
                      </FormControl>
                      <FormMessage
</> />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={connectForm.control}
                name="secure"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pb-2">
                    <FormControl><>

                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div
</> className="space-y-1 leading-none"><>

                      <FormLabel>Use Secure Connection (FTPS)</FormLabel>
                      <FormDescription
</>>
                        Connect using explicit FTPS (FTP over TLS)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={connecting}>
                {connecting ? 'Connecting...' : 'Connect to FTP Server'}
              </Button>
            </form>
          </Form>
        ) : (
          <Tabs defaultValue="browse" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2"><>

              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger
</> value="transfers">Transfer Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="browse" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateToDirectory('/')}
                    title="Go to root directory"
                  ><>

                    <HomeIcon size={16} />
                  </Button>
                  
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={goBack}
                    disabled={pathHistory.length <= 1}
                    title="Go back"
                  ><>

                    <ArrowLeftIcon size={16} />
                  </Button>
                  
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={() => loadFiles(currentPath)}
                    title="Refresh"
                  >
                    <RefreshIcon size={16} />
                  </Button>
                </div><>

                
                <div className="flex-1 mx-2 px-3 py-1 text-sm truncate bg-muted rounded-md">
                  {currentPath}
                </div>
                
                <div
</> className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createDirectory}
                    title="Create Directory"
                  ><>

                    <FolderPlusIcon size={16} />
                  </Button>
                  
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload File"
                  ><>

                    <UploadIcon size={16} />
                  </Button>
                  
                  <input
</>
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              {/* File upload options */}
              <div className="flex items-center gap-2"><>

                <Label htmlFor="file-type" className="whitespace-nowrap">File Type:</Label>
                <select
</>
                  id="file-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium"
                  value={fileUploadType}
                  onChange={(e) => setFileUploadType(e.target.value)}
                >
                  {fileTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Toolbar for selected files */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center justify-between bg-muted p-2 rounded-md"><>

                  <span className="text-sm font-medium">{selectedFiles.length} item(s) selected</span>
                  
                  <div
</> className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSelectedFiles}
                      title="Download Selected"
                    ><>

                      <DownloadIcon size={16} className="mr-2" />
                      Download
                    </Button>
                    
                    <Button
</>
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedFiles}
                      title="Delete Selected"
                    >
                      <TrashIcon size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              
              {/* File list */}
              <ScrollArea className="h-[400px] rounded-md border">
                {loadingFiles ? (
                  <div className="flex justify-center items-center h-full">
                    <RefreshIcon className="animate-spin h-8 w-8 text-muted-foreground" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                    <FolderIcon size={48} strokeWidth={1} />
                    <p className="mt-2">This directory is empty</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {/* Go up one level */}
                    {currentPath !== '/' && (
                      <div 
                        className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                        onClick={() => navigateToDirectory('..')}
                      >
                        <FolderIcon size={18} className="text-blue-500" /><>

                        <span className="flex-1">..</span>
                        <span
</> className="text-sm text-muted-foreground">Parent Directory</span>
                      </div>
                    )}
                    
                    {/* Directory list */}
                    {files
                      .filter(file => file.isDirectory)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((file) => (
                        <div 
                          key={file.name}
                          className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                        >
                          <Checkbox 
                            checked={selectedFiles.includes(file.name)}
                            onCheckedChange={() => toggleFileSelection(file.name)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <FolderIcon size={18} className="text-blue-500" /><>

                          <span 
                            className="flex-1 truncate"
                            onClick={() => navigateToDirectory(file.name)}
                          >
                            {file.name}
                          </span>
                          <span
</> className="text-sm text-muted-foreground">
                            {formatDate(file.date)}
                          </span>
                        </div>
                      ))}
                    
                    {/* File list */}
                    {files
                      .filter(file => file.isFile)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((file) => (
                        <div 
                          key={file.name}
                          className="flex items-center gap-3 p-3 hover:bg-accent"
                        >
                          <Checkbox 
                            checked={selectedFiles.includes(file.name)}
                            onCheckedChange={() => toggleFileSelection(file.name)}
                          />
                          <FileIcon size={18} className="text-gray-500" /><>

                          <span className="flex-1 truncate">{file.name}</span>
                          <span
</> className="text-sm text-muted-foreground mr-4">
                            {formatBytes(file.size)}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => downloadFile(file.name)}
                                >
                                  <DownloadIcon size={16} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download File</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transfers">
              <ScrollArea className="h-[500px] rounded-md border p-4">
                {transfers.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                    <RefreshIcon size={48} strokeWidth={1} />
                    <p className="mt-2">No file transfers yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transfers.map((transfer /* , index */) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {transfer.direction === 'upload' ? (
                              <UploadIcon size={18} className="text-blue-500" />
                            ) : (
                              <DownloadIcon size={18} className="text-green-500" />
                            )}
                            <span className="font-medium">
                              {transfer.direction === 'upload' ? 'Upload' : 'Download'}
                            </span>
                          </div>
                          
                          <Badge
                            variant={
                              transfer.status === 'completed' 
                                ? 'default' 
                                : transfer.status === 'failed' 
                                  ? 'destructive' 
                                  : 'outline'
                            }
                          >
                            {transfer.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-2"><>

                          <p className="text-sm truncate font-medium">{transfer.filename}</p>
                          <p
</> className="text-xs text-muted-foreground">
                            Started: {formatDate(new Date(transfer.startTime))}
                            {transfer.endTime && (
                              <> • Ended: {formatDate(new Date(transfer.endTime))}</>
                            )}
                          </p>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1"><>

                            <span>
                              {formatBytes(transfer.bytesTransferred)} / {formatBytes(transfer.totalBytes)}
                            </span>
                            <span
</>>{Math.round(transfer.percentComplete)}%</span>
                          </div>
                          <Progress value={transfer.percentComplete} className="h-2" />
                        </div>
                        
                        {transfer.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircleIcon className="h-4 w-4" /><>

                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription
</> className="text-xs">
                              {transfer.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Connect to ftp.spatialest.com to migrate data between the server and BentonGeoPro
        </div>
        
        {connected && (
          <Button variant="outline" onClick={disconnectFromFtp}>
            <XIcon size={16} className="mr-2" />
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}