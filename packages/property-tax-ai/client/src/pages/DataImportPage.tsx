import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, X, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interfaces for our component
interface StagedProperty {
  stagingId: string;
  property: {
    propertyId: string;
    address: string;
    parcelNumber: string;
    [key: string]: any;
  };
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationErrors: string[];
  stagedAt: string;
  source: string;
  committedAt: string | null;
}

interface ValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  isValid: boolean;
  errors?: string[];
}

interface UploadResponse {
  fileName: string;
  filePath: string;
  validation: ValidationResult;
}

interface StagedPropertiesResponse {
  count: number;
  properties: StagedProperty[];
}

export default function DataImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for staged properties
  const stagedPropertiesQuery = useQuery({
    queryKey: ['/api/data-import/staged-properties'],
    enabled: activeTab === 'staged',
    queryFn: async () => {
      return apiRequest('/api/data-import/staged-properties', { method: 'GET' });
    }
  });

  // Upload and validate mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest('/api/data-import/upload-validate', {
        method: 'POST',
        body: formData,
        // Let browser set content-type for FormData automatically
      });
    },
    onSuccess: (data) => {
      setUploadedFilePath(data.filePath);
      toast({
        title: 'File Uploaded',
        description: `${data.fileName} successfully uploaded and validated.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload the file',
        variant: 'destructive',
      });
    }
  });

  // Direct import mutation
  const importMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return apiRequest('/api/data-import/import-properties', {
        method: 'POST',
        body: JSON.stringify({ filePath }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Import Successful',
        description: `Imported ${data.successfulImports} properties with ${data.failedImports} failures.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import properties',
        variant: 'destructive',
      });
    }
  });

  // Stage properties mutation
  const stageMutation = useMutation({
    mutationFn: async (filePath: string) => {
      return apiRequest('/api/data-import/stage-properties', {
        method: 'POST',
        body: JSON.stringify({ filePath }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-import/staged-properties'] });
      toast({
        title: 'Staging Successful',
        description: `Staged ${data.staged} properties for import.`,
        variant: 'default',
      });
      setActiveTab('staged');
    },
    onError: (error) => {
      toast({
        title: 'Staging Failed',
        description: error.message || 'Failed to stage properties',
        variant: 'destructive',
      });
    }
  });

  // Commit properties mutation
  const commitMutation = useMutation({
    mutationFn: async (stagingIds: string[]) => {
      return apiRequest('/api/data-import/commit-staged-properties', {
        method: 'POST',
        body: JSON.stringify({ stagingIds }),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-import/staged-properties'] });
      toast({
        title: 'Commit Successful',
        description: `Committed ${data.successful} properties with ${data.failed} failures.`,
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Commit Failed',
        description: error.message || 'Failed to commit properties',
        variant: 'destructive',
      });
    }
  });

  // Delete staged property mutation
  const deleteStagedMutation = useMutation({
    mutationFn: async (stagingId: string) => {
      return apiRequest(`/api/data-import/staged-properties/${stagingId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-import/staged-properties'] });
      toast({
        title: 'Property Deleted',
        description: 'Staged property has been deleted.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete staged property',
        variant: 'destructive',
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to upload.',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(selectedFile);
  };

  const handleImport = () => {
    if (!uploadedFilePath) {
      toast({
        title: 'No File Uploaded',
        description: 'Please upload a CSV file first.',
        variant: 'destructive',
      });
      return;
    }

    importMutation.mutate(uploadedFilePath);
  };

  const handleStage = () => {
    if (!uploadedFilePath) {
      toast({
        title: 'No File Uploaded',
        description: 'Please upload a CSV file first.',
        variant: 'destructive',
      });
      return;
    }

    stageMutation.mutate(uploadedFilePath);
  };

  const handleCommitAll = () => {
    if (!stagedPropertiesQuery.data || !stagedPropertiesQuery.data.properties || stagedPropertiesQuery.data.properties.length === 0) {
      toast({
        title: 'No Staged Properties',
        description: 'There are no properties to commit.',
        variant: 'destructive',
      });
      return;
    }

    const validStagingIds = stagedPropertiesQuery.data.properties
      .filter((prop: StagedProperty) => prop.validationStatus === 'valid')
      .map((prop: StagedProperty) => prop.stagingId);

    if (validStagingIds.length === 0) {
      toast({
        title: 'No Valid Properties',
        description: 'There are no valid properties to commit.',
        variant: 'destructive',
      });
      return;
    }

    commitMutation.mutate(validStagingIds);
  };

  const renderFileUploadForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload Property Data</CardTitle>
        <CardDescription>
          Upload a CSV file containing property data to import into the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="csv-upload">Select CSV File</Label>
          <Input 
            id="csv-upload" 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            disabled={uploadMutation.isPending}
          />
        </div>

        {uploadMutation.data && uploadMutation.data.validation && (
          <div className="mt-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>File Validation Results</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p>Total Records: {uploadMutation.data.validation.totalRecords}</p>
                  <p>Valid Records: {uploadMutation.data.validation.validRecords}</p>
                  <p>Invalid Records: {uploadMutation.data.validation.invalidRecords}</p>
                  <div className="flex gap-2">
                    <Badge 
                      className={uploadMutation.data.validation.isValid ? 
                        "bg-green-500 hover:bg-green-600 text-white" : 
                        "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      }
                    >
                      {uploadMutation.data.validation.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-0">
        <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Validate
            </>
          )}
        </Button>
        
        {uploadedFilePath && (
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={handleImport} 
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Directly"
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleStage} 
              disabled={stageMutation.isPending}
            >
              {stageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Staging...
                </>
              ) : (
                "Stage for Review"
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );

  const renderStagedProperties = () => (
    <Card>
      <CardHeader>
        <CardTitle>Staged Properties</CardTitle>
        <CardDescription>
          Review and manage properties staged for import.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stagedPropertiesQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : stagedPropertiesQuery.error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load staged properties. Please try again.
            </AlertDescription>
          </Alert>
        ) : stagedPropertiesQuery.data?.properties?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No properties are currently staged for import.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-medium">
              {stagedPropertiesQuery.data?.count} properties staged
            </div>
            <div className="border rounded-md divide-y">
              {stagedPropertiesQuery.data?.properties.map((property: StagedProperty) => (
                <div key={property.stagingId} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {property.property.address}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {property.property.propertyId} • Parcel: {property.property.parcelNumber}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        className={
                          property.validationStatus === 'valid' 
                            ? "bg-green-500 hover:bg-green-600 text-white" 
                            : property.validationStatus === 'pending' 
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200" 
                              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        }
                      >
                        {property.validationStatus}
                      </Badge>
                      {property.validationStatus === 'invalid' && (
                        <span className="text-xs text-destructive">
                          {property.validationErrors.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteStagedMutation.mutate(property.stagingId)}
                    disabled={deleteStagedMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleCommitAll}
          disabled={
            commitMutation.isPending || 
            !stagedPropertiesQuery.data?.properties?.length || 
            !stagedPropertiesQuery.data?.properties?.some((p: StagedProperty) => p.validationStatus === 'valid')
          }
        >
          {commitMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Committing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Commit Valid Properties
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground mt-2">
          Import property data from CSV files into the system
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="staged">Staged Properties</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="upload" className="mt-0">
            {renderFileUploadForm()}
          </TabsContent>
          <TabsContent value="staged" className="mt-0">
            {renderStagedProperties()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}