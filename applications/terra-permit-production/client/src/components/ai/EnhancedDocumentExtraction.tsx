import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { askComplexQuestion } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { AlertCircle, 
  ArrowDownToLine, 
  Bot, 
  BrainCircuit, 
  Check, 
  CheckCircle2, 
  ClipboardList, 
  Cog, 
  Database, 
  Download, 
  Eye, 
  File, 
  FileStack, 
  FileText, 
  Filter, 
  Fingerprint, 
  History, 
  Layers, 
  Loader2, 
  RotateCw, 
  Search, 
  Settings, 
  Sparkles, 
  UploadCloud, 
  Workflow, 
  Zap,
  GitMerge,
  Refresh,
  FileSearch
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface EnhancedDocumentExtractionProps {
  className?: string;
}

interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  verified: boolean;
  corrected: boolean;
  originalValue?: string;
}

interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'enumeration' | 'custom';
  description: string;
  status: 'passed' | 'failed' | 'warning';
}

interface ExtractedDocument {
  id: string;
  filename: string;
  documentType: string;
  uploadedAt: string;
  fileSize: number;
  pageCount: number;
  processingTimeMs: number;
  status: 'pending' | 'processing' | 'processed' | 'error' | 'verified';
  extractedFields: ExtractedField[];
  validationRules: ValidationRule[];
  validationScore: number;
  structuredData: Record<string, any>;
  matchedTemplate?: string;
  detectedLanguage?: string;
  processingSteps: Array<{
    name: string;
    status: 'success' | 'warning' | 'error';
    durationMs: number;
    details?: string;
  }>;
  history: {
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }[];
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  fieldDefinitions: {
    name: string;
    type: string;
    required: boolean;
    format?: string;
  }[];
  matchingScore: number;
}

interface ExtractorMetrics {
  accuracy: number;
  processingSpeed: number;
  failureRate: number;
  automationRate: number;
  improvementRate: number;
  confidenceThreshold: number;
}

export function EnhancedDocumentExtraction({ className = '' }: EnhancedDocumentExtractionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedDocuments, setExtractedDocuments] = useState<ExtractedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ExtractedDocument | null>(null);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [extractorMetrics, setExtractorMetrics] = useState<ExtractorMetrics | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTrainingModel, setIsTrainingModel] = useState(false);
  const [isAutoCorrectEnabled, setIsAutoCorrectEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<ExtractedDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize with demo data
  useEffect(() => {
    // Demo document templates
    setDocumentTemplates([
      {
        id: "template-01",
        name: "Building Permit Application",
        description: "Standard building permit application template with 15 key fields",
        fieldDefinitions: [
          { name: "permitNumber", type: "string", required: true, format: "P-\\d{5}" },
          { name: "applicantName", type: "string", required: true },
          { name: "propertyAddress", type: "string", required: true },
          { name: "permitType", type: "string", required: true },
          { name: "estimatedValue", type: "currency", required: true },
        ],
        matchingScore: 98
      },
      {
        id: "template-02",
        name: "Zoning Verification Form",
        description: "Zoning verification document for property classification",
        fieldDefinitions: [
          { name: "propertyID", type: "string", required: true },
          { name: "zoneCode", type: "string", required: true },
          { name: "ownerName", type: "string", required: true },
          { name: "verificationDate", type: "date", required: true },
        ],
        matchingScore: 85
      },
      {
        id: "template-03",
        name: "Inspection Report",
        description: "Post-construction inspection report template",
        fieldDefinitions: [
          { name: "inspectionID", type: "string", required: true },
          { name: "inspectorName", type: "string", required: true },
          { name: "propertyAddress", type: "string", required: true },
          { name: "inspectionDate", type: "date", required: true },
          { name: "status", type: "string", required: true },
        ],
        matchingScore: 92
      }
    ]);

    // Demo extractor metrics
    setExtractorMetrics({
      accuracy: 94.7,
      processingSpeed: 2.3, // pages per second
      failureRate: 1.8,
      automationRate: 87.5,
      improvementRate: 3.2, // month-over-month
      confidenceThreshold: 85
    });
  }, []);

  // Filter documents based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredDocuments(extractedDocuments);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = extractedDocuments.filter(doc => 
      doc.filename.toLowerCase().includes(query) ||
      doc.documentType.toLowerCase().includes(query) ||
      doc.extractedFields.some(field => 
        field.name.toLowerCase().includes(query) || 
        field.value.toLowerCase().includes(query)
      )
    );
    
    setFilteredDocuments(filtered);
  }, [searchQuery, extractedDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Reset input value so the same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const startExtraction = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one document to extract data.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate document extraction with a delay
      // In a real implementation, we would send the files to the backend for processing
      const extractedDocs: ExtractedDocument[] = [];
      
      for (const file of files) {
        // In a real implementation, this would be an API call to process the document
        // For this demo, we'll simulate the result after a short delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate a simulated document extraction result
        const doc = generateSimulatedExtraction(file);
        extractedDocs.push(doc);
      }
      
      setExtractedDocuments(prev => [...prev, ...extractedDocs]);
      setActiveTab('documents');
      
      if (extractedDocs.length > 0) {
        setSelectedDocument(extractedDocs[0]);
      }
      
      // Clear files after successful processing
      setFiles([]);
      
      toast({
        title: "Extraction Complete",
        description: `Successfully processed ${extractedDocs.length} document(s)`,
        variant: "default",
      });
    } catch (err: any) {
      console.error('Error extracting document data:', err);
      
      if (err.message?.includes('OpenAI API key') || 
          err.message?.includes('not configured') || 
          err.message?.includes('missing or invalid')) {
        setError('OpenAI API key is missing or invalid. Please configure it in settings to use advanced AI features.');
      } else {
        setError(`Failed to extract document data: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = () => {
    if (!selectedDocument) return;
    
    setIsVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      setExtractedDocuments(docs => docs.map(doc => 
        doc.id === selectedDocument.id 
          ? {
              ...doc,
              status: 'verified',
              extractedFields: doc.extractedFields.map(field => ({
                ...field,
                verified: true
              })),
              validationScore: 100,
              validationRules: doc.validationRules.map(rule => ({
                ...rule,
                status: 'passed'
              })),
              history: [
                {
                  timestamp: new Date().toISOString(),
                  action: 'Verification',
                  user: 'Current User',
                  details: 'Document verified manually'
                },
                ...doc.history
              ]
            }
          : doc
      ));
      
      setIsVerifying(false);
      
      toast({
        title: "Document Verified",
        description: "All fields have been verified and marked as correct.",
      });
    }, 2000);
  };

  const handleTrainModel = () => {
    setIsTrainingModel(true);
    
    // Simulate training process
    setTimeout(() => {
      // Update metrics to show improvement
      if (extractorMetrics) {
        setExtractorMetrics({
          ...extractorMetrics,
          accuracy: Math.min(extractorMetrics.accuracy + 0.8, 99.9),
          automationRate: Math.min(extractorMetrics.automationRate + 1.5, 99),
          failureRate: Math.max(extractorMetrics.failureRate - 0.3, 0.1),
          improvementRate: extractorMetrics.improvementRate + 0.5
        });
      }
      
      setIsTrainingModel(false);
      
      toast({
        title: "Model Training Complete",
        description: "The extraction model has been updated with the latest document samples.",
      });
    }, 3000);
  };

  const handleFieldCorrection = (documentId: string, fieldName: string, newValue: string) => {
    setExtractedDocuments(docs => docs.map(doc => 
      doc.id === documentId 
        ? {
            ...doc,
            extractedFields: doc.extractedFields.map(field => 
              field.name === fieldName 
                ? {
                    ...field,
                    value: newValue,
                    originalValue: field.originalValue || field.value,
                    corrected: true,
                    confidence: 100
                  }
                : field
            ),
            history: [
              {
                timestamp: new Date().toISOString(),
                action: 'Field Correction',
                user: 'Current User',
                details: `Corrected field "${fieldName}"`
              },
              ...doc.history
            ]
          }
        : doc
    ));
    
    toast({
      title: "Field Updated",
      description: `Field "${fieldName}" has been corrected.`,
    });
  };

  const handleExportDocument = (format: 'json' | 'csv' | 'xml') => {
    if (!selectedDocument) return;
    
    toast({
      title: "Document Exported",
      description: `Document has been exported in ${format.toUpperCase()} format.`,
    });
  };

  const handleCreatePermit = () => {
    if (!selectedDocument) return;
    
    toast({
      title: "Permit Created",
      description: "A new permit has been created from the extracted document data.",
    });
  };

  // Simulate document extraction for demonstration purposes
  const generateSimulatedExtraction = (file: File): ExtractedDocument => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const documentTypes = [
      'Building Permit Application', 
      'Zoning Compliance Certificate', 
      'Site Plan Review', 
      'Inspection Report',
      'Certificate of Occupancy',
      'Variance Request'
    ];
    
    const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
    const docId = Math.random().toString(36).substring(2, 10);
    const uploadedAt = new Date().toISOString();
    const fileSize = file.size;
    const pageCount = Math.floor(Math.random() * 5) + 1;
    const processingTimeMs = Math.floor(Math.random() * 5000) + 1000;
    
    // Generate extracted fields based on document type
    const extractedFields: ExtractedField[] = generateFieldsForDocType(docType);
    
    // Generate validation rules
    const validationRules: ValidationRule[] = [
      {
        id: `rule-${Math.random().toString(36).substring(2, 6)}`,
        field: 'permitNumber',
        type: 'format',
        description: 'Permit number must follow format P-XXXXX',
        status: Math.random() > 0.9 ? 'warning' : 'passed'
      },
      {
        id: `rule-${Math.random().toString(36).substring(2, 6)}`,
        field: 'applicantName',
        type: 'required',
        description: 'Applicant name is required',
        status: 'passed'
      },
      {
        id: `rule-${Math.random().toString(36).substring(2, 6)}`,
        field: 'propertyAddress',
        type: 'required',
        description: 'Property address is required',
        status: Math.random() > 0.95 ? 'failed' : 'passed'
      },
      {
        id: `rule-${Math.random().toString(36).substring(2, 6)}`,
        field: 'estimatedValue',
        type: 'range',
        description: 'Estimated value must be greater than 0',
        status: 'passed'
      }
    ];
    
    // Calculate validation score based on rule statuses
    const passedRules = validationRules.filter(rule => rule.status === 'passed').length;
    const validationScore = Math.round((passedRules / validationRules.length) * 100);
    
    // Generate processing steps
    const processingSteps: Array<{
      name: string;
      status: 'success' | 'warning' | 'error';
      durationMs: number;
      details?: string;
    }> = [
      {
        name: 'Document Classification',
        status: 'success',
        durationMs: Math.floor(Math.random() * 500) + 100,
      },
      {
        name: 'OCR Processing',
        status: 'success',
        durationMs: Math.floor(Math.random() * 2000) + 500,
      },
      {
        name: 'Field Extraction',
        status: Math.random() > 0.9 ? 'warning' : 'success',
        durationMs: Math.floor(Math.random() * 1000) + 300,
        details: Math.random() > 0.9 ? 'Some fields had low confidence scores' : undefined
      },
      {
        name: 'Validation',
        status: Math.random() > 0.95 ? 'error' : 'success',
        durationMs: Math.floor(Math.random() * 500) + 100,
        details: Math.random() > 0.95 ? 'Failed to validate all required fields' : undefined
      },
      {
        name: 'Data Structuring',
        status: 'success',
        durationMs: Math.floor(Math.random() * 300) + 50,
      }
    ];
    
    // Generate document history
    const history = [
      {
        timestamp: new Date().toISOString(),
        action: 'Upload',
        user: 'Current User',
        details: `Document uploaded and processed (${pageCount} pages)`
      },
      {
        timestamp: new Date(Date.now() - 1000).toISOString(),
        action: 'Extraction',
        user: 'System',
        details: `Extracted ${extractedFields.length} fields with ${validationScore}% validation score`
      }
    ];
    
    // Create structured data object
    const structuredData: Record<string, any> = {};
    extractedFields.forEach(field => {
      structuredData[field.name] = field.value;
    });
    
    return {
      id: docId,
      filename: file.name,
      documentType: docType,
      uploadedAt,
      fileSize,
      pageCount,
      processingTimeMs,
      status: validationScore >= 95 ? 'processed' : (validationScore >= 80 ? 'processing' : 'error'),
      extractedFields,
      validationRules,
      validationScore,
      structuredData,
      matchedTemplate: documentTemplates.find(t => t.name === docType)?.id,
      detectedLanguage: 'English',
      processingSteps,
      history
    };
  };

  const generateFieldsForDocType = (docType: string): ExtractedField[] => {
    const commonFields: Partial<ExtractedField>[] = [
      { name: 'documentTitle', value: docType },
      { name: 'processingDate', value: new Date().toLocaleDateString() }
    ];
    
    let typeSpecificFields: Partial<ExtractedField>[] = [];
    
    // Generate fields based on document type
    switch (docType) {
      case 'Building Permit Application':
        typeSpecificFields = [
          { name: 'permitNumber', value: `P-${Math.floor(10000 + Math.random() * 90000)}` },
          { name: 'applicantName', value: "John Smith" },
          { name: 'propertyAddress', value: `${Math.floor(100 + Math.random() * 9900)} Main St` },
          { name: 'permitType', value: "New Construction" },
          { name: 'estimatedValue', value: `$${Math.floor(100000 + Math.random() * 900000)}` },
          { name: 'submissionDate', value: new Date().toLocaleDateString() },
          { name: 'projectDescription', value: "Construction of new residential building" },
          { name: 'zoningDistrict', value: ['R-1', 'R-2', 'C-1', 'M-1'][Math.floor(Math.random() * 4)] },
          { name: 'parcelNumber', value: `${Math.floor(1000000 + Math.random() * 9000000)}` },
          { name: 'contactPhone', value: `(${Math.floor(100 + Math.random() * 900)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}` }
        ];
        break;
        
      case 'Zoning Compliance Certificate':
        typeSpecificFields = [
          { name: 'certificateNumber', value: `ZC-${Math.floor(10000 + Math.random() * 90000)}` },
          { name: 'propertyOwner', value: "Jane Doe" },
          { name: 'propertyAddress', value: `${Math.floor(100 + Math.random() * 9900)} Oak Ave` },
          { name: 'zoningDistrict', value: ['R-1', 'R-2', 'C-1', 'M-1'][Math.floor(Math.random() * 4)] },
          { name: 'allowedUses', value: "Residential, Single Family" },
          { name: 'issueDate', value: new Date().toLocaleDateString() },
          { name: 'expirationDate', value: new Date(Date.now() + 31536000000).toLocaleDateString() },
          { name: 'parcelNumber', value: `${Math.floor(1000000 + Math.random() * 9000000)}` },
          { name: 'certifyingOfficial', value: "William Johnson" }
        ];
        break;
        
      case 'Inspection Report':
        typeSpecificFields = [
          { name: 'inspectionNumber', value: `INS-${Math.floor(10000 + Math.random() * 90000)}` },
          { name: 'inspectorName', value: "Robert Brown" },
          { name: 'propertyAddress', value: `${Math.floor(100 + Math.random() * 9900)} Maple Dr` },
          { name: 'inspectionDate', value: new Date().toLocaleDateString() },
          { name: 'inspectionType', value: "Final" },
          { name: 'result', value: ["Pass", "Fail", "Conditional Pass"][Math.floor(Math.random() * 3)] },
          { name: 'comments', value: "All items inspected and approved." },
          { name: 'followUpRequired', value: Math.random() > 0.7 ? "Yes" : "No" },
          { name: 'permitReference', value: `P-${Math.floor(10000 + Math.random() * 90000)}` }
        ];
        break;
        
      default:
        typeSpecificFields = [
          { name: 'documentId', value: `DOC-${Math.floor(10000 + Math.random() * 90000)}` },
          { name: 'subject', value: "General Permit Documentation" },
          { name: 'issueDate', value: new Date().toLocaleDateString() }
        ];
    }
    
    // Combine fields and add confidence values
    const allFields = [...commonFields, ...typeSpecificFields];
    
    return allFields.map(field => ({
      name: field.name!,
      value: field.value!,
      confidence: Math.min(99, Math.max(70, Math.floor(Math.random() * 30) + 70)),
      verified: false,
      corrected: false
    }));
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500/20 text-green-700">Passed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-700">Warning</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-700">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-500/20 text-green-700">Processed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-700">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-700">Error</Badge>;
      case 'verified':
        return <Badge className="bg-purple-500/20 text-purple-700">Verified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProcessingStepBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-700">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-700">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-700">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge className="bg-green-500/20 text-green-700">{confidence}%</Badge>;
    } else if (confidence >= 80) {
      return <Badge className="bg-yellow-500/20 text-yellow-700">{confidence}%</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-700">{confidence}%</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-70 mb-4" />
          <div><>

            <h3 className="text-lg font-medium mb-1">Processing Documents</h3>
            <p
</> className="text-sm text-muted-foreground">
              Our AI is analyzing documents and extracting structured data...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-20 seconds per document
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Extraction Error</AlertTitle>
            <AlertDescription
</>>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/settings?highlight=openai_key'}
              className="mx-auto"
            >
              Configure API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl"><>

              <FileSearch className="h-5 w-5 text-primary" />
              Enhanced Document Extraction
            </CardTitle>
            <CardDescription
</>>
              AI-powered document understanding with self-optimizing extraction pipeline
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-correct"
                checked={isAutoCorrectEnabled}
                onCheckedChange={setIsAutoCorrectEnabled}
              />
              <Label htmlFor="auto-correct" className="text-xs">Auto-Correct</Label>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleTrainModel}
              disabled={isTrainingModel || extractedDocuments.length === 0}
              className="text-xs"
            >
              {isTrainingModel ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
                  Train Model
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-4 w-full"><>

            <TabsTrigger value="upload" className="text-xs">Upload Documents</TabsTrigger>
            <TabsTrigger
</> value="documents" className="text-xs" disabled={extractedDocuments.length === 0}>
              Processed Documents
              {extractedDocuments.length > 0 && ` (${extractedDocuments.length})`}
            </TabsTrigger><>

            <TabsTrigger value="templates" className="text-xs">Document Templates</TabsTrigger>
            <TabsTrigger
</> value="analytics" className="text-xs">Extraction Analytics</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="upload" className="m-0">
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff,.txt,.csv,.xlsx,.xls"
                className="hidden"
              />
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><>

              <h3 className="text-lg font-medium mb-1">Upload Documents</h3>
              <p
</> className="text-sm text-muted-foreground mb-4">
                Drag and drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, TIF, TXT, CSV, XLSX, XLS
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6"><>

                <h3 className="text-sm font-medium mb-2">Uploaded Files ({files.length})</h3>
                <div
</> className="space-y-2">
                  {files.map((file /* , index */) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" /><>

                        <span className="text-sm truncate max-w-[250px]">
                          {file.name}
                        </span>
                        <span
</> className="text-xs text-muted-foreground ml-2">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                onClick={startExtraction} 
                disabled={files.length === 0}
                className="w-full"
              >
                <Zap className="h-4 w-4 mr-2" />
                Process Documents
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="documents" className="m-0">
          <div className="p-4">
            <div className="mb-4"><>

              <Label htmlFor="document-search" className="text-sm">Search Documents</Label>
              <div
</> className="flex items-center mt-1">
                <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                <Input 
                  id="document-search"
                  placeholder="Search by filename, type, or content..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 h-[500px] gap-4">
              <div className="col-span-1 border rounded-md">
                <div className="p-3 border-b bg-muted/30">
                  <h3 className="text-sm font-medium">Document List</h3>
                </div>
                <ScrollArea className="h-[455px]">
                  <div className="p-2 space-y-2">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map(doc => (
                        <div 
                          key={doc.id}
                          className={`p-2 rounded-md cursor-pointer ${
                            selectedDocument?.id === doc.id 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="flex items-start gap-2">
                            <File className="h-4 w-4 mt-0.5 text-primary" />
                            <div className="flex-1 min-w-0"><>

                              <div className="text-sm font-medium truncate">{doc.filename}</div>
                              <div
</> className="flex justify-between items-center mt-1">
                                <div className="text-xs text-muted-foreground truncate">
                                  {doc.documentType}
                                </div>
                                {getStatusBadge(doc.status)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(doc.uploadedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        {searchQuery ? 'No documents match your search' : 'No documents processed yet'}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="col-span-2 border rounded-md">
                {selectedDocument ? (
                  <>
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                      <div className="flex items-center"><>

                        <h3 className="text-sm font-medium">{selectedDocument.filename}</h3>
                        <div
</> className="ml-2">{getStatusBadge(selectedDocument.status)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-xs"><>

                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Document
                        </Button>
                        <Button
</>
                          variant="outline"
                          size="sm"
                          onClick={handleVerifyDocument}
                          disabled={isVerifying || selectedDocument.status === 'verified'}
                          className="text-xs"
                        >
                          {isVerifying ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Verify All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="fields" className="w-full">
                      <div className="px-3 pt-2">
                        <TabsList className="grid grid-cols-5 w-full"><>

                          <TabsTrigger value="fields" className="text-xs">Extracted Fields</TabsTrigger>
                          <TabsTrigger
</> value="validation" className="text-xs">Validation</TabsTrigger><>

                          <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
                          <TabsTrigger
</> value="history" className="text-xs">History</TabsTrigger>
                          <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <ScrollArea className="h-[400px]">
                        <TabsContent value="fields" className="p-4 m-0">
                          <div className="mb-3 flex justify-between items-center"><>

                            <h4 className="text-sm font-medium">Extracted Fields</h4>
                            <div
</> className="text-xs text-muted-foreground">
                              {selectedDocument.extractedFields.length} fields extracted
                            </div>
                          </div>
                          
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow><>

                                  <TableHead className="w-[180px]">Field</TableHead>
                                  <TableHead
</>>Value</TableHead><>

                                  <TableHead className="w-[100px] text-center">Confidence</TableHead>
                                  <TableHead
</> className="w-[80px] text-center">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedDocument.extractedFields.map((field /* , index */) => (
                                  <TableRow key={index}><>

                                    <TableCell className="font-medium text-xs">
                                      {field.name}
                                    </TableCell>
                                    <TableCell
</>>
                                      {field.verified || !isAutoCorrectEnabled ? (
                                        <div className="text-xs">{field.value}</div>
                                      ) : (
                                        <Input 
                                          className="text-xs h-7"
                                          value={field.value}
                                          onChange={(e) => handleFieldCorrection(selectedDocument.id, field.name, e.target.value)}
                                        />
                                      )}
                                      {field.corrected && field.originalValue && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Original: {field.originalValue}
                                        </div>
                                      )}
                                    </TableCell><>

                                    <TableCell className="text-center">
                                      {getConfidenceBadge(field.confidence)}
                                    </TableCell>
                                    <TableCell
</> className="text-center">
                                      {field.verified ? (
                                        <Badge className="bg-green-500/20 text-green-700">Verified</Badge>
                                      ) : field.corrected ? (
                                        <Badge className="bg-blue-500/20 text-blue-700">Corrected</Badge>
                                      ) : (
                                        <Badge variant="outline">Unverified</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="validation" className="p-4 m-0">
                          <div className="mb-3 flex justify-between items-center"><>

                            <h4 className="text-sm font-medium">Validation Results</h4>
                            <div
</> className="flex items-center gap-2"><>

                              <span className="text-xs text-muted-foreground">
                                Validation Score:
                              </span>
                              <Progress
</> 
                                value={selectedDocument.validationScore} 
                                className="w-[100px] h-2"
                              />
                              <span className="text-xs font-medium">
                                {selectedDocument.validationScore}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow><>

                                  <TableHead className="w-[180px]">Field</TableHead>
                                  <TableHead
</>>Rule</TableHead>
                                  <TableHead className="w-[100px] text-right">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedDocument.validationRules.map((rule /* , index */) => (
                                  <TableRow key={index}><>

                                    <TableCell className="font-medium text-xs">
                                      {rule.field}
                                    </TableCell>
                                    <TableCell
</> className="text-xs">
                                      <div className="flex items-center">
                                        <Badge variant="outline" className="mr-2 text-[10px]">
                                          {rule.type}
                                        </Badge>
                                        {rule.description}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {getValidationBadge(rule.status)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="processing" className="p-4 m-0">
                          <div className="mb-3 flex justify-between items-center"><>

                            <h4 className="text-sm font-medium">Processing Steps</h4>
                            <div
</> className="text-xs text-muted-foreground">
                              Completed in {(selectedDocument.processingTimeMs / 1000).toFixed(2)}s
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {selectedDocument.processingSteps.map((step /* , index */) => (
                              <div key={index} className="border rounded-md p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="text-sm font-medium">{step.name}</h5>
                                    {step.details && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {step.details}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-xs">
                                      {(step.durationMs / 1000).toFixed(2)}s
                                    </div>
                                    {getProcessingStepBadge(step.status)}
                                  </div>
                                </div>
                                
                                {index < selectedDocument.processingSteps.length - 1 && (
                                  <div className="flex justify-center mt-2">
                                    <GitMerge className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4"><>

                            <h4 className="text-sm font-medium mb-2">Document Info</h4>
                            <div
</> className="grid grid-cols-3 gap-3">
                              <div className="border rounded-md p-2"><>

                                <div className="text-xs text-muted-foreground">File Size</div>
                                <div
</> className="text-sm font-medium">
                                  {formatFileSize(selectedDocument.fileSize)}
                                </div>
                              </div>
                              <div className="border rounded-md p-2"><>

                                <div className="text-xs text-muted-foreground">Pages</div>
                                <div
</> className="text-sm font-medium">
                                  {selectedDocument.pageCount}
                                </div>
                              </div>
                              <div className="border rounded-md p-2"><>

                                <div className="text-xs text-muted-foreground">Language</div>
                                <div
</> className="text-sm font-medium">
                                  {selectedDocument.detectedLanguage}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Matched Template</h4>
                            {selectedDocument.matchedTemplate ? (
                              <div className="border rounded-md p-3"><>

                                <div className="text-sm font-medium">
                                  {documentTemplates.find(t => t.id === selectedDocument?.matchedTemplate)?.name || 'Unknown Template'}
                                </div>
                                <div
</> className="flex justify-between items-center mt-1"><>

                                  <div className="text-xs text-muted-foreground">
                                    Match Score:
                                  </div>
                                  <Badge
</> variant="outline" className="text-xs">
                                    {documentTemplates.find(t => t.id === selectedDocument?.matchedTemplate)?.matchingScore || 0}%
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="border rounded-md p-3 text-center text-muted-foreground text-sm">
                                No matching template found
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="history" className="p-4 m-0">
                          <div className="mb-3">
                            <h4 className="text-sm font-medium">Document History</h4>
                          </div>
                          
                          <div className="space-y-3">
                            {selectedDocument.history.map((entry /* , index */) => (
                              <div key={index} className="border rounded-md p-3">
                                <div className="flex justify-between items-start">
                                  <div><>

                                    <h5 className="text-sm font-medium">{entry.action}</h5>
                                    <p
</> className="text-xs text-muted-foreground mt-1">
                                      {entry.details}
                                    </p>
                                  </div>
                                  <div className="text-right"><>

                                    <div className="text-xs font-medium">
                                      {entry.user}
                                    </div>
                                    <div
</> className="text-xs text-muted-foreground">
                                      {new Date(entry.timestamp).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                
                                {index < selectedDocument.history.length - 1 && (
                                  <div className="flex justify-center mt-2">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="export" className="p-4 m-0">
                          <div className="mb-3">
                            <h4 className="text-sm font-medium">Export Options</h4>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <Button
                              variant="outline"
                              className="flex flex-col items-center justify-center py-6"
                              onClick={() => handleExportDocument('json')}
                            >
                              <FileText className="h-8 w-8 mb-2" />
                              <span className="text-sm">Export as JSON</span>
                            </Button>
                            <Button
                              variant="outline"
                              className="flex flex-col items-center justify-center py-6"
                              onClick={() => handleExportDocument('csv')}
                            >
                              <FileText className="h-8 w-8 mb-2" />
                              <span className="text-sm">Export as CSV</span>
                            </Button>
                            <Button
                              variant="outline"
                              className="flex flex-col items-center justify-center py-6"
                              onClick={() => handleExportDocument('xml')}
                            >
                              <FileText className="h-8 w-8 mb-2" />
                              <span className="text-sm">Export as XML</span>
                            </Button>
                          </div>
                          
                          <div className="border rounded-md p-4 space-y-4"><>

                            <h4 className="text-sm font-medium">Create Permit</h4>
                            <p
</> className="text-xs text-muted-foreground">
                              Create a new permit record using the extracted data from this document.
                            </p>
                            <Button onClick={handleCreatePermit}>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Create Permit from Document
                            </Button>
                          </div>
                          
                          <div className="border rounded-md p-4 mt-4 space-y-4"><>

                            <h4 className="text-sm font-medium">Integration Options</h4>
                            <div
</> className="grid grid-cols-2 gap-3">
                              <Button variant="outline" size="sm"><>

                                <Database className="h-4 w-4 mr-2" />
                                Export to Database
                              </Button>
                              <Button
</> variant="outline" size="sm">
                                <Workflow className="h-4 w-4 mr-2" />
                                Send to Workflow
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </ScrollArea>
                    </Tabs>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-6">
                    <div>
                      <FileStack className="h-10 w-10 mx-auto text-muted-foreground mb-4" /><>

                      <h3 className="text-lg font-medium mb-1">No Document Selected</h3>
                      <p
</> className="text-sm text-muted-foreground">
                        Select a document from the list to view extraction results
                      </p>
                      {extractedDocuments.length === 0 && (
                        <Button 
                          variant="outline"
                          className="mt-4"
                          onClick={() => setActiveTab('upload')}
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Upload Documents
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="m-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4"><>

              <h3 className="text-sm font-medium">Document Templates</h3>
              <Button
</> variant="outline" size="sm" className="text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Create New Template
              </Button>
            </div>
            
            <div className="grid gap-4">
              {documentTemplates.map(template => (
                <div key={template.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div><>

                      <h4 className="text-sm font-medium">{template.name}</h4>
                      <p
</> className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {template.matchingScore}% accuracy
                    </Badge>
                  </div>
                  
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow><>

                          <TableHead className="w-[180px]">Field</TableHead>
                          <TableHead
</>>Type</TableHead>
                          <TableHead className="w-[100px] text-right">Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.fieldDefinitions.map((field /* , index */) => (
                          <TableRow key={index}><>

                            <TableCell className="font-medium text-xs">
                              {field.name}
                            </TableCell>
                            <TableCell
</> className="text-xs">
                              <div className="flex items-center">
                                <Badge variant="outline" className="mr-2 text-[10px]">
                                  {field.type}
                                </Badge>
                                {field.format && (
                                  <span className="text-muted-foreground">Format: {field.format}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {field.required ? (
                                <Badge className="bg-blue-500/20 text-blue-700">Required</Badge>
                              ) : (
                                <Badge variant="outline">Optional</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" size="sm" className="text-xs"><>

                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Template
                    </Button>
                    <Button
</> variant="outline" size="sm" className="text-xs">
                      <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                      Train Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="m-0">
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Extraction Performance Metrics</h3>
              
              {extractorMetrics && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4"><>

                    <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                    <div
</> className="text-3xl font-bold">{extractorMetrics.accuracy.toFixed(1)}%</div>
                    <div className="text-xs text-green-600 mt-1">
                      +{extractorMetrics.improvementRate.toFixed(1)}% improvement
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4"><>

                    <div className="text-sm text-muted-foreground mb-1">Automation Rate</div>
                    <div
</> className="text-3xl font-bold">{extractorMetrics.automationRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      of documents processed without human intervention
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4"><>

                    <div className="text-sm text-muted-foreground mb-1">Processing Speed</div>
                    <div
</> className="text-3xl font-bold">
                      {extractorMetrics.processingSpeed.toFixed(1)}
                      <span className="text-sm font-normal ml-1">pps</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      pages per second
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-4 border rounded-md p-4"><>

              <h3 className="text-sm font-medium mb-3">Self-Optimization Process</h3>
              
              <div
</> className="space-y-3">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1"><>

                    <span>Confidence Threshold</span>
                    <span
</>>{extractorMetrics?.confidenceThreshold}%</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${extractorMetrics?.confidenceThreshold}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><>

                    <span>Lower (More Extraction)</span>
                    <span
</>>Higher (Better Accuracy)</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-2"><>

                  <h4 className="text-xs font-medium">Automated Optimizations</h4>
                  <div
</> className="grid grid-cols-3 gap-3">
                    <div className="border rounded-md p-2">
                      <div className="flex justify-between items-center"><>

                        <div className="text-xs">Dynamic Field Detection</div>
                        <Switch
</> checked={true} />
                      </div>
                    </div>
                    <div className="border rounded-md p-2">
                      <div className="flex justify-between items-center"><>

                        <div className="text-xs">Self-Healing Pipeline</div>
                        <Switch
</> checked={true} />
                      </div>
                    </div>
                    <div className="border rounded-md p-2">
                      <div className="flex justify-between items-center"><>

                        <div className="text-xs">Continuous Learning</div>
                        <Switch
</> checked={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-3"><>

                <h3 className="text-sm font-medium">Pipeline Configuration</h3>
                <Button
</> variant="outline" size="sm" className="text-xs">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Edit Pipeline
                </Button>
              </div><>

              
              <div className="text-xs text-muted-foreground mb-3">
                Advanced configurations for the document processing pipeline.
              </div>
              
              <div
</> className="space-y-3">
                <div className="border rounded-md p-3 flex justify-between items-center">
                  <div><>

                    <div className="text-sm font-medium">Pre-Processing Options</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">
                      Configure image enhancement, OCR settings, language detection
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Cog className="h-3.5 w-3.5 mr-1.5" />
                    Configure
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 flex justify-between items-center">
                  <div><>

                    <div className="text-sm font-medium">Extraction Rules</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">
                      Define custom extraction patterns, confidence thresholds, and field mappings
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Cog className="h-3.5 w-3.5 mr-1.5" />
                    Configure
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 flex justify-between items-center">
                  <div><>

                    <div className="text-sm font-medium">Validation Pipeline</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">
                      Manage validation rules, error handling, and correction strategies
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Cog className="h-3.5 w-3.5 mr-1.5" />
                    Configure
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 flex justify-between items-center">
                  <div><>

                    <div className="text-sm font-medium">Model Training</div>
                    <div
</> className="text-xs text-muted-foreground mt-1">
                      Configure training schedule, sample selection, and performance metrics
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Cog className="h-3.5 w-3.5 mr-1.5" />
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex justify-between">
          <Button variant="outline" size="sm" className="text-xs"><>

            <Refresh className="h-3.5 w-3.5 mr-1.5" />
            Reset Pipeline
          </Button>
          
          <Button
</> variant="outline" size="sm" className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Analytics
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}