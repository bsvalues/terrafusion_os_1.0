import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getUploads } from '@/lib/api';
import { AIDashboard } from '@/components/ai/AIDashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Database, Loader2  } from '@mui/icons-material';
import { Upload } from '@/types';
import AIErrorBoundary from '@/components/ai/AIErrorBoundary';

export default function AIAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);

  // Get all uploads
  const { data: uploads, isLoading, error } = useQuery({
    queryKey: ['/api/uploads'],
    queryFn: getUploads,
  });

  // Set first upload as selected when data loads
  useEffect(() => {
    if (uploads && uploads.length > 0 && !selectedUploadId) {
      setSelectedUploadId(uploads[0].id);
    }
  }, [uploads, selectedUploadId]);

  const handleUploadChange = (value: string) => {
    setSelectedUploadId(Number(value));
  };

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center max-w-xs">
          <Database className="mr-2 h-5 w-5 text-muted-foreground" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading uploads...
            </div>
          ) : error ? (
            <span className="text-destructive">Error loading uploads</span>
          ) : uploads && uploads.length > 0 ? (
            <Select value={selectedUploadId?.toString()} onValueChange={handleUploadChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select an upload" />
              </SelectTrigger>
              <SelectContent
>
                {uploads.map((upload: Upload) => (
                  <SelectItem key={upload.id} value={upload.id.toString()}>
                    {upload.fileName} ({formatUploadDate(upload.processedAt)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground">No uploads available</span>
          )}
        </div>
      </div>

      {selectedUploadId ? (
        <AIErrorBoundary>
          <AIDashboard uploadId={selectedUploadId} />
        </AIErrorBoundary>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
          <Database className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Upload a permit spreadsheet to access AI-powered analytics.
          </p>
          <Button 
            className="mt-4"
            onClick={() => setLocation('/')}
          >
            Go to Upload Page
          </Button>
        </div>
      )}
    </div>
  );
}