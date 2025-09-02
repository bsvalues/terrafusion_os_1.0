import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, FileText, Table, Map  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// The ReportFormat enum should match the server-side enum
export enum ReportFormat {
  PDF = 'pdf',
  GEOJSON = 'geojson',
  CSV = 'csv',
  SHAPEFILE = 'shapefile'
}

// Format descriptions
const formatDescriptions: Record<ReportFormat, { label: string, icon: React.ReactNode, description: string }> = {
  [ReportFormat.PDF]: {
    label: 'PDF Report',
    icon: <FileText className="h-4 w-4" />,
    description: 'Comprehensive document with result details and metadata'
  },
  [ReportFormat.GEOJSON]: {
    label: 'GeoJSON',
    icon: <Map className="h-4 w-4" />,
    description: 'Standard geospatial data format for use in GIS software'
  },
  [ReportFormat.CSV]: {
    label: 'CSV',
    icon: <Table className="h-4 w-4" />,
    description: 'Tabular data for spreadsheet applications'
  },
  [ReportFormat.SHAPEFILE]: {
    label: 'Shapefile',
    icon: <Map className="h-4 w-4" />,
    description: 'ESRI Shapefile format (coming soon)'
  }
};

interface ExportResultsDialogProps {
  open: boolean;
  onClose: () => void;
  analysisResult: any;
  defaultTitle?: string;
}

const ExportResultsDialog: React.FC<ExportResultsDialogProps> = ({
  open,
  onClose,
  analysisResult,
  defaultTitle = 'Geospatial Analysis Report'
}) => {
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [title, setTitle] = useState(defaultTitle);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!analysisResult) {
      toast({
        title: "No data to export",
        description: "Please perform an analysis first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);

      // Create a hidden form for file download
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/geospatial/generate-report';
      form.target = '_blank'; // Open in new tab/window
      form.style.display = 'none';

      // Add the analysis result as JSON
      const resultInput = document.createElement('input');
      resultInput.type = 'hidden';
      resultInput.name = 'result';
      resultInput.value = JSON.stringify(analysisResult);
      form.appendChild(resultInput);

      // Add the options as JSON
      const optionsInput = document.createElement('input');
      optionsInput.type = 'hidden';
      optionsInput.name = 'options';
      optionsInput.value = JSON.stringify({
        format,
        title,
        includeMetadata,
        includeTimestamp
      });
      form.appendChild(optionsInput);

      // Add the form to the body, submit it, and then remove it
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      toast({
        title: "Export Started",
        description: `Your ${formatDescriptions[format].label} is being generated`,
      });

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOneClickExport = async (selectedFormat: ReportFormat) => {
    if (!analysisResult) {
      toast({
        title: "No data to export",
        description: "Please perform an analysis first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);

      // Create a blob URL for the file download
      const response = await apiRequest('POST', '/api/geospatial/generate-report', {
        result: analysisResult,
        options: {
          format: selectedFormat,
          title: defaultTitle,
          includeMetadata: true,
          includeTimestamp: true
        }
      }, { responseType: 'blob' });

      // Get the filename from the Content-Disposition header if available
      let filename = `analysis-export.${selectedFormat}`;
      const contentDisposition = response.headers?.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob URL and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

      toast({
        title: "Export Complete",
        description: `Your ${formatDescriptions[selectedFormat].label} has been downloaded`,
      });
    } catch (error) {
      console.error("Quick export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><>

          <DialogTitle>Export Analysis Results</DialogTitle>
          <DialogDescription
</>
</>>
            Choose a format and customize your export options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2"><>

            <Label>Quick Export</Label>
            <div
</>
className="flex flex-wrap gap-2">
              {Object.entries(formatDescriptions).map(([key, { label, icon }]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={isExporting || key === ReportFormat.SHAPEFILE}
                  onClick={() => handleOneClickExport(key as ReportFormat)}
                >
                  {icon} {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2"><>

            <Label>Format</Label>
            <RadioGroup
</>
value={format} onValueChange={(value) => setFormat(value as ReportFormat)}>
              {Object.entries(formatDescriptions).map(([key, { label, icon, description }]) => (
                <div className="flex items-center space-x-2" key={key}>
                  <RadioGroupItem 
                    value={key} 
                    id={`format-${key}`}
                    disabled={key === ReportFormat.SHAPEFILE}
                  />
                  <Label 
                    htmlFor={`format-${key}`}
                    className={`flex items-center gap-2 ${key === ReportFormat.SHAPEFILE ? 'text-muted-foreground' : ''}`}
                  >
                    {icon} {label}
                    {key === ReportFormat.SHAPEFILE && <span className="text-xs bg-muted px-1 py-0.5 rounded">Coming Soon</span>}
                  </Label>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2"><>

            <Label htmlFor="report-title">Report Title</Label>
            <Input
</>

              id="report-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-metadata" 
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
              />
              <Label htmlFor="include-metadata">Include Analysis Metadata</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-timestamp" 
                checked={includeTimestamp}
                onCheckedChange={(checked) => setIncludeTimestamp(!!checked)}
              />
              <Label htmlFor="include-timestamp">Include Timestamp</Label>
            </div>
          </div>
        </div>

        <DialogFooter><>

          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
</>
onClick={handleExport} disabled={isExporting}>
            {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportResultsDialog;