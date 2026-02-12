import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { File, X, Download, Edit, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileData {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  path: string;
  created: Date;
  lastModified: Date;
}

interface FilePreviewProps {
  file?: FileData;
  data?: FileData;
  className?: string;
  onClose: () => void;
  onEdit?: (fileId: string) => void;
  onDownload?: (fileId: string) => void;
  onShare?: (fileId: string) => void;
}

export function FilePreview({
  file,
  data,
  className,
  onClose,
  onEdit,
  onDownload,
  onShare
}: FilePreviewProps) {
  const [currentView, setCurrentView] = useState<'preview' | 'metadata'>('preview');

  const mockData: FileData = {
    id: 'mock-file',
    name: 'TerraFusion Sync Document.pdf',
    type: 'Document',
    mimeType: 'application/pdf',
    size: 2048576,
    path: '/documents/terrafusion/',
    created: new Date('2025-01-01'),
    lastModified: new Date('2025-01-06')
  };

  const fileData = file || data || mockData;

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh]", className)}>
        <DialogHeader className="flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <File className="h-6 w-6 text-blue-500" />
            <div>
              <DialogTitle className="text-lg font-semibold">{fileData.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(fileData.size)} • {fileData.type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg p-1">
              <button
                onClick={() => setCurrentView('preview')}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  currentView === 'preview'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                Preview
              </button>
              <button
                onClick={() => setCurrentView('metadata')}
                className={cn(
                  'px-3 py-1 rounded text-sm transition-colors',
                  currentView === 'metadata'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                Metadata
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              {onDownload && (
                <Button variant="outline" size="sm" onClick={() => onDownload(fileData.id)}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(fileData.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onShare && (
                <Button variant="outline" size="sm" onClick={() => onShare(fileData.id)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {currentView === 'preview' ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center min-h-96 flex items-center justify-center">
              <div>
                <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">File Preview</h3>
                <p className="text-muted-foreground mb-4">
                  {fileData.name} • {formatFileSize(fileData.size)}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    Open in New Tab
                  </Button>
                  {onDownload && (
                    <Button onClick={() => onDownload(fileData.id)}>
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">File Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium">{fileData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="font-medium">{fileData.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Size</label>
                    <p className="font-medium">{formatFileSize(fileData.size)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Path</label>
                    <p className="font-medium text-xs">{fileData.path}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-medium">{fileData.created.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Modified</label>
                    <p className="font-medium">{fileData.lastModified.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FilePreview;
