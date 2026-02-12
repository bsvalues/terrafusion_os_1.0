import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileIcon,
  UploadIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  ClockIcon,
 } from '@mui/icons-material';

export default function ImportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress (in a real app, this would be from an upload progress event)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + 5;
          return next > 90 ? 90 : next;
        });
      }, 200);

      // Upload the file
      const response = await apiRequest("/api/import/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        toast({
          title: "Upload successful",
          description: "File has been processed successfully",
        });

        setImportResult(response.result);
        setActiveTab("results");

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
        queryClient.invalidateQueries({ queryKey: ["/api/comparables"] });
        queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      } else {
        toast({
          title: "Upload failed",
          description: response.message || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
  };

  return (
    <div className="container mx-auto py-6"><>

      <h1 className="text-3xl font-bold mb-6">Import Appraisal Data</h1>

      <Tabs
</> value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2"><>

          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger
</> value="results" disabled={!importResult}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader><>

              <CardTitle>Upload Appraisal Files</CardTitle>
              <CardDescription
</>>
                Import appraisal data from PDF, XML, CSV, or proprietary formats
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center ${
                    file ? "border-green-500/50" : "border-gray-300"
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      setFile(e.dataTransfer.files[0]);
                      setImportResult(null);
                    }
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    {file ? (
                      <>
                        <FileTextIcon className="h-10 w-10 text-muted-foreground mb-4" /><>

                        <h3 className="text-lg font-medium">{file.name}</h3>
                        <p
</> className="text-sm text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB - {file.type || "Unknown type"}
                        </p>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-10 w-10 text-muted-foreground mb-4" /><>

                        <h3 className="text-lg font-medium">Drag & drop your file here</h3>
                        <p
</> className="text-sm text-muted-foreground mt-1">
                          or click to browse files
                        </p>
                      </>
                    )}

                    <input
                      type="file"
                      id="file-upload"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.xml,.csv,.json,.alf,.zap,application/pdf,text/xml,text/csv,application/json"
                    />
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between"><>

                      <span className="text-sm font-medium">Uploading...</span>
                      <span
</> className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <div className="text-sm text-muted-foreground"><>

                  <p>Supported formats:</p>
                  <div
</> className="flex flex-wrap gap-2 mt-2"><>

                    <Badge variant="outline">PDF</Badge>
                    <Badge
</> variant="outline">MISMO XML</Badge><>

                    <Badge variant="outline">CSV</Badge>
                    <Badge
</> variant="outline">JSON</Badge><>

                    <Badge variant="outline">ACI (.alf)</Badge>
                    <Badge
</> variant="outline">a.la.mode (.zap)</Badge>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between"><>

              <Button variant="outline" onClick={handleReset} disabled={!file || uploading}>
                Reset
              </Button>
              <Button
</> onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload & Process"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {importResult && (
            <Card>
              <CardHeader><>

                <CardTitle>Import Results</CardTitle>
                <CardDescription
</>>
                  Summary of data extracted from {importResult.format}
                </CardDescription>

                <div className="mt-2">
                  <Badge
                    variant={
                      importResult.status === "success"
                        ? "default"
                        : importResult.status === "partial"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {importResult.status === "success" && "Success"}
                    {importResult.status === "partial" && "Partial Success"}
                    {importResult.status === "failed" && "Failed"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><>

                      <h3 className="font-medium text-sm">File Information</h3>
                      <div
</> className="text-sm">
                        <div className="flex justify-between py-1 border-b"><>

                          <span className="text-muted-foreground">Format:</span>
                          <span
</>>{importResult.format}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b"><>

                          <span className="text-muted-foreground">Status:</span>
                          <span
</> className="capitalize">{importResult.status}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b"><>

                          <span className="text-muted-foreground">Date Processed:</span>
                          <span
</>>{new Date(importResult.dateProcessed).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2"><>

                      <h3 className="font-medium text-sm">Extracted Entities</h3>
                      <div
</> className="grid grid-cols-2 gap-2">
                        <div className="bg-muted/50 p-3 rounded-md text-center"><>

                          <div className="text-2xl font-bold">
                            {importResult.importedEntities.properties.length}
                          </div>
                          <div
</> className="text-xs text-muted-foreground">Properties</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md text-center"><>

                          <div className="text-2xl font-bold">
                            {importResult.importedEntities.comparables.length}
                          </div>
                          <div
</> className="text-xs text-muted-foreground">Comparables</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md text-center"><>

                          <div className="text-2xl font-bold">
                            {importResult.importedEntities.reports.length}
                          </div>
                          <div
</> className="text-xs text-muted-foreground">Reports</div>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md text-center"><>

                          <div className="text-2xl font-bold">
                            {importResult.importedEntities.adjustments.length}
                          </div>
                          <div
</> className="text-xs text-muted-foreground">Adjustments</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
                    <div className="space-y-4">
                      {importResult.errors.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircleIcon className="h-4 w-4" /><>

                          <AlertTitle>Errors</AlertTitle>
                          <AlertDescription
</>>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {importResult.errors.map((error: string /* , index */: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {importResult.warnings.length > 0 && (
                        <Alert variant="warning">
                          <AlertCircleIcon className="h-4 w-4" /><>

                          <AlertTitle>Warnings</AlertTitle>
                          <AlertDescription
</>>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {importResult.warnings.map((warning: string /* , index */: number) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between"><>

                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Back to Upload
                </Button>
                <Button
</> onClick={handleReset}>Import Another File</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
