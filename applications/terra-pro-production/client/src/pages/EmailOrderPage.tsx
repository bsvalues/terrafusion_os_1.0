import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "../lib/queryClient";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { Refresh, Upload, Mail, File, CheckCircle, AlertCircle  } from '@mui/icons-material';

// Define the form schema for email upload
const emailUploadSchema = z.object({
  emailContent: z.string().min(1, "Email content is required"),
  senderEmail: z.string().email("Invalid email address").optional(),
  subject: z.string().optional(),
});

// Define the form schema for file upload
const fileUploadSchema = z.object({
  files: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "At least one file is required"),
});

// Interface for processing status
interface ProcessingStatus {
  status: "idle" | "processing" | "success" | "error";
  progress: number;
  message: string;
  reportId?: number;
  error?: string;
}

export default function EmailOrderPage() {
  const [location, setLocation] = useLocation();

  // State for processing status
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: "idle",
    progress: 0,
    message: "",
  });

  // Form for email content upload
  const emailForm = useForm<z.infer<typeof emailUploadSchema>>({
    resolver: zodResolver(emailUploadSchema),
    defaultValues: {
      emailContent: "",
      senderEmail: "",
      subject: "",
    },
  });

  // Form for file upload
  const fileForm = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
  });

  // Mutation for processing email orders
  const processEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailUploadSchema>) => {
      return apiRequest("/api/orders/process-email", data);
    },
    onSuccess: (data) => {
      // Update processing status
      setProcessingStatus({
        status: "success",
        progress: 100,
        message: "Email processed successfully!",
        reportId: data.reportId,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      // Redirect to the new report after a short delay
      setTimeout(() => {
        if (data.reportId) {
          setLocation(`/reports/${data.reportId}`);
        }
      }, 2000);
    },
    onError: (error: any) => {
      setProcessingStatus({
        status: "error",
        progress: 0,
        message: "Failed to process email",
        error: error.message || "Unknown error",
      });
    },
  });

  // Mutation for processing file uploads
  const processFilesMutation = useMutation({
    mutationFn: async (data: { files: FileList }) => {
      const formData = new FormData();

      // Append each file to the form data
      for (let i = 0; i < data.files.length; i++) {
        formData.append("files", data.files[i]);
      }

      // Use fetch directly for FormData
      const response = await fetch("/api/orders/process-files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update processing status
      setProcessingStatus({
        status: "success",
        progress: 100,
        message: "Files processed successfully!",
        reportId: data.reportId,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });

      // Redirect to the new report after a short delay
      setTimeout(() => {
        if (data.reportId) {
          setLocation(`/reports/${data.reportId}`);
        }
      }, 2000);
    },
    onError: (error: any) => {
      setProcessingStatus({
        status: "error",
        progress: 0,
        message: "Failed to process files",
        error: error.message || "Unknown error",
      });
    },
  });

  // Handle email form submission
  const onEmailSubmit = (data: z.infer<typeof emailUploadSchema>) => {
    // Set initial processing status
    setProcessingStatus({
      status: "processing",
      progress: 10,
      message: "Analyzing email content...",
    });

    // Start a progress simulation
    simulateProgress();

    // Process the email
    processEmailMutation.mutate(data);
  };

  // Handle file form submission
  const onFileSubmit = (data: z.infer<typeof fileUploadSchema>) => {
    // Set initial processing status
    setProcessingStatus({
      status: "processing",
      progress: 10,
      message: "Uploading and analyzing files...",
    });

    // Start a progress simulation
    simulateProgress();

    // Process the files
    processFilesMutation.mutate(data);
  };

  // Simulate progress for better UX
  const simulateProgress = () => {
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10);

      if (progress >= 90) {
        clearInterval(interval);
        progress = 90; // Cap at 90% until actual completion
      }

      setProcessingStatus((prev) => ({
        ...prev,
        progress,
        message: progressMessage(progress),
      }));
    }, 800);

    // Cleanup interval after 15 seconds if not completed
    setTimeout(() => clearInterval(interval), 15000);
  };

  // Get message based on progress
  const progressMessage = (progress: number): string => {
    if (progress < 30) return "Analyzing content...";
    if (progress < 50) return "Extracting property information...";
    if (progress < 70) return "Retrieving public records...";
    if (progress < 90) return "Creating appraisal report...";
    return "Finalizing report...";
  };

  return (
    <div className="container mx-auto py-8"><>

      <h1 className="text-3xl font-bold mb-4">Import Appraisal Order</h1>
      <p
</> className="text-muted-foreground mb-8">
        Upload an appraisal order from an email or file to automatically create a new report.
      </p>

      {processingStatus.status === "processing" && (
        <Card className="mb-8">
          <CardHeader className="pb-4"><>

            <CardTitle>Processing Order</CardTitle>
            <CardDescription
</>>Please wait while we analyze your data</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={processingStatus.progress} className="h-2 mb-4" />
            <p className="text-center text-sm text-muted-foreground">{processingStatus.message}</p>
          </CardContent>
        </Card>
      )}

      {processingStatus.status === "success" && (
        <Alert className="mb-8 bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" /><>

          <AlertTitle className="text-green-800">Order Processed Successfully!</AlertTitle>
          <AlertDescription
</> className="text-green-700">
            Your appraisal order has been imported and a new report has been created.
            {processingStatus.reportId && (
              <div className="mt-2">
                <Button asChild variant="outline" className="border-green-300 text-green-700">
                  <Link href={`/reports/${processingStatus.reportId}`}>View Report</Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {processingStatus.status === "error" && (
        <Alert className="mb-8 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" /><>

          <AlertTitle className="text-red-800">Error Processing Order</AlertTitle>
          <AlertDescription
</> className="text-red-700">
            {processingStatus.error || "An unknown error occurred while processing your order."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="email" className="text-lg py-3"><>

            <Mail className="mr-2 h-4 w-4" /> From Email
          </TabsTrigger>
          <TabsTrigger
</> value="file" className="text-lg py-3">
            <File className="mr-2 h-4 w-4" /> From File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader><>

              <CardTitle>Import from Email</CardTitle>
              <CardDescription
</>>
                Paste an appraisal order email to automatically extract property information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                  <FormField
                    control={emailForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Email Subject (Optional)</FormLabel>
                        <FormControl
</>><>

                          <Input placeholder="Appraisal Order: 123 Main St" {...field} />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Sender Email (Optional)</FormLabel>
                        <FormControl
</>><>

                          <Input placeholder="orders@lender.com" {...field} />
                        </FormControl>
                        <FormMessage
</> />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={emailForm.control}
                    name="emailContent"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Email Content</FormLabel>
                        <FormControl
</>><>

                          <Textarea
                            placeholder="Paste the complete email content here"
                            className="min-h-[300px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription
</>>
                          Include the complete email to ensure all property details are captured
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      processingStatus.status === "processing" || !emailForm.formState.isValid
                    }
                  >
                    {processingStatus.status === "processing" ? (
                      <>
                        <Refresh className="mr-2 h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" /> Process Email Order
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file">
          <Card>
            <CardHeader><>

              <CardTitle>Import from Files</CardTitle>
              <CardDescription
</>>
                Upload PDF documents, images, or other files with the appraisal order details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...fileForm}>
                <form onSubmit={fileForm.handleSubmit(onFileSubmit)} className="space-y-6">
                  <FormField
                    control={fileForm.control}
                    name="files"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem><>

                        <FormLabel>Upload Files</FormLabel>
                        <FormControl
</>>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                            <Input
                              type="file"
                              multiple
                              className="hidden"
                              id="file-upload"
                              onChange={(e) => {
                                if (e.target.files) {
                                  onChange(e.target.files);
                                }
                              }}
                              {...rest}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" /><>

                              <p className="text-lg font-medium">
                                Click to upload or drag and drop
                              </p>
                              <p
</> className="text-sm text-muted-foreground">
                                PDFs, Word documents, and images accepted
                              </p>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />

                        {/* Display selected files */}
                        {fileForm.watch("files") && fileForm.watch("files").length > 0 && (
                          <div className="mt-4 space-y-2"><>

                            <p className="text-sm font-medium">Selected Files:</p>
                            <ul
</> className="text-sm space-y-1">
                              {Array.from(fileForm.watch("files")).map((file /* , index */) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      processingStatus.status === "processing" || !fileForm.formState.isValid
                    }
                  >
                    {processingStatus.status === "processing" ? (
                      <>
                        <Refresh className="mr-2 h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Process File Order
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8"><>

        <h2 className="text-xl font-bold mb-4">How It Works</h2>
        <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">1. Upload Order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Paste an email from a client or upload PDF files containing the appraisal order
                details.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">2. AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our AI extracts property information and gathers data from public records.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">3. Report Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                A new appraisal report is created with pre-filled information and comparable
                properties.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
