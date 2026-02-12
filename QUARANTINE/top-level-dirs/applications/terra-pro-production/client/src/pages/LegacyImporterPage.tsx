import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Database, FileText, MapPin, CheckCircle2, AlertCircle, Clock  } from '@mui/icons-material';

interface LegacyFile {
  FileId: number;
  Filename: string;
  StreetNumber?: number;
  StreetName?: string;
  StreetSuffix?: string;
  City?: string;
  State?: string;
  Zip?: string;
  DateCreated: string;
  FileSize: number;
}

interface ImportStats {
  totalFiles: number;
  processedFiles: number;
  successfulImports: number;
  failedImports: number;
  uniqueAddresses: number;
}

interface ConvertedDatabase {
  database: string;
  convertedAt: string;
  tables: Record<
    string,
    {
      schema: any[];
      rowCount: number;
      data: any[];
    }
  >;
}

export default function LegacyImporterPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  // Load converted database data
  const { data: legacyData, isLoading } = useQuery({
    queryKey: ["/api/legacy/converted-data"],
    queryFn: async () => {
      const response = await fetch("/api/legacy/converted-data");
      if (!response.ok) throw new Error("Failed to load legacy data");
      return response.json() as ConvertedDatabase;
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/legacy/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Import failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsImporting(false);
      setImportProgress(100);
    },
    onError: () => {
      setIsImporting(false);
    },
  });

  const handleImport = () => {
    setIsImporting(true);
    setImportProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    importMutation.mutate();
  };

  const fileDetails = legacyData?.tables?.FileDetail?.data || [];
  const fileCount = legacyData?.tables?.FileDetail?.rowCount || 0;

  // Calculate statistics using FileDetail data (contains actual property info)
  const stats: ImportStats = {
    totalFiles: fileCount,
    processedFiles: fileDetails.length,
    successfulImports: fileDetails.filter((f) => f.Location && f.Location.trim()).length,
    failedImports: fileDetails.filter((f) => !f.Location || !f.Location.trim()).length,
    uniqueAddresses: new Set(
      fileDetails.map((f) => f.Location).filter((location) => location && location.trim())
    ).size,
  };

  // Sample property files for preview
  const sampleFiles = fileDetails.slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading legacy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold mb-2">Terrafusion Legacy Data Importer</h1>
        <p
</> className="text-muted-foreground">
          Import and transform legacy appraisal data from SQLite databases
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger
</> value="preview">Data Preview</TabsTrigger><>

          <TabsTrigger value="import">Import Process</TabsTrigger>
          <TabsTrigger
</> value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <FileText
</> className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
                <p
</> className="text-xs text-muted-foreground">Property files detected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">Valid Addresses</CardTitle>
                <MapPin
</> className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">{stats.uniqueAddresses.toLocaleString()}</div>
                <p
</> className="text-xs text-muted-foreground">Unique property addresses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle2
</> className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">
                  {Math.round((stats.successfulImports / stats.totalFiles) * 100)}%
                </div>
                <p
</> className="text-xs text-muted-foreground">Data completeness</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">Database Version</CardTitle>
                <Database
</> className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold">
                  {legacyData?.tables?.Version?.data?.[0]?.DatabaseVersion || "Unknown"}
                </div>
                <p
</> className="text-xs text-muted-foreground">Schema version</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><>

              <CardTitle>Legacy Database Structure</CardTitle>
              <CardDescription
</>>
                Converted from SQLite databases with comprehensive property management data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><>

                  <h4 className="font-medium mb-2">File Management</h4>
                  <ul
</> className="text-sm text-muted-foreground space-y-1"><>

                    <li>• Property files and documents</li>
                            <li
</>>• Address standardization</li><>

                    <li>• Folder organization</li>
                            <li
</>>• File metadata tracking</li>
                  </ul>
                </div>
                <div><>

                  <h4 className="font-medium mb-2">Data Quality</h4>
                  <ul
</> className="text-sm text-muted-foreground space-y-1"><>

                    <li>• {stats.successfulImports.toLocaleString()} complete records</li>
                            <li
</>>• {stats.failedImports.toLocaleString()} incomplete records</li><>

                    <li>• Address validation ready</li>
                            <li
</>>• Terrafusion schema mapping</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader><>

              <CardTitle>Property File Preview</CardTitle>
              <CardDescription
</>>Sample property records from the legacy database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><>

                    <TableHead>File ID</TableHead>
                    <TableHead
</>>Location</TableHead><>

                    <TableHead>Appraiser</TableHead>
                    <TableHead
</>>Appraised Value</TableHead><>

                    <TableHead>Form Type</TableHead>
                    <TableHead
</>>Square Footage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleFiles.map((file) => {
                    const location = file.Location || "No location";
                    const isComplete = !!(file.Location && file.Location.trim());

                    return (
                      <TableRow key={file.FileId}><>

                        <TableCell className="font-mono">{file.FileId}</TableCell>
                        <TableCell
</>>{location}</TableCell><>

                        <TableCell>{file.AppraiserName || "N/A"}</TableCell>
                        <TableCell
</>>
                          ${file.AppraisedValue ? file.AppraisedValue.toLocaleString() : "N/A"}
                        </TableCell><>

                        <TableCell>{file.MajorFormDescription || "N/A"}</TableCell>
                        <TableCell
</>>
                          {file.GrossLivingArea ? `${file.GrossLivingArea} sq ft` : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isComplete ? "default" : "secondary"}>
                            {isComplete ? "Complete" : "Incomplete"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader><>

              <CardTitle>Import Legacy Data</CardTitle>
              <CardDescription
</>>
                Transform and import legacy property data into Terrafusion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><>

                    <span className="text-sm">Import Progress</span>
                    <span
</> className="text-sm">{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will import {stats.successfulImports.toLocaleString()} property records with
                  complete address information into the Terrafusion database.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || importMutation.isPending}
                  className="flex items-center gap-2"
                ><>

                  <Upload className="h-4 w-4" />
                  {isImporting ? "Importing..." : "Start Import"}
                </Button>

                <Button
</> variant="outline" disabled={isImporting}>
                  Preview Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader><>

              <CardTitle>Import Results</CardTitle>
              <CardDescription
</>>
                Status and outcomes of the legacy data import process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importProgress === 100 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">Import Completed Successfully</h3>
                  <p
</> className="text-muted-foreground">
                    {stats.successfulImports.toLocaleString()} property records imported
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <p>Import results will appear here after processing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
