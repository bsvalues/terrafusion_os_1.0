import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2  } from '@mui/icons-material';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface FileUpload {
  file: File;
  dataType: string;
  year: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

export default function BulkImport() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [defaultYear, setDefaultYear] = useState('2024');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const dataTypes = [
    { value: 'pilt_receipt', label: 'PILT Receipts' },
    { value: 'distribution', label: 'Distribution Data' },
    { value: 'land_classification', label: 'Land Classifications' },
    { value: 'levy_rate', label: 'Levy Rates' },
    { value: 'district', label: 'District Information' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: FileUpload[] = selectedFiles
      .filter(file => file.name.toLowerCase().endsWith('.csv'))
      .map(file => ({
        file,
        dataType: guessDataType(file.name),
        year: defaultYear,
        status: 'pending' as const
      }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const guessDataType = (filename: string): string => {
    const name = filename.toLowerCase();
    if (name.includes('pilt') || name.includes('receipt')) return 'pilt_receipt';
    if (name.includes('distribution') || name.includes('distrib')) return 'distribution';
    if (name.includes('land') || name.includes('classification')) return 'land_classification';
    if (name.includes('levy') || name.includes('rate')) return 'levy_rate';
    if (name.includes('district')) return 'district';
    return 'pilt_receipt';
  };

  const updateFile = (index: number, updates: Partial<FileUpload>) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < files.length; i++) {
      const fileUpload = files[i];
      if (fileUpload.status !== 'pending') continue;

      updateFile(i, { status: 'uploading' });

      try {
        const formData = new FormData();
        formData.append('file', fileUpload.file);
        formData.append('dataType', fileUpload.dataType);
        formData.append('year', fileUpload.year);
        formData.append('useDirectProcessing', 'true'); // Skip AI processing

        const response = await fetch('/api/etl/upload-csv', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          updateFile(i, { 
            status: 'success', 
            message: `Imported ${result.recordsImported || 0} records`
          });
        } else {
          const error = await response.text();
          updateFile(i, { 
            status: 'error', 
            message: error || 'Upload failed'
          });
        }
      } catch (error) {
        updateFile(i, { 
          status: 'error', 
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    toast({
      title: "Bulk Import Complete",
      description: "All CSV files have been processed.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'uploading': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div><>

        <h1 className="text-3xl font-bold tracking-tight">Bulk CSV Import</h1>
        <p
</> className="text-muted-foreground">
          Import multiple CSV files efficiently without AI processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Upload className="h-5 w-5" />
                Upload CSV Files
              </CardTitle>
              <CardDescription
</>>
                Select multiple CSV files to import your 2024 PILT data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="default-year">Default Year</Label>
                <Select
</> value={defaultYear} onValueChange={setDefaultYear}>
                  <SelectTrigger className="w-full"><>

                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem
</> value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="csv-files">Select CSV Files</Label>
                <Input
</>
                  id="csv-files"
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-3"><>

                  <h4 className="font-medium">Files to Import ({files.length})</h4>
                  <div
</> className="space-y-2 max-h-64 overflow-y-auto">
                    {files.map((fileUpload /* , index */) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                        {getStatusIcon(fileUpload.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileUpload.file.name}
                          </p>
                          {fileUpload.message && (
                            <p className="text-xs text-muted-foreground">
                              {fileUpload.message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={fileUpload.dataType}
                            onValueChange={(value) => updateFile(index, { dataType: value })}
                            disabled={fileUpload.status !== 'pending'}
                          >
                            <SelectTrigger className="w-40"><>

                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
</>>
                              {dataTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={fileUpload.year}
                            onChange={(e) => updateFile(index, { year: e.target.value })}
                            disabled={fileUpload.status !== 'pending'}
                            className="w-20"
                            placeholder="Year"
                          />
                          <Badge variant={getStatusVariant(fileUpload.status)}>
                            {fileUpload.status}
                          </Badge>
                          {fileUpload.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Files Selected:</span>
                <Badge
</> variant="secondary">{files.length}</Badge>
              </div>
              
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Ready to Process:</span>
                <Badge
</> variant="outline">
                  {files.filter(f => f.status === 'pending').length}
                </Badge>
              </div>

              <div className="flex items-center justify-between"><>

                <span className="text-sm">Completed:</span>
                <Badge
</> variant="default">
                  {files.filter(f => f.status === 'success').length}
                </Badge>
              </div>

              <div className="flex items-center justify-between"><>

                <span className="text-sm">Errors:</span>
                <Badge
</> variant="destructive">
                  {files.filter(f => f.status === 'error').length}
                </Badge>
              </div>

              <Button
                onClick={processFiles}
                disabled={files.length === 0 || isProcessing || files.every(f => f.status !== 'pending')}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import All Files
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2"><>

              <p>• CSV files should have headers in the first row</p>
              <p
</>>• Use consistent date formats (YYYY-MM-DD)</p><>

              <p>• Numbers should not contain commas</p>
              <p
</>>• District names should match existing records</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}