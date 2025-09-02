import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Database, 
  AlertCircle, 
  CheckCircle2 
 } from '@mui/icons-material';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { useToast } from '@/hooks/use-toast';

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

type ExportFormat = 'pdf' | 'csv' | 'excel' | 'geojson';

interface ReportExporterProps {
  report: ReportMetadata;
}

export const ReportExporter = ({ report }: ReportExporterProps) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  // Check if export is available
  const exportQuery = useQuery({
    queryKey: [`/api/reports/${report.id}/exports/status`],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${report.id}/exports/status`);
      if (!response.ok) {
        throw new Error('Failed to check export status');
      }
      return response.json();
    }
  });
  
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Open export in new tab
      window.open(`/api/reports/${report.id}/exports/${format}`, '_blank');
      
      toast({
        title: 'Export Started',
        description: `Your ${format.toUpperCase()} export has started. Check your downloads.`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Failed to export as ${format.toUpperCase()}. Please try again.`,
        variant: 'destructive',
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 mr-2" />;
      case 'geojson':
        return <Database className="h-4 w-4 mr-2" />;
      default:
        return <Download className="h-4 w-4 mr-2" />;
    }
  };
  
  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'Export as a PDF document with formatting';
      case 'csv':
        return 'Export as CSV for spreadsheet applications';
      case 'excel':
        return 'Export as Excel spreadsheet with formatting';
      case 'geojson':
        return 'Export as GeoJSON for GIS applications';
      default:
        return '';
    }
  };
  
  if (exportQuery.isLoading) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Export Report</CardTitle>
          <CardDescription
</>
</>>Choose a format to export this report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <p>Checking export availability...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (exportQuery.isError) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Export Report</CardTitle>
          <CardDescription
</>
</>>Choose a format to export this report</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>
</>>
              Unable to check export availability. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Check if exports are supported for this report
  if (!exportQuery.data?.available) {
    return (
      <Card>
        <CardHeader><>

          <CardTitle>Export Report</CardTitle>
          <CardDescription
</>
</>>Choose a format to export this report</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Exports Not Available</AlertTitle>
            <AlertDescription
</>
</>>
              This report type does not support exports or exports are still being generated.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Export Report
          <IllustratedTooltip
            illustration={illustrations.report.export}
            title="Report Exporter"
            content={
              <div><>

                <p className="mb-1">• Download reports in various formats</p>
                <p
</>
className="mb-1">• PDF for sharing and printing</p><>

                <p className="mb-1">• CSV/Excel for data analysis</p>
                <p
</>
</>>• GeoJSON for GIS applications</p>
              </div>
            }
            position="right"
          />
        </CardTitle>
        <CardDescription>Choose a format to export this report</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
            <TabsTrigger value="pdf" className="flex items-center"><>

              <FileText className="h-4 w-4 mr-2" />
              PDF
            </TabsTrigger>
            <TabsTrigger
</>
value="csv" className="flex items-center"><>

              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </TabsTrigger>
            <TabsTrigger
</>
value="excel" className="flex items-center"><>

              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </TabsTrigger>
            <TabsTrigger
</>
value="geojson" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              GeoJSON
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 p-4 border rounded-md">
            <div className="flex items-center mb-2">
              {getFormatIcon(format)}
              <h3 className="font-medium">Export as {format.toUpperCase()}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {getFormatDescription(format)}
            </p>
            
            {exportQuery.data?.formats?.includes(format) ? (
              <Button 
                onClick={handleExport} 
                className="w-full sm:w-auto"
                disabled={isExporting}
              >
                {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                    Download {format.toUpperCase()}
                )}
              </Button>
            ) : (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" /><>

                <AlertTitle>Format Unavailable</AlertTitle>
                <AlertDescription
</>
</>>
                  The {format.toUpperCase()} format is not available for this report.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {exportQuery.data?.lastExport && (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" /><>

              <AlertTitle>Last Export</AlertTitle>
              <AlertDescription
</>
</>>
                You last exported this report as {exportQuery.data.lastExport.format.toUpperCase()} 
                on {new Date(exportQuery.data.lastExport.exportedAt).toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};