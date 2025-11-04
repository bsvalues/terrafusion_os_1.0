
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDataImports, useImportErrors } from "@/hooks/useDataImports";
import { DataImportService } from "@/services/DataImportService";
import { Upload, FileText, Warning, CheckCircle, Clock, Database  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { useCounties } from "@/hooks/useCounties";

export default function DataImportManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string>("");
  
  const { toast } = useToast();
  const { imports, isLoading, createImport, updateImportStatus } = useDataImports();
  const { data: counties } = useCounties();
  const { data: importErrors } = useImportErrors(selectedImportId);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <Warning className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and import type.",
        variant: "destructive",
      });
      return;
    }

    if (importType === 'properties' && !selectedCounty) {
      toast({
        title: "Missing County",
        description: "Please select a county for property imports.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create import record
      const importRecord = await createImport.mutateAsync({
        import_name: `${importType}_${selectedFile.name}`,
        import_type: importType,
        status: 'processing',
        created_by: 'TerraFusion_Admin',
        metadata: {
          filename: selectedFile.name,
          filesize: selectedFile.size,
          county_id: selectedCounty || null
        }
      });

      // Parse CSV file
      const data = await DataImportService.parseCSVFile(selectedFile);
      
      // Update total records
      await updateImportStatus.mutateAsync({
        id: importRecord.id,
        status: 'processing',
        total_records: data.length
      });

      // Define field mappings based on import type
      const mappings = getDefaultFieldMappings(importType);
      
      let result;
      
      // Process import based on type
      switch (importType) {
        case 'counties':
          result = await DataImportService.importCounties(data, mappings, importRecord.id);
          break;
        case 'properties':
          result = await DataImportService.importProperties(data, mappings, importRecord.id, selectedCounty);
          break;
        case 'owners':
          result = await DataImportService.importPropertyOwners(data, mappings, importRecord.id);
          break;
        default:
          throw new Error('Unsupported import type');
      }

      // Update import status
      await updateImportStatus.mutateAsync({
        id: importRecord.id,
        status: result.success ? 'completed' : 'failed',
        processed_records: result.totalRecords,
        success_records: result.successCount,
        error_records: result.errorCount,
        error_log: result.errors
      });

      toast({
        title: result.success ? "Import Completed" : "Import Completed with Errors",
        description: `${result.successCount} records imported successfully. ${result.errorCount} errors.`,
        variant: result.success ? "default" : "destructive",
      });

    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedFile(null);
      setImportType("");
      setSelectedCounty("");
    }
  };

  const getDefaultFieldMappings = (type: string) => {
    switch (type) {
      case 'counties':
        return [
          { source: 'name', target: 'name', required: true },
          { source: 'state', target: 'state', required: true },
          { source: 'fips_code', target: 'fips_code', required: true },
          { source: 'timezone', target: 'timezone' }
        ];
      case 'properties':
        return [
          { source: 'parcel_id', target: 'parcel_id', required: true },
          { source: 'address', target: 'address', required: true },
          { source: 'property_type', target: 'property_type' },
          { source: 'assessed_value', target: 'assessed_value' },
          { source: 'land_value', target: 'land_value' },
          { source: 'improvement_value', target: 'improvement_value' }
        ];
      case 'owners':
        return [
          { source: 'parcel_id', target: 'parcel_id', required: true },
          { source: 'owner_name', target: 'owner_name', required: true },
          { source: 'mailing_address', target: 'mailing_address', required: true },
          { source: 'mailing_city', target: 'mailing_city', required: true },
          { source: 'mailing_state', target: 'mailing_state', required: true },
          { source: 'mailing_zip', target: 'mailing_zip', required: true }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Data Import Manager</h2>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList><>

          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger
</> value="history">Import History</TabsTrigger>
          <TabsTrigger value="errors">Error Details</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Client Data</span>
              </CardTitle>
              <CardDescription>
                Import counties, properties, and property owners from CSV files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><>

                  <Label htmlFor="import-type">Import Type</Label>
                  <Select
</> value={importType} onValueChange={setImportType}>
                    <SelectTrigger id="import-type"><>

                      <SelectValue placeholder="Select import type" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="counties">Counties</SelectItem>
                      <SelectItem
</> value="properties">Properties</SelectItem>
                      <SelectItem value="owners">Property Owners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {importType === 'properties' && (
                  <div className="space-y-2"><>

                    <Label htmlFor="county">County</Label>
                    <Select
</> value={selectedCounty} onValueChange={setSelectedCounty}>
                      <SelectTrigger id="county"><>

                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent
</>>
                        {counties?.map((county) => (
                          <SelectItem key={county.id} value={county.id}>
                            {county.name}, {county.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="file-upload">CSV File</Label>
                <Input
</>
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                {selectedFile && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || !importType || isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processing..." : "Start Import"}
              </Button>

              {importType && (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertDescription>
                    Expected CSV columns for {importType}: {getDefaultFieldMappings(importType).map(m => m.source).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><>

              <CardTitle>Import History</CardTitle>
              <CardDescription
</>>Track all data imports and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading imports...</div>
              ) : imports && imports.length > 0 ? (
                <div className="space-y-4">
                  {imports.map((importItem) => (
                    <div key={importItem.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(importItem.status)}<>

                          <span className="font-medium">{importItem.import_name}</span>
                          <Badge
</> className={getStatusColor(importItem.status)}>
                            {importItem.status}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(importItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span> {importItem.total_records}
                        </div>
                        <div>
                          <span className="text-gray-500">Success:</span> {importItem.success_records}
                        </div>
                        <div>
                          <span className="text-gray-500">Errors:</span> {importItem.error_records}
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span> {importItem.import_type}
                        </div>
                      </div>

                      {importItem.total_records > 0 && (
                        <Progress 
                          value={(importItem.processed_records / importItem.total_records) * 100} 
                          className="w-full" 
                        />
                      )}

                      {importItem.error_records > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedImportId(importItem.id)}
                        >
                          View Errors ({importItem.error_records})
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No imports found. Start by uploading your first data file.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors">
          <Card>
            <CardHeader><>

              <CardTitle>Import Error Details</CardTitle>
              <CardDescription
</>>
                {selectedImportId ? "Review errors from selected import" : "Select an import with errors to view details"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImportId && importErrors ? (
                <div className="space-y-4">
                  {importErrors.map((error /* , index */) => (
                    <div key={error.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between mb-2"><>

                        <span className="font-medium text-red-800">Row {error.row_number}</span>
                        <Badge
</> variant="destructive">{error.error_type}</Badge>
                      </div>
                      <p className="text-red-700 mb-2">{error.error_message}</p>
                      {error.raw_data && (
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(error.raw_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select an import with errors from the history tab to view error details.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
