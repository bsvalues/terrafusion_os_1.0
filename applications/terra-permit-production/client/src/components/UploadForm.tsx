import React, { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, 
  FileSpreadsheet, 
  X, 
  ArrowRight, 
  Download, 
  HelpCircle, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  FileQuestion,
  CheckCircle2,
  Loader2,
  Info
 } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { uploadSpreadsheet, downloadTemplate } from '@/lib/api';
import { UploadResult, FileWithPreview } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ContextualTooltip } from '@/components/ui/contextual-tooltip';
import { FeatureSpotlight } from '@/components/tour/FeatureSpotlight';
import { ContextualHelp } from '@/components/help/ContextualHelp';
import { helpContent } from '@/data/helpContent';


interface UploadFormProps {
  onUploadComplete: (result: UploadResult) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete }) => {
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadSpreadsheet,
    onSuccess: (data: UploadResult) => {
      // Check if we received data with a message (partial success/warning)
      if (data.message) {
        toast({
          title: 'Warning',
          description: data.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Success',
          description: `Successfully processed ${data.summary.totalCount} permits!`,
          variant: 'default',
        });
      }
      
      // Reset file state
      setFile(null);
      
      // Call parent handler with results
      onUploadComplete(data);
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to process file.';
      
      // Show more helpful message for common errors
      let helpfulMessage = errorMessage;
      
      if (errorMessage.includes('no worksheets') || errorMessage.includes('no valid data')) {
        helpfulMessage = 'The file appears to be empty or in an incorrect format. Please download our template and try again.';
      } else if (errorMessage.includes('Parcel Number is required')) {
        helpfulMessage = 'The file is missing required Parcel Number data. Please check your spreadsheet format.';
      }
      
      toast({
        title: 'Error Processing File',
        description: helpfulMessage,
        variant: 'destructive',
      });
    },
  });

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    // Validate file type - now supporting more formats with AI processing
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/pdf',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a spreadsheet or document file (.xlsx, .xls, .csv, .txt, .pdf)',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a preview URL
    setFile(selectedFile);
  };
  
  // Get file icon based on mimetype
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    } else if (mimeType.includes('csv') || mimeType.includes('text')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-600" />;
    } else {
      return <FileQuestion className="h-5 w-5 text-gray-600" />;
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    []
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle remove file
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle process file button click
  const handleProcessFile = () => {
    if (file) {
      // Pass the file to the mutation
      uploadMutation.mutate(file as File);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader className="border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1"><>

              <CardTitle>Upload Permit Data</CardTitle>
              <ContextualTooltip
</> 
                content={
                  <div className="space-y-1.5"><>

                    <div>Our AI-powered system automatically classifies permits based on:</div>
                    <ul
</> className="list-disc ml-4"><>

                      <li>Parcel information</li>
                            <li
</>>Permit type and value</li>
                      <li>Neighborhood codes</li>
                    </ul>
                  </div>
                }
                width="wide"
                asSpan={true}
              >
                <Badge variant="outline" className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </ContextualTooltip>
            </div>
            <CardDescription>
              <ContextualTooltip 
                content="Upload Excel, CSV, PDF or text files containing your permit data. Our AI will analyze and automatically classify them."
                showIcon={false}
                asSpan={true}
              >
                Upload your file with permit data for intelligent AI classification
              </ContextualTooltip>
            </CardDescription>
          </div>
          <ContextualTooltip 
            content={
              <div className="space-y-1.5"><>

                <div>Download our standardized template to ensure your data is properly formatted.</div>
                <div
</> className="text-xs text-blue-700 mt-1">✓ Pre-formatted columns</div>
                <div className="text-xs text-blue-700">✓ Example data included</div>
              </div>
            }
            side="left"
            asSpan={true}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => downloadTemplate()}
            >
              <Download className="h-4 w-4" />
              <span>Download Template</span>
            </Button>
          </ContextualTooltip>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* AI capabilities alert */}
        <Alert className="mb-6 bg-purple-50 border-purple-200">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">
            <ContextualTooltip
              content="Our AI system has been trained on thousands of permit records to provide accurate classification"
              showIcon={false}
              asSpan={true}
            >
              New AI Features
            </ContextualTooltip>
          </AlertTitle>
          <AlertDescription className="text-purple-700">
            <div><>

              <div className="mt-1">Our AI can now process various file formats and intelligently map columns.</div>
              <div
</> className="mt-1">The system analyzes permit descriptions, values, and neighborhood codes to make smarter classification decisions.</div>
              <div className="mt-2 text-xs flex items-center">
                <Info className="h-3 w-3 mr-1 text-purple-600" />
                <ContextualTooltip
                  content="The AI continuously improves its classification accuracy based on feedback from your team"
                  iconOnly={true}
                  className="text-purple-600"
                  asSpan={true}
                />
                <span className="ml-1">Click on any highlighted text for additional information</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* File format tip alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" /><>

          <AlertTitle className="text-blue-800">File Format Tips</AlertTitle>
          <AlertDescription
</> className="text-blue-700">
            <div>
              <div className="mt-1">
                <ContextualTooltip
                  content={
                    <div className="space-y-1.5"><>

                      <div>Supported formats include:</div>
                      <ul
</> className="list-disc ml-4 space-y-0.5"><>

                        <li>Excel (.xlsx, .xls)</li>
                            <li
</>>CSV (.csv)</li><>

                        <li>Text files (.txt)</li>
                            <li
</>>PDF documents (.pdf)</li>
                        <li>OpenDocument (.ods)</li>
                      </ul>
                    </div>
                  }
                  width="narrow"
                  asSpan={true}
                >
                  We now support multiple file formats including Excel, CSV, and text files.
                </ContextualTooltip>
              </div>
              <div className="mt-1">
                Required field: <strong>
                  <ContextualTooltip
                    content="Parcel Number is a unique identifier for each property. It's essential for permit processing."
                    side="bottom"
                    asSpan={true}
                  >
                    Parcel Number
                  </ContextualTooltip>
                </strong> (our AI will try to identify this field automatically)
              </div>
              <div className="mt-2">
                <FeatureSpotlight
                  id="template_download"
                  title="Download Template"
                  description="Using our template ensures all required fields are included and formatted correctly."
                  position="bottom"
                  delay={1000}
                  width={280}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 bg-white"
                    onClick={() => downloadTemplate()}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Template</span>
                  </Button>
                </FeatureSpotlight>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Dropzone */}
        {!file && (
          <FeatureSpotlight
            id="drag_drop_area"
            title="Drag & Drop Files"
            description="Just drag any permit file from your computer and drop it here. You can also click to browse for files."
            position="right"
            delay={1500}
            width={280}
          >
            <div
              className={`flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg hover:border-primary-400 transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FileSpreadsheet className="h-14 w-14 text-gray-400 mx-1" /><>

                  <FileText className="h-14 w-14 text-gray-400 mx-1" />
                </div>
                <div
</> className="mb-2 text-sm font-medium text-gray-700"><>

                  <span>Drag and drop your file here or </span>
                  <span
</> className="text-primary font-semibold">browse files</span>
                </div><>

                <div className="text-xs text-gray-500">
                  Supported formats: Excel, CSV, Text, PDF, and more
                </div>
                <div
</> className="text-xs mt-2 text-purple-600 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span>
                    <ContextualTooltip
                      content={
                        <div className="space-y-1.5"><>

                          <div>The AI processing works in 3 steps:</div>
                          <ol
</> className="list-decimal ml-4 space-y-0.5"><>

                            <li>Extract and identify data fields</li>
                            <li
</>>Validate property information</li>
                            <li>Classify permits based on business rules</li>
                          </ol>
                        </div>
                      }
                      width="wide"
                      showIcon={false}
                      asSpan={true}
                    >
                      AI will analyze and extract permit data
                    </ContextualTooltip>
                  </span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="fileInput"
                className="hidden"
                accept=".xlsx,.xls,.csv,.txt,.pdf,.ods"
                onChange={handleFileInputChange}
              />
            </div>
          </FeatureSpotlight>
        )}
        
        {/* Contextual Help for Upload Process */}
        {/* TODO: Update with correct ContextualHelp component usage */}
        <div className="mt-4 mb-4 text-center">
          <small className="text-gray-500">Need help? Click on any highlighted element for information.</small>
        </div>

        {/* Selected file info */}
        {file && !uploadMutation.isPending && (
          <>
            <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.type)}<>

                  <span className="text-sm font-medium text-gray-800">{file.name}</span>
                  <span
</> className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3"><>

              <Button 
                variant="outline" 
                onClick={handleRemoveFile}
              >
                Cancel
              </Button>
              <FeatureSpotlight
</>
                id="process_button"
                title="AI Processing"
                description="Click here to begin the automated AI classification process for your permit data."
                position="left"
                delay={2000}
                width={280}
              >
                <Button 
                  onClick={handleProcessFile}
                  className="flex items-center gap-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  data-tour="process_file_button"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Process with AI</span>
                </Button>
              </FeatureSpotlight>
            </div>
          </>
        )}

        {/* Upload progress */}
        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-purple-700 flex items-center">
                <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                <span>AI Processing</span>
              </span>
              <span className="text-sm font-medium text-purple-700">
                {uploadMutation.isPending ? "In progress..." : "100%"}
              </span>
            </div>
            <Progress 
              value={uploadMutation.isPending ? 75 : 100} 
              className="h-2.5 bg-purple-100" 
            />
            <div className="mt-3 bg-purple-50 rounded-md p-2 border border-purple-200">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center text-xs text-purple-700">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  <span>Analyzing file structure</span>
                </div>
                <div className="flex items-center text-xs text-purple-700">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  <span>Mapping columns to permit fields</span>
                </div>
                <div className="flex items-center text-xs text-purple-700">
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-3 w-3 mr-1 text-purple-600 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                  )}
                  <span>Classifying permits with AI</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-gray-50">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <div className="mt-0.5">
            <ContextualTooltip
              content={
                <div className="space-y-1.5"><>

                  <div className="font-semibold">Tips for Successful Processing:</div>
                  <ul
</> className="list-disc ml-4 space-y-0.5"><>

                    <li>Make sure your data has clear column headers</li>
                            <li
</>>Include Parcel Number for each permit entry</li><>

                    <li>Provide complete address information when available</li>
                            <li
</>>Use consistent formatting for dates and currency values</li>
                  </ul>
                </div>
              }
              width="wide"
              iconOnly={true}
              className="text-blue-500 h-4 w-4"
              asSpan={true}
            />
          </div>
          <div>
            <div className="text-sm">
              <ContextualTooltip
                content="Our template contains all required fields in the correct format, saving you time and ensuring accurate classification."
                showIcon={false}
                asSpan={true}
              >
                Having trouble with your file? Download our template and fill it with your permit data for best results.
              </ContextualTooltip>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              <ContextualTooltip
                content={
                  <div className="space-y-1.5"><>

                    <div className="font-semibold">Our business rules consider:</div>
                    <ul
</> className="list-disc ml-4 space-y-0.5"><>

                      <li>Permit type and value</li>
                            <li
</>>Property location and zoning</li><>

                      <li>Historical permit data</li>
                            <li
</>>Regulatory requirements</li>
                    </ul>
                  </div>
                }
                side="top"
                showIcon={false}
                asSpan={true}
              >
                All permits will be classified automatically based on our business rules.
              </ContextualTooltip>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UploadForm;
