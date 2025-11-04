import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText,
  FileDown,
  FileUp,
  CheckCircle2,
  Warning,
  FileCheck,
  Download,
  Mail,
  FileSpreadsheet,
  FileX,
  Settings,
  Printer,
  Upload,
 } from '@mui/icons-material';

interface ReportGenerationProps {
  reportId?: string;
  propertyAddress?: string;
  isCompliant?: boolean;
  onGeneratePdf?: () => void;
  onGenerateXml?: () => void;
  onExportCsv?: () => void;
  onSendEmail?: () => void;
  onPrint?: () => void;
}

export function ReportGeneration({
  reportId = "apr-1001",
  propertyAddress = "123 Main St, Cityville, CA 90210",
  isCompliant = true,
  onGeneratePdf,
  onGenerateXml,
  onExportCsv,
  onSendEmail,
  onPrint,
}: ReportGenerationProps) {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pdf");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingXml, setGeneratingXml] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [xmlReady, setXmlReady] = useState(false);

  // Function to handle PDF generation
  const handleGeneratePdf = () => {
    setGeneratingPdf(true);

    // Simulate PDF generation process
    setTimeout(() => {
      setGeneratingPdf(false);
      setPdfReady(true);
      if (onGeneratePdf) onGeneratePdf();
    }, 2000);
  };

  // Function to handle XML generation
  const handleGenerateXml = () => {
    setGeneratingXml(true);

    // Simulate XML generation process
    setTimeout(() => {
      setGeneratingXml(false);
      setXmlReady(true);
      if (onGenerateXml) onGenerateXml();
    }, 2000);
  };

  // Function to handle email sending
  const handleSendEmail = () => {
    if (onSendEmail) onSendEmail();
  };

  // Function to handle printing
  const handlePrint = () => {
    if (onPrint) onPrint();
  };

  // Function to handle CSV export
  const handleExportCsv = () => {
    if (onExportCsv) onExportCsv();
  };

  return (
    <div className="space-y-8">
      {/* Compliance Check Alert */}
      {!isCompliant && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" /><>

          <AlertTitle>Compliance Issues Detected</AlertTitle>
          <AlertDescription
</>>
            This report has compliance issues that must be resolved before generating final
            deliverables.
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => setLocation(`/compliance/${reportId}`)}
            >
              Review Issues
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Generation Options */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="pdf">PDF Report</TabsTrigger>
          <TabsTrigger
</> value="xml">MISMO XML</TabsTrigger><>

          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger
</> value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {/* PDF Report Generation */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <FileText className="mr-2 h-5 w-5 text-primary" />
                Generate PDF Report
              </CardTitle>
              <CardDescription
</>>
                Create a professional PDF appraisal report for {propertyAddress}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Uniform Residential Appraisal Report</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Standard form for single-family residential properties (Form 1004)
                  </CardContent>
                  <CardFooter
</>>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={handleGeneratePdf}
                      disabled={generatingPdf}
                    >
                      {generatingPdf ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Generating...
                        </>
                      ) : pdfReady ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Download PDF
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate PDF
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Desktop Appraisal Report</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Report format for desktop appraisals without interior inspection
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Select Format
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Custom Report Template</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Generate using a custom or company-specific template
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Choose Template
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {pdfReady && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /><>

                  <AlertTitle>PDF Report Ready</AlertTitle>
                  <AlertDescription
</> className="flex items-center justify-between"><>

                    <span>Your PDF report has been generated successfully.</span>
                    <div
</> className="space-x-2">
                      <Button size="sm" variant="outline" onClick={handlePrint}><>

                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                      <Button
</> size="sm" variant="default">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MISMO XML Generation */}
        <TabsContent value="xml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
                Generate MISMO XML
              </CardTitle>
              <CardDescription
</>>
                Create industry-standard MISMO XML file for seamless data exchange
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">MISMO 2.6 XML</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Standard format for GSE (Fannie Mae, Freddie Mac) submissions
                  </CardContent>
                  <CardFooter
</>>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={handleGenerateXml}
                      disabled={generatingXml}
                    >
                      {generatingXml ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Generating...
                        </>
                      ) : xmlReady ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Download XML
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Generate XML
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">UAD Compliance Check</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Verify XML compliance with UAD standards before submission
                  </CardContent>
                  <CardFooter
</>>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setLocation(`/compliance/${reportId}`)}
                    >
                      <FileCheck className="mr-2 h-4 w-4" />
                      Check Compliance
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {xmlReady && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /><>

                  <AlertTitle>XML File Ready</AlertTitle>
                  <AlertDescription
</> className="flex items-center justify-between"><>

                    <span>Your MISMO XML file has been generated successfully.</span>
                    <Button
</> size="sm" variant="default">
                      <Download className="mr-2 h-4 w-4" />
                      Download XML
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Export Options */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <FileDown className="mr-2 h-5 w-5 text-primary" />
                Export Data
              </CardTitle>
              <CardDescription
</>>
                Export appraisal data in various formats for external systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">CSV Export</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Export property and comparable data as CSV
                  </CardContent>
                  <CardFooter
</>>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleExportCsv}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">JSON Data</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Export complete dataset in JSON format
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export JSON
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Analysis Export</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Export AI-generated analysis and charts
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export Analysis
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Options */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <Mail className="mr-2 h-5 w-5 text-primary" />
                Deliver Report
              </CardTitle>
              <CardDescription
</>>
                Deliver the finalized appraisal to clients and stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Email Delivery</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Send reports directly to client email
                  </CardContent>
                  <CardFooter
</>>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={handleSendEmail}
                      disabled={!pdfReady}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">System Integration</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Submit directly to lending or appraisal management systems
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full" disabled={!xmlReady}>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit to System
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-muted/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Client Portal</CardTitle>
                  </CardHeader><>

                  <CardContent className="text-xs text-muted-foreground">
                    Generate secure access link for client portal
                  </CardContent>
                  <CardFooter
</>>
                    <Button variant="outline" size="sm" className="w-full" disabled={!pdfReady}>
                      <FileUp className="mr-2 h-4 w-4" />
                      Create Portal Link
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {pdfReady && (
                <Alert><>

                  <AlertTitle>Delivery Options</AlertTitle>
                  <AlertDescription
</>>
                    Your report is ready for delivery. Choose a delivery method from the options
                    above or download the files for manual delivery.
                  </AlertDescription>
                </Alert>
              )}

              {!pdfReady && !xmlReady && (
                <Alert variant="destructive">
                  <FileX className="h-4 w-4" /><>

                  <AlertTitle>Reports Not Generated</AlertTitle>
                  <AlertDescription
</>>
                    You must generate the PDF report and/or MISMO XML before delivery.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
