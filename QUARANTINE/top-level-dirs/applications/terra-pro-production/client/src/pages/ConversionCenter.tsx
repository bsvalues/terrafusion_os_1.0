import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload,
  Download,
  FileText,
  Bot,
  Clock,
  CheckCircle,
  Warning,
  ArrowRight,
 } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ConversionMapping {
  source: string;
  target: string;
  dataType?: string;
}

interface ConversionHistoryItem {
  id: number;
  templateName: string;
  inputFileName: string;
  outputFileName?: string;
  inputRecords: number;
  outputRecords: number;
  status: string;
  createdAt: string;
  agentSummary?: string;
  warnings?: string[];
}

interface ConversionResult {
  success: boolean;
  mapping?: ConversionMapping[];
  result?: any;
  warnings?: string[];
  agentSummary?: string;
  outputRecords?: number;
  executionTimeMs?: number;
}

export default function ConversionCenter() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ConversionMapping[]>([]);
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xmlInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversion history
  const { data: conversionHistory = [] } = useQuery<ConversionHistoryItem[]>({
    queryKey: ["/api/conversion/history"],
    enabled: true,
  });

  // Fetch available templates
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/conversion/templates"],
    enabled: true,
  });

  // Conversion mutation
  const conversionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/conversion/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Conversion failed");
      }

      return response.json();
    },
    onSuccess: (data: ConversionResult) => {
      setConversionResult(data);
      setMapping(data.mapping || []);
      setJsonOutput(data.result ? JSON.stringify(data.result, null, 2) : "");

      toast({
        title: "Conversion Completed",
        description: `Successfully processed ${data.outputRecords || 0} records in ${data.executionTimeMs || 0}ms`,
      });

      // Invalidate history to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/conversion/history"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Conversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (type: "csv" | "xml", file: File | null) => {
    if (!file) return;

    if (type === "csv") {
      setCsvFile(file);
      // Parse CSV preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text
          .split("\n")
          .slice(0, 8)
          .map((row) => row.split(",").map((cell) => cell.trim().replace(/"/g, "")));
        setCsvPreview(rows.filter((row) => row.some((cell) => cell.length > 0)));
      };
      reader.readAsText(file);
    } else {
      setXmlFile(file);
    }
  };

  const handleConvert = async () => {
    if (!csvFile) {
      toast({
        title: "Missing File",
        description: "Please upload a CSV file to convert",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("csvFile", csvFile);

    if (xmlFile) {
      formData.append("xmlFile", xmlFile);
    }

    if (selectedTemplate) {
      formData.append("templateName", selectedTemplate);
    }

    conversionMutation.mutate(formData);
  };

  const downloadResult = () => {
    if (!jsonOutput) return;

    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2"><>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Terrafusion Conversion Center
        </h1>
        <p
</> className="text-gray-600 dark:text-gray-400">
          AI-powered data conversion with intelligent field mapping and real-time insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Upload & Preview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload & Configure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Section */}
            <div className="space-y-3">
              <div><>

                <label className="text-sm font-medium mb-2 block">CSV Data File</label>
                <div
</>
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => csvInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" /><>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {csvFile ? csvFile.name : "Click to upload CSV file"}
                  </p>
                  <input
</>
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload("csv", e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div><>

                <label className="text-sm font-medium mb-2 block">XML Template (Optional)</label>
                <div
</>
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => xmlInputRef.current?.click()}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" /><>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {xmlFile ? xmlFile.name : "Click to upload XML template"}
                  </p>
                  <input
</>
                    ref={xmlInputRef}
                    type="file"
                    accept=".xml"
                    className="hidden"
                    onChange={(e) => handleFileUpload("xml", e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Template Selection */}
              {templates.length > 0 && (
                <div><>

                  <label className="text-sm font-medium mb-2 block">Conversion Template</label>
                  <Select
</> value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent
</>>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.name}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* CSV Preview */}
            {csvPreview.length > 0 && (
              <div className="space-y-2"><>

                <h4 className="text-sm font-medium">Data Preview</h4>
                <div
</> className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvPreview[0]?.map((col, idx) => (
                          <TableHead key={idx} className="text-xs font-semibold">
                            {col || `Col ${idx + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.slice(1, 6).map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j} className="text-xs">
                              {cell || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvPreview.length > 6 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      ...and {csvPreview.length - 6} more rows
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Convert Button */}
            <Button
              onClick={handleConvert}
              disabled={conversionMutation.isPending || !csvFile}
              className="w-full"
            >
              {conversionMutation.isPending ? (
                <>
                  <Bot className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Convert Data
                </>
              )}
            </Button>

            {/* Progress */}
            {conversionMutation.isPending && <Progress value={undefined} className="w-full" />}
          </CardContent>
        </Card>

        {/* Center Panel: Results & Mapping */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Conversion Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conversionResult && (
              <Tabs defaultValue="mapping" className="w-full">
                <TabsList className="grid w-full grid-cols-2"><>

                  <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                  <TabsTrigger
</> value="output">JSON Output</TabsTrigger>
                </TabsList>

                <TabsContent value="mapping" className="space-y-3">
                  {mapping.length > 0 ? (
                    <div className="space-y-2"><>

                      <h4 className="text-sm font-medium">Field Mappings</h4>
                      <div
</> className="border rounded-lg max-h-64 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow><>

                              <TableHead className="text-xs">Source</TableHead>
                              <TableHead
</> className="text-xs w-8"></TableHead>
                              <TableHead className="text-xs">Target</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mapping.map((map, idx) => (
                              <TableRow key={idx}><>

                                <TableCell className="text-xs font-mono">{map.source}</TableCell>
                                <TableCell
</> className="text-center"><>

                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                </TableCell>
                                <TableCell
</> className="text-xs font-mono">{map.target}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No mapping data available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="output" className="space-y-3">
                  {jsonOutput ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><>

                        <h4 className="text-sm font-medium">Converted Data</h4>
                        <Button
</> onClick={downloadResult} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      <Textarea
                        value={jsonOutput}
                        readOnly
                        className="font-mono text-xs h-64 resize-none"
                        placeholder="Conversion output will appear here..."
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No output data available</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Warnings */}
            {conversionResult?.warnings && conversionResult.warnings.length > 0 && (
              <Alert variant="destructive">
                <Warning className="h-4 w-4" /><>

                <AlertTitle>Conversion Warnings</AlertTitle>
                <AlertDescription
</>>
                  <ul className="list-disc list-inside space-y-1">
                    {conversionResult.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Right Panel: AI Assistant & History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Assistant & History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Summary */}
            {conversionResult?.agentSummary && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><>

                <h4 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">
                  Agent Analysis
                </h4>
                <p
</> className="text-sm text-blue-800 dark:text-blue-200">
                  {conversionResult.agentSummary}
                </p>
              </div>
            )}

            {/* Conversion History */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Conversions
              </h4>

              {conversionHistory.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {conversionHistory.slice(0, 10).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1"><>

                        <span className="text-sm font-medium truncate">{item.inputFileName}</span>
                        <Badge
</>
                          variant={item.status === "completed" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1"><>

                        <div>Template: {item.templateName}</div>
                        <div
</>>
                          {item.inputRecords} → {item.outputRecords} records
                        </div>
                        <div>{formatDate(item.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversion history</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
