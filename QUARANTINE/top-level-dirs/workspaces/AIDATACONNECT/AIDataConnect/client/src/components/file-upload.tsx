import { useCallback, useState, useMemo, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Server, Shield, AlertCircle, FileCheck, InfoIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
};

interface UploadError {
  type: 'validation' | 'network' | 'ftp' | 'server';
  message: string;
  details?: string;
}

interface UploadResult {
  id: number;
  name: string;
  success: boolean;
  message?: string;
}

export function FileUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [useFtp, setUseFtp] = useState(false);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [enableRagProcessing, setEnableRagProcessing] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [ftpConfig, setFtpConfig] = useState({
    host: "",
    port: 2121,
    user: "",
    password: "",
    secure: true,
    passive: true
  });

  // Create a function to handle the upload progress
  const createProgressHandler = useCallback((file: File) => {
    return (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    };
  }, []);

  const validateFile = useCallback((file: File): UploadError | null => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'validation',
        message: `File size exceeds maximum limit`,
        details: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
      };
    }

    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return {
        type: 'validation',
        message: `Invalid file type`,
        details: `"${file.name}" (${file.type || 'unknown type'}) is not supported. Accepted types: ${Object.values(ACCEPTED_FILE_TYPES).flat().join(', ')}`
      };
    }

    return null;
  }, []);

  const validateFtpConfig = useCallback((): string | null => {
    if (!ftpConfig.host) return "FTP host is required";
    if (!ftpConfig.port || ftpConfig.port < 1 || ftpConfig.port > 65535) return "Invalid FTP port (1-65535)";
    if (!ftpConfig.user) return "FTP username is required";
    if (!ftpConfig.password) return "FTP password is required";
    return null;
  }, [ftpConfig]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadError(null);
      setUploadProgress(0);
      setProcessingFile(false);
      setUploadedFile(null);

      // Validate file
      const fileError = validateFile(file);
      if (fileError) {
        throw new ApiError(400, fileError.message, { details: fileError.details });
      }

      // Validate FTP config
      if (useFtp) {
        const ftpError = validateFtpConfig();
        if (ftpError) {
          throw new ApiError(400, ftpError);
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("transferType", useFtp ? "ftp" : "local");
      formData.append("enableRag", enableRagProcessing ? "true" : "false");
      
      if (useFtp) {
        formData.append("ftpConfig", JSON.stringify({
          ...ftpConfig,
          port: Number(ftpConfig.port)
        }));
      }
      
      try {
        // Set up XHR for progress tracking
        const xhr = new XMLHttpRequest();
        abortControllerRef.current = new AbortController();
        
        const promise = new Promise<UploadResult>((resolve, reject) => {
          // Set up progress tracking
          xhr.upload.addEventListener('progress', createProgressHandler(file));
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.response);
                setUploadProgress(100);
                setProcessingFile(true);
                resolve(response);
              } catch (error) {
                reject(new ApiError(xhr.status, 'Failed to parse server response'));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.response);
                reject(new ApiError(xhr.status, errorData.message || 'Upload failed', errorData));
              } catch {
                reject(new ApiError(xhr.status, xhr.statusText || 'Upload failed'));
              }
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new ApiError(0, 'Network error occurred'));
          });
          
          xhr.addEventListener('abort', () => {
            reject(new ApiError(499, 'Upload canceled'));
          });
          
          xhr.addEventListener('timeout', () => {
            reject(new ApiError(408, 'Upload timed out'));
          });
          
          // Open and send the request
          xhr.open('POST', '/api/files');
          xhr.withCredentials = true;
          xhr.timeout = 120000; // 2 minutes timeout
          xhr.send(formData);
          
          // Attach abort controller
          abortControllerRef.current?.signal.addEventListener('abort', () => {
            xhr.abort();
          });
        });
        
        const result = await promise;
        
        // After upload, perform file analysis if successful
        if (result && result.id) {
          try {
            await apiRequest<void>('POST', `/api/files/${result.id}/analyze`, {
              timeoutMs: 60000 // Allow more time for analysis
            });
          } catch (error) {
            console.warn('File analysis failed but upload was successful:', error);
            // We don't throw here as the upload itself was successful
          }
        }
        
        setProcessingFile(false);
        setUploadedFile(result);
        return result;
      } catch (error) {
        // Handle different error types
        if (error instanceof ApiError) {
          setUploadError({
            type: error.status === 0 ? 'network' : 
                  error.status === 400 ? 'validation' : 
                  error.status === 408 ? 'network' : 'server',
            message: error.message,
            details: error.data?.details
          });
        } else {
          setUploadError({
            type: 'server',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
        throw error;
      } finally {
        // Clean up
        abortControllerRef.current = null;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      
      toast({
        title: "File uploaded successfully",
        description: useFtp 
          ? "Your file has been uploaded via FTP and processed" 
          : "Your file has been uploaded and processed",
        variant: "default"
      });
    },
    onError: (error: Error | ApiError) => {
      console.error('File upload error:', error);
      
      const title = error instanceof ApiError && error.status === 400 
        ? "Validation Error" 
        : "Upload Failed";
      
      const description = error instanceof ApiError && error.status === 400
        ? error.message
        : "There was a problem uploading your file. Please try again.";
      
      toast({
        title,
        description,
        variant: "destructive"
      });
    }
  });

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploadProgress(0);
      toast({
        title: "Upload canceled",
        description: "The file upload has been canceled."
      });
    }
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null);
    setUploadedFile(null);

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map((file: any) => {
        const errorMessages = file.errors.map((err: any) => {
          switch (err.code) {
            case 'file-too-large':
              return `File "${file.file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
            case 'file-invalid-type':
              return `File "${file.file.name}" has an invalid type. Supported types: ${Object.values(ACCEPTED_FILE_TYPES).flat().join(', ')}`;
            default:
              return err.message;
          }
        }).join(", ");
        return errorMessages;
      }).join("\n");

      setUploadError({
        type: 'validation',
        message: "File validation failed",
        details: errors
      });
      return;
    }

    if (acceptedFiles.length === 0) {
      setUploadError({
        type: 'validation',
        message: "Please select a valid file to upload"
      });
      return;
    }

    if (useFtp) {
      const error = validateFtpConfig();
      if (error) {
        setUploadError({
          type: 'ftp',
          message: error
        });
        return;
      }
    }

    // Only upload the first file if multiple are somehow selected
    uploadMutation.mutate(acceptedFiles[0]);
  }, [uploadMutation, useFtp, validateFtpConfig]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: ACCEPTED_FILE_TYPES,
    multiple: false,
    noClick: uploadMutation.isPending || processingFile
  });

  const supportedFileTypes = useMemo(() => {
    return Object.values(ACCEPTED_FILE_TYPES)
      .flat()
      .join(', ');
  }, []);

  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setProcessingFile(false);
  }, []);

  return (
    <div className="space-y-4">
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{uploadError.message}</AlertTitle>
          {uploadError.details && (
            <AlertDescription className="mt-2">
              {uploadError.details}
            </AlertDescription>
          )}
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-ftp"
              checked={useFtp}
              onCheckedChange={setUseFtp}
              disabled={uploadMutation.isPending || processingFile}
            />
            <Label htmlFor="use-ftp" className="flex items-center">
              <Server className="w-4 h-4 mr-1" />
              Use FTP Transfer
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-rag"
              checked={enableRagProcessing}
              onCheckedChange={setEnableRagProcessing}
              disabled={uploadMutation.isPending || processingFile}
            />
            <Label htmlFor="enable-rag" className="flex items-center">
              <FileCheck className="w-4 h-4 mr-1" />
              Enable RAG Processing
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 ml-1.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      RAG (Retrieval-Augmented Generation) processing creates embeddings from your document, 
                      enabling semantic search and AI-powered question answering based on your file content.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>
        </div>
        {useFtp && (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                disabled={uploadMutation.isPending || processingFile}
              >
                <Shield className="w-4 h-4 mr-2" />
                Configure FTP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>FTP Configuration</DialogTitle>
                <DialogDescription>
                  Configure your FTP connection settings for secure file transfers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input
                    value={ftpConfig.host}
                    onChange={(e) => setFtpConfig(prev => ({
                      ...prev,
                      host: e.target.value.trim()
                    }))}
                    placeholder="ftp.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={ftpConfig.port}
                    onChange={(e) => setFtpConfig(prev => ({
                      ...prev,
                      port: parseInt(e.target.value) || 2121
                    }))}
                    placeholder="2121"
                    required
                    min={1}
                    max={65535}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={ftpConfig.user}
                    onChange={(e) => setFtpConfig(prev => ({
                      ...prev,
                      user: e.target.value.trim()
                    }))}
                    placeholder="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={ftpConfig.password}
                    onChange={(e) => setFtpConfig(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder="password"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="secure-ftp"
                    checked={ftpConfig.secure}
                    onCheckedChange={(checked) => setFtpConfig(prev => ({
                      ...prev,
                      secure: checked
                    }))}
                  />
                  <Label htmlFor="secure-ftp">Use Secure FTP (FTPS)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="passive-ftp"
                    checked={ftpConfig.passive}
                    onCheckedChange={(checked) => setFtpConfig(prev => ({
                      ...prev,
                      passive: checked
                    }))}
                  />
                  <Label htmlFor="passive-ftp">Use Passive Mode</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Configuration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {uploadedFile ? (
        // Show success state with the option to upload another file
        <Card className="bg-muted/30 border-green-200 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileCheck className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-1">Upload Successful</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your file "{uploadedFile.name}" has been successfully uploaded and processed.
            </p>
            <Button onClick={resetUpload}>Upload Another File</Button>
          </CardContent>
        </Card>
      ) : (
        // Show the dropzone for file uploads
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors relative",
            isDragActive && !uploadMutation.isPending ? "border-primary bg-primary/10" : "border-muted-foreground/20",
            (uploadMutation.isPending || processingFile) && "opacity-80 cursor-default"
          )}
        >
          <input {...getInputProps()} disabled={uploadMutation.isPending || processingFile} />
          
          {!uploadMutation.isPending && !processingFile && (
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          )}
          
          {isDragActive && !uploadMutation.isPending && !processingFile ? (
            <p className="font-medium text-primary">Drop the file here...</p>
          ) : uploadMutation.isPending ? (
            <div className="space-y-4">
              <h3 className="font-medium">Uploading{useFtp ? " via FTP" : ""}...</h3>
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 100 
                  ? `${uploadProgress}% complete`
                  : 'Upload complete, processing file...'}
              </p>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  cancelUpload();
                }}
                size="sm"
              >
                Cancel Upload
              </Button>
            </div>
          ) : processingFile ? (
            <div className="space-y-4">
              <h3 className="font-medium">Processing file...</h3>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-sm text-muted-foreground">
                This may take a moment as we analyze and index your file
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-medium">Drag & drop a file here, or click to select</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB</p>
                <p>Supported formats: {supportedFileTypes}</p>
                {useFtp && (
                  <p className="text-primary-600 font-medium mt-2">
                    FTP transfer enabled
                  </p>
                )}
              </div>
              <Button onClick={(e) => {
                e.stopPropagation();
                open();
              }} variant="secondary">
                Browse Files
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}