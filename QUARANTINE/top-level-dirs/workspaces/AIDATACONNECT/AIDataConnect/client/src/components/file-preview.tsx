import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileIcon, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  FileCode, 
  FileJson, 
  FileAudio, 
  FileVideo, 
  File as FileDocument,
  Download,
  Eye,
  Layers,
  Info,
  Calendar
} from "lucide-react";
import type { File } from "@shared/schema";

interface FilePreviewProps {
  file: File;
}

export function FilePreview({ file }: FilePreviewProps) {
  const [openDetails, setOpenDetails] = useState(false);
  
  // Determine the file icon based on file type
  const getFileIcon = () => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (type.includes('pdf')) return <FileDocument className="h-8 w-8 text-red-500" />;
    if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel') || type.includes('xls')) 
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (type.includes('code') || type.includes('javascript') || type.includes('typescript') || type.includes('html') || type.includes('css')) 
      return <FileCode className="h-8 w-8 text-yellow-500" />;
    if (type.includes('json')) return <FileJson className="h-8 w-8 text-orange-500" />;
    if (type.includes('audio')) return <FileAudio className="h-8 w-8 text-purple-500" />;
    if (type.includes('video')) return <FileVideo className="h-8 w-8 text-pink-500" />;
    if (type.includes('text')) return <FileText className="h-8 w-8 text-gray-500" />;
    return <FileIcon className="h-8 w-8 text-muted-foreground" />;
  };

  // Generate a preview based on file type
  const renderPreview = () => {
    const type = file.type.toLowerCase();
    
    if (type.includes('image')) {
      return (
        <div className="flex justify-center p-2 bg-muted/20 rounded-md">
          <img 
            src={`/uploads/${file.path}`} 
            alt={file.name} 
            className="max-h-[200px] object-contain rounded-md" 
          />
        </div>
      );
    }
    
    if (type.includes('text') || type.includes('code') || type.includes('json')) {
      return (
        <div className="p-3 bg-muted/20 rounded-md max-h-[200px] overflow-auto text-sm font-mono">
          <code>Preview not available in card view. Click "View Details" to see file content.</code>
        </div>
      );
    }
    
    if (type.includes('pdf')) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-md h-[150px]">
          <FileDocument className="h-12 w-12 text-red-500 mb-2" />
          <p className="text-sm text-center">PDF document preview available in detailed view</p>
        </div>
      );
    }
    
    if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel') || type.includes('xls')) {
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-md h-[150px]">
          <FileSpreadsheet className="h-12 w-12 text-green-500 mb-2" />
          <p className="text-sm text-center">Spreadsheet data available in detailed view</p>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-muted/20 rounded-md h-[150px]">
        {getFileIcon()}
        <p className="text-sm text-center mt-2">Preview not available for this file type</p>
      </div>
    );
  };

  // Detailed metadata view
  const renderMetadata = () => {
    const metadata = file.metadata || {};
    
    return (
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="col-span-2 md:col-span-1">
            <span className="font-medium">{key}: </span>
            <span className="text-muted-foreground">{value?.toString() || 'N/A'}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4">
        {getFileIcon()}
        <div className="flex-1 truncate">
          <CardTitle className="text-lg truncate" title={file.name}>{file.name}</CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{file.type}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderPreview()}
        
        {file.aiSummary && (
          <div>
            <h4 className="font-medium mb-1 flex items-center">
              <Info className="w-4 h-4 mr-1" /> 
              AI Summary
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-3">{file.aiSummary}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center space-x-2">
          {file.category && <Badge variant="outline">{file.category}</Badge>}
          {file.createdAt && (
            <span className="text-xs text-muted-foreground flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(file.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" /> View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-[90vw] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon()}
                <span className="truncate">{file.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="preview" className="mt-4">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="p-2">
                <div className="bg-muted/20 rounded-md p-4 min-h-[300px] flex items-center justify-center">
                  {/* Extended preview would go here, different for each file type */}
                  <div className="text-center p-4">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p>Detailed preview available based on file type</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Integration with specialized viewers for different file formats
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metadata">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-3">File Information</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <span className="font-medium">Name: </span>
                      <span className="text-muted-foreground">{file.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Size: </span>
                      <span className="text-muted-foreground">{formatBytes(file.size)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type: </span>
                      <span className="text-muted-foreground">{file.type}</span>
                    </div>
                    <div>
                      <span className="font-medium">Created: </span>
                      <span className="text-muted-foreground">
                        {file.createdAt ? new Date(file.createdAt).toLocaleString() : 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Path: </span>
                      <span className="text-muted-foreground">{file.path}</span>
                    </div>
                    <div>
                      <span className="font-medium">Category: </span>
                      <span className="text-muted-foreground">{file.category || 'Uncategorized'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Transfer Type: </span>
                      <span className="text-muted-foreground">{file.transferType || 'local'}</span>
                    </div>
                  </div>
                  
                  {file.metadata && Object.keys(file.metadata).length > 0 && (
                    <>
                      <h3 className="text-lg font-medium mt-6 mb-3">Extended Metadata</h3>
                      {renderMetadata()}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analysis">
                <div className="rounded-md border p-4">
                  <h3 className="text-lg font-medium mb-3">AI Generated Summary</h3>
                  {file.aiSummary ? (
                    <p className="text-sm leading-relaxed">{file.aiSummary}</p>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      <p>No AI analysis available for this file</p>
                    </div>
                  )}
                  
                  {/* Example visual stats about the file - would be dynamic in a real implementation */}
                  <h3 className="text-lg font-medium mt-6 mb-3">Content Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Relevance Score</span>
                        <span>78%</span>
                      </div>
                      <Progress value={78} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Quality</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Processing Status</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" className="mr-2" onClick={() => setOpenDetails(false)}>
                Close
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}