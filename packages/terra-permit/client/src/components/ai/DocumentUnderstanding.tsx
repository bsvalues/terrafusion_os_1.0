import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { askComplexQuestion } from '@/lib/langchainApi';
import { Permit } from '@/types';
import { 
  AlertCircle, 
  ArrowDownToLine, 
  Check, 
  ClipboardList, 
  Download, 
  File, 
  FileText, 
  Loader2, 
  UploadCloud, 
  Zap,
  FileSearch,
  Crosshair
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUnderstandingProps {
  className?: string;
}

interface ExtractedDocument {
  id: string;
  filename: string;
  documentType: string;
  extracted: {
    permitDetails?: {
      permitNumber?: string;
      propertyAddress?: string;
      projectDescription?: string;
      applicantName?: string;
      permitType?: string;
      submissionDate?: string;
      estimatedValue?: string;
      zoningDistrict?: string;
      parcelNumber?: string;
      propertyOwner?: string;
      squareFootage?: string;
      status?: string;
    };
    keyFields: {
      name: string;
      value: string;
      confidence: number;
    }[];
    sections: {
      title: string;
      content: string;
      relevance: number;
    }[];
  };
  confidenceScore: number;
  processingTime: string;
}

export function DocumentUnderstanding({ className = '' }: DocumentUnderstandingProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedDocuments, setExtractedDocuments] = useState<ExtractedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ExtractedDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
        description: "Please upload at least one document to extract permit data.",
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
      
      setExtractedDocuments(extractedDocs);
      setActiveTab('results');
      
      if (extractedDocs.length > 0) {
        setSelectedDocument(extractedDocs[0]);
      }
      
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

  // Simulate document extraction for demo purposes
  // In a real implementation, this would be handled by a backend API
  const generateSimulatedExtraction = (file: File): ExtractedDocument => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    const docTypes = ['Building Permit Application', 'Zoning Compliance Certificate', 'Site Plan Review', 'Inspection Report'];
    const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
    
    // Generate random permit details
    const permitNumber = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const propertyAddress = `${Math.floor(100 + Math.random() * 9900)} Main St`;
    const projectDescription = "New residential construction with detached garage";
    const applicantName = "John Smith";
    const submissionDate = new Date().toISOString().split('T')[0];
    const estimatedValue = `$${Math.floor(100000 + Math.random() * 900000)}`;
    const zoningDistrict = ['R-1', 'R-2', 'C-1', 'M-1'][Math.floor(Math.random() * 4)];
    const parcelNumber = `${Math.floor(1000000 + Math.random() * 9000000)}`;
    
    // Generate fields with confidence scores
    const keyFields = [
      { name: 'Permit Number', value: permitNumber, confidence: 0.92 + Math.random() * 0.08 },
      { name: 'Property Address', value: propertyAddress, confidence: 0.85 + Math.random() * 0.14 },
      { name: 'Applicant', value: applicantName, confidence: 0.88 + Math.random() * 0.12 },
      { name: 'Project Description', value: projectDescription, confidence: 0.75 + Math.random() * 0.2 },
      { name: 'Submission Date', value: submissionDate, confidence: 0.95 + Math.random() * 0.05 },
      { name: 'Estimated Value', value: estimatedValue, confidence: 0.82 + Math.random() * 0.15 },
      { name: 'Zoning District', value: zoningDistrict, confidence: 0.79 + Math.random() * 0.16 },
      { name: 'Parcel Number', value: parcelNumber, confidence: 0.90 + Math.random() * 0.1 }
    ];
    
    // Generate document sections
    const sections = [
      { 
        title: 'Project Information', 
        content: `This application is for a ${projectDescription.toLowerCase()} at ${propertyAddress}. The estimated project value is ${estimatedValue}.`,
        relevance: 0.95
      },
      { 
        title: 'Zoning Information', 
        content: `The property is located in ${zoningDistrict} zoning district which allows for residential construction subject to the following requirements...`,
        relevance: 0.88
      },
      { 
        title: 'Owner Information', 
        content: `The property owner is listed as ${applicantName}. Contact information: email@example.com, (555) 123-4567.`,
        relevance: 0.72
      },
      { 
        title: 'Required Inspections', 
        content: 'The project will require the following inspections: foundation, framing, electrical, plumbing, and final certificate of occupancy.',
        relevance: 0.65
      }
    ];
    
    // Calculate overall confidence score
    const confidenceScore = keyFields.reduce((sum, field) => sum + field.confidence, 0) / keyFields.length;
    
    // Random processing time between 1-5 seconds
    const processingTime = `${(1 + Math.random() * 4).toFixed(2)} seconds`;
    
    return {
      id: Math.random().toString(36).substring(2, 10),
      filename: file.name,
      documentType: docType,
      extracted: {
        permitDetails: {
          permitNumber,
          propertyAddress,
          projectDescription,
          applicantName,
          permitType: docType,
          submissionDate,
          estimatedValue,
          zoningDistrict,
          parcelNumber,
          propertyOwner: applicantName,
          squareFootage: `${Math.floor(1000 + Math.random() * 3000)} sq ft`,
          status: 'Pending'
        },
        keyFields,
        sections
      },
      confidenceScore,
      processingTime
    };
  };

  const convertToPermit = (doc: ExtractedDocument): Partial<Permit> => {
    return {
      parcelNumber: doc.extracted.permitDetails?.parcelNumber || '',
      permitDescription: doc.extracted.permitDetails?.projectDescription || '',
      value: doc.extracted.permitDetails?.estimatedValue?.replace('$', '') || '0',
      issueDate: doc.extracted.permitDetails?.submissionDate || new Date().toISOString().split('T')[0],
      // These would be determined by AI classification in a real implementation
      enterPermit: true,
      reason: 'Automatically extracted from document'
    };
  };

  return (
    <Card className={`${className} border-primary/20`}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileSearch className="h-5 w-5 text-primary" />
              Document Understanding
            </CardTitle>
            <CardDescription>
              Extract permit data from unstructured documents using AI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="text-xs">Upload Documents</TabsTrigger>
            <TabsTrigger value="results" className="text-xs" disabled={extractedDocuments.length === 0}>
              Extraction Results {extractedDocuments.length > 0 && `(${extractedDocuments.length})`}
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="upload" className="m-0">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Extraction Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
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
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tif,.tiff,.txt"
                className="hidden"
              />
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">Upload Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, TIF, TXT
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Uploaded Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm truncate max-w-[250px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(file.size / 1024).toFixed(1)} KB)
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
                disabled={files.length === 0 || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Extract Permit Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="results" className="m-0">
          <div className="grid grid-cols-3 h-[450px]">
            <div className="col-span-1 border-r">
              <div className="p-4">
                <Label className="text-xs font-medium">Processed Documents</Label>
                <ScrollArea className="h-[422px] pr-4">
                  <div className="space-y-2 mt-2">
                    {extractedDocuments.map((doc) => (
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
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{doc.filename}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {doc.documentType}
                            </div>
                            <div className="flex items-center mt-1">
                              <Badge 
                                variant={doc.confidenceScore > 0.9 ? 'default' : 'outline'}
                                className="text-[10px] py-0 px-1"
                              >
                                {Math.round(doc.confidenceScore * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            <div className="col-span-2 p-4">
              {selectedDocument ? (
                <ScrollArea className="h-[450px]">
                  <div className="space-y-4 pr-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-medium">{selectedDocument.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedDocument.documentType}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs">
                          <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                          Export
                        </Button>
                      </div>
                    </div>
                    
                    <Alert className="bg-primary/10 text-foreground border-primary/20">
                      <Crosshair className="h-4 w-4 text-primary" />
                      <AlertTitle>Processing Details</AlertTitle>
                      <AlertDescription className="text-xs">
                        Processed in {selectedDocument.processingTime} with {Math.round(selectedDocument.confidenceScore * 100)}% overall confidence
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Permit Details</h4>
                      <div className="bg-muted/30 rounded-md p-3">
                        <Table>
                          <TableBody>
                            {Object.entries(selectedDocument.extracted.permitDetails || {}).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="py-1.5 pl-2 font-medium text-xs">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs">{value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Extracted Fields</h4>
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[180px]">Field</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead className="text-right w-[100px]">Confidence</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedDocument.extracted.keyFields.map((field, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium text-xs">
                                  {field.name}
                                </TableCell>
                                <TableCell className="text-xs">{field.value}</TableCell>
                                <TableCell className="text-right">
                                  <Badge 
                                    variant={field.confidence > 0.9 ? 'default' : 'outline'}
                                    className={`text-[10px] ${
                                      field.confidence < 0.8 ? 'bg-yellow-500/10 text-yellow-700' : ''
                                    }`}
                                  >
                                    {Math.round(field.confidence * 100)}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Extracted Content</h4>
                      <div className="space-y-3">
                        {selectedDocument.extracted.sections.map((section, idx) => (
                          <div key={idx} className="border rounded-md p-3">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="text-sm font-medium">{section.title}</h5>
                              <Badge variant="outline" className="text-[10px]">
                                {Math.round(section.relevance * 100)}% relevant
                              </Badge>
                            </div>
                            <p className="text-xs">{section.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Create Permit</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Use the extracted data to create a new permit record
                      </p>
                      <Button>
                        <Check className="h-4 w-4 mr-2" />
                        Import as Permit
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-1">No Document Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a document from the list to view extraction results
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="p-4 pt-0">
        <div className="w-full flex justify-between">
          <Button variant="ghost" size="sm" className="text-xs" disabled={activeTab !== 'results'} onClick={() => setActiveTab('upload')}>
            Upload More
          </Button>
          <Button variant="outline" size="sm" className="text-xs" disabled={extractedDocuments.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}