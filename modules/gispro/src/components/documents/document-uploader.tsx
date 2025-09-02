import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Document } from "@shared/schema";
import { Eye, UploadCloud, FilePlus, FileText, BrainCircuit, Upload  } from '@mui/icons-material';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDocumentClassifier, ClassificationResult } from "@/hooks/use-document-classifier";
import { DocumentClassificationResult } from "./document-classification-result";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DocumentUploaderProps = {
  workflowId: number;
  documents: Document[];
  onViewDocument?: (doc: Document) => void;
};

export function DocumentUploader({ workflowId, documents, onViewDocument }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [useClassification, setUseClassification] = useState(true);
  const [showClassificationDialog, setShowClassificationDialog] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  
  const { 
    uploadWithClassification, 
    classifyDocument,
    isUploading, 
    isClassifying, 
    isProcessing 
  } = useDocumentClassifier();
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    
    try {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Use advanced document classification if enabled
        if (useClassification) {
          try {
            // For demonstration, extract text content from the file
            // In a real app, we would use proper text extraction for PDFs, OCR for images, etc.
            // For this demo, we'll just use the file name and type as the "text" to classify
            const textContent = `${file.name} ${file.type}`;
            
            // Store file info for later use
            setSelectedFile({ name: file.name, content });
            
            // Get document classification
            const classification = await classifyDocument(textContent);
            setClassificationResult(classification);
            
            // Show the classification dialog
            setShowClassificationDialog(true);
            
            // The actual upload will happen after user confirmation in the dialog
            return;
          } catch (error) {
            console.error("Error classifying document:", error);
            // Fall back to regular upload if classification fails
          }
        }
        
        // Regular document upload without classification
        const response = await apiRequest("POST", `/api/workflows/${workflowId}/documents`, {
          name: file.name,
          type: file.type,
          content: "document-content-placeholder", // In a real app, we would use the actual content
        });
        
        const newDocument = await response.json();
        
        // Invalidate documents cache
        queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
        
        toast({
          title: "Document uploaded",
          description: `Successfully uploaded ${file.name}`,
        });
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "An error occurred while reading the file",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };
  
  // Handle the final upload after classification
  const handleClassifiedUpload = async () => {
    if (!selectedFile || !classificationResult) return;
    
    try {
      await uploadWithClassification({
        workflowId,
        name: selectedFile.name,
        content: selectedFile.content,
      });
      
      // Close the dialog
      setShowClassificationDialog(false);
      setSelectedFile(null);
      setClassificationResult(null);
    } catch (error) {
      console.error("Error uploading classified document:", error);
    }
  };
  
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="text-primary-500" />;
    return <FileText className="text-primary-500" />;
  };
  
  const formatDate = (dateString: Date | null) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div><>

              <CardTitle className="text-lg font-semibold text-neutral-800">Required Documents</CardTitle>
              <CardDescription
</>
className="text-sm text-neutral-500">
                Upload and manage workflow documents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-classify" className="text-xs text-neutral-600 flex items-center gap-1"><>

                <BrainCircuit className="h-3.5 w-3.5" />
                Auto-classify
              </Label>
              <Switch
</>

                id="auto-classify" 
                checked={useClassification}
                onCheckedChange={setUseClassification} 
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="p-2 bg-primary-50 rounded-md border border-primary-200 flex items-center">
              {getFileIcon(doc.type)}
              <div className="flex-1 ml-2.5"><>

                <p className="text-sm font-medium text-primary-800">{doc.name}</p>
                <p
</>
className="text-xs text-neutral-500">Uploaded {formatDate(doc.uploadedAt)}</p>
              </div>
              <Button
                variant="ghost" 
                size="icon" 
                className="text-neutral-400 hover:text-neutral-600"
                onClick={() => onViewDocument && onViewDocument(doc)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <label className="p-2 rounded-md border border-neutral-300 border-dashed flex items-center justify-center text-neutral-500 hover:bg-neutral-50 cursor-pointer h-20">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleUpload}
              disabled={uploading || isProcessing}
            />
            <div className="text-center">
              <UploadCloud className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs">
                {isProcessing 
                  ? "Classifying document..." 
                  : uploading 
                    ? "Uploading..." 
                    : useClassification 
                      ? "Upload with ML classification" 
                      : "Upload documents"
                }
              </p>
            </div>
          </label>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline" 
              className="w-full bg-white text-primary-600 border-primary-200 hover:bg-primary-50 flex items-center justify-center"
              disabled={uploading || isProcessing}
            >
              <FilePlus className="h-4 w-4 mr-1.5" /> Upload More Documents
            </Button>
            
            {useClassification && (
              <div className="text-xs text-neutral-500 flex items-center bg-blue-50 p-2 rounded">
                <BrainCircuit className="h-3 w-3 mr-1 text-blue-500" />
                Using ML to automatically classify document types
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Classification result dialog */}
      <Dialog open={showClassificationDialog} onOpenChange={setShowClassificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><>

            <DialogTitle>Document Classification</DialogTitle>
            <DialogDescription
</>
</>>
              Machine learning has analyzed your document
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {classificationResult && (
              <Tabs defaultValue="result" className="w-full">
                <TabsList className="grid w-full grid-cols-2"><>

                  <TabsTrigger value="result">Classification</TabsTrigger>
                  <TabsTrigger
</>
value="document">Document</TabsTrigger>
                </TabsList>
                
                <TabsContent value="result" className="mt-4"><>

                  <DocumentClassificationResult 
                    classification={classificationResult} 
                    compact={true} 
                  />
                </TabsContent>
                
                <TabsContent
</>
value="document" className="mt-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-md"><>

                    <p className="text-sm font-medium">{selectedFile?.name}</p>
                    <p
</>
className="text-xs text-slate-500 mt-1">
                      Document will be classified as: <span className="font-semibold">{classificationResult.documentTypeLabel}</span>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <div className="flex justify-end gap-3"><>

            <Button 
              variant="outline" 
              onClick={() => setShowClassificationDialog(false)}
            >
              Cancel
            </Button>
            <Button
</>

              onClick={handleClassifiedUpload}
              disabled={isUploading}
              className="flex items-center gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
