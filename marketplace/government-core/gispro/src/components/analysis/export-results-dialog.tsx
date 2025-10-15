import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Table, 
  Map, 
  BarChart3, 
  Image, 
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
  FileDown,
  Layers
} from '@mui/icons-material';

interface ExportResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResults: any;
  analysisType: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: React.ReactNode;
  supportsData: boolean;
  supportsVisuals: boolean;
  fileSize: string;
}

interface ExportOptions {
  format: string;
  includeRawData: boolean;
  includeVisualizations: boolean;
  includeMetadata: boolean;
  includeStatistics: boolean;
  customFileName: string;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  dataQuality: 'full' | 'summary' | 'key-points';
  visualFormat: 'png' | 'svg' | 'pdf' | 'interactive';
}

const ExportResultsDialog: React.FC<ExportResultsDialogProps> = ({
  open,
  onOpenChange,
  analysisResults,
  analysisType
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeRawData: true,
    includeVisualizations: true,
    includeMetadata: true,
    includeStatistics: true,
    customFileName: '',
    compressionLevel: 'medium',
    dataQuality: 'full',
    visualFormat: 'png'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'preparing' | 'exporting' | 'complete' | 'error'>('idle');
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'summary',
    'methodology',
    'results',
    'visualizations',
    'recommendations'
  ]);

  // Available export formats
  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Comprehensive PDF document with charts and tables',
      extension: '.pdf',
      icon: <FileText className="h-4 w-4" />,
      supportsData: true,
      supportsVisuals: true,
      fileSize: '2-5 MB'
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Spreadsheet with multiple sheets for different data types',
      extension: '.xlsx',
      icon: <Table className="h-4 w-4" />,
      supportsData: true,
      supportsVisuals: false,
      fileSize: '500 KB - 2 MB'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Comma-separated values for raw data export',
      extension: '.csv',
      icon: <Database className="h-4 w-4" />,
      supportsData: true,
      supportsVisuals: false,
      fileSize: '100 KB - 1 MB'
    },
    {
      id: 'geojson',
      name: 'GeoJSON',
      description: 'Geographic data in JSON format',
      extension: '.geojson',
      icon: <Map className="h-4 w-4" />,
      supportsData: true,
      supportsVisuals: false,
      fileSize: '200 KB - 3 MB'
    },
    {
      id: 'html',
      name: 'Interactive HTML',
      description: 'Web-based interactive report with embedded charts',
      extension: '.html',
      icon: <BarChart3 className="h-4 w-4" />,
      supportsData: true,
      supportsVisuals: true,
      fileSize: '1-3 MB'
    },
    {
      id: 'images',
      name: 'Image Package',
      description: 'ZIP file containing all visualizations as images',
      extension: '.zip',
      icon: <Image className="h-4 w-4" />,
      supportsData: false,
      supportsVisuals: true,
      fileSize: '500 KB - 5 MB'
    }
  ];

  // Report sections
  const reportSections = [
    { id: 'summary', name: 'Executive Summary', description: 'High-level overview and key findings' },
    { id: 'methodology', name: 'Methodology', description: 'Analysis methods and parameters used' },
    { id: 'results', name: 'Detailed Results', description: 'Complete analysis results and data' },
    { id: 'visualizations', name: 'Charts & Graphs', description: 'All generated visualizations' },
    { id: 'rawdata', name: 'Raw Data', description: 'Source data and calculations' },
    { id: 'statistics', name: 'Statistical Analysis', description: 'Statistical summaries and metrics' },
    { id: 'recommendations', name: 'Recommendations', description: 'Actionable insights and next steps' },
    { id: 'appendix', name: 'Technical Appendix', description: 'Technical details and references' }
  ];

  // Generate default filename
  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const type = analysisType.replace(/\s+/g, '-').toLowerCase();
    return `${type}-analysis-${timestamp}`;
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('preparing');
    setExportProgress(0);

    try {
      // Simulate export process
      const steps = [
        { status: 'preparing', progress: 10, message: 'Preparing export...' },
        { status: 'exporting', progress: 30, message: 'Processing data...' },
        { status: 'exporting', progress: 50, message: 'Generating visualizations...' },
        { status: 'exporting', progress: 70, message: 'Creating report...' },
        { status: 'exporting', progress: 90, message: 'Finalizing export...' },
        { status: 'complete', progress: 100, message: 'Export complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setExportStatus(step.status as any);
        setExportProgress(step.progress);
      }

      // Simulate file download
      const fileName = exportOptions.customFileName || generateFileName();
      const selectedFormat = exportFormats.find(f => f.id === exportOptions.format);
      const fullFileName = `${fileName}${selectedFormat?.extension}`;

      // Create a mock download
      const blob = new Blob(['Mock export data'], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fullFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setIsExporting(false);
        setExportStatus('idle');
        setExportProgress(0);
        onOpenChange(false);
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setIsExporting(false);
    }
  };

  // Update export options
  const updateOptions = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Get selected format details
  const selectedFormat = exportFormats.find(f => f.id === exportOptions.format);

  // Calculate estimated file size
  const calculateFileSize = () => {
    let baseSize = 1; // MB
    if (exportOptions.includeRawData) baseSize += 2;
    if (exportOptions.includeVisualizations) baseSize += 3;
    if (exportOptions.dataQuality === 'full') baseSize *= 1.5;
    if (exportOptions.compressionLevel === 'none') baseSize *= 1.8;
    if (exportOptions.compressionLevel === 'high') baseSize *= 0.6;
    
    return `~${Math.round(baseSize * 10) / 10} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Analysis Results
          </DialogTitle>
          <DialogDescription>
            Export your {analysisType} analysis results in various formats
          </DialogDescription>
        </DialogHeader>

        {exportStatus !== 'idle' && (
          <Alert className={`mb-4 ${
            exportStatus === 'error' ? 'border-red-500 bg-red-50' :
            exportStatus === 'complete' ? 'border-green-500 bg-green-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <div className="flex items-center gap-2">
              {exportStatus === 'complete' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : exportStatus === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              )}
              <AlertDescription>
                {exportStatus === 'preparing' && 'Preparing export...'}
                {exportStatus === 'exporting' && 'Exporting data...'}
                {exportStatus === 'complete' && 'Export completed successfully!'}
                {exportStatus === 'error' && 'Export failed. Please try again.'}
              </AlertDescription>
            </div>
            {exportStatus === 'exporting' && (
              <Progress value={exportProgress} className="mt-2" />
            )}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Format Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Export Format</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {exportFormats.map(format => (
                  <Card 
                    key={format.id}
                    className={`cursor-pointer transition-colors ${
                      exportOptions.format === format.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => updateOptions('format', format.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {format.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{format.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {format.fileSize}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {format.supportsData && (
                              <Badge variant="secondary" className="text-xs">Data</Badge>
                            )}
                            {format.supportsVisuals && (
                              <Badge variant="secondary" className="text-xs">Visuals</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* File Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">File Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="filename">Custom File Name</Label>
                  <Input
                    id="filename"
                    placeholder={generateFileName()}
                    value={exportOptions.customFileName}
                    onChange={(e) => updateOptions('customFileName', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Extension will be added automatically
                  </p>
                </div>

                <div>
                  <Label>Compression Level</Label>
                  <Select 
                    value={exportOptions.compressionLevel} 
                    onValueChange={(value) => updateOptions('compressionLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Fastest)</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Smallest)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Data Quality</Label>
                  <Select 
                    value={exportOptions.dataQuality} 
                    onValueChange={(value) => updateOptions('dataQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="key-points">Key Points Only</SelectItem>
                      <SelectItem value="summary">Summary Level</SelectItem>
                      <SelectItem value="full">Full Detail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedFormat?.supportsVisuals && (
                  <div>
                    <Label>Visual Format</Label>
                    <Select 
                      value={exportOptions.visualFormat} 
                      onValueChange={(value) => updateOptions('visualFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG (Raster)</SelectItem>
                        <SelectItem value="svg">SVG (Vector)</SelectItem>
                        <SelectItem value="pdf">PDF (Print)</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Selection */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="raw-data"
                    checked={exportOptions.includeRawData}
                    onCheckedChange={(checked) => updateOptions('includeRawData', checked)}
                  />
                  <Label htmlFor="raw-data">Include Raw Data</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizations"
                    checked={exportOptions.includeVisualizations}
                    onCheckedChange={(checked) => updateOptions('includeVisualizations', checked)}
                    disabled={!selectedFormat?.supportsVisuals}
                  />
                  <Label htmlFor="visualizations">Include Visualizations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) => updateOptions('includeMetadata', checked)}
                  />
                  <Label htmlFor="metadata">Include Metadata</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="statistics"
                    checked={exportOptions.includeStatistics}
                    onCheckedChange={(checked) => updateOptions('includeStatistics', checked)}
                  />
                  <Label htmlFor="statistics">Include Statistics</Label>
                </div>
              </CardContent>
            </Card>

            {/* Report Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reportSections.map(section => (
                    <div key={section.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={section.id} className="text-sm font-medium">
                          {section.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Format:</span>
                  <span className="font-medium">{selectedFormat?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sections:</span>
                  <span className="font-medium">{selectedSections.length} of {reportSections.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Size:</span>
                  <span className="font-medium">{calculateFileSize()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Compression:</span>
                  <span className="font-medium capitalize">{exportOptions.compressionLevel}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedSections.length === 0}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Export Results
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportResultsDialog;
