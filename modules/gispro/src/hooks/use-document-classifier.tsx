import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getDocumentTypeLabel } from '@shared/document-types';

export type ClassificationResult = {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  wasManuallyClassified?: boolean;
};

interface UploadWithClassificationParams {
  workflowId?: number;
  name: string;
  content: string;
}

interface UploadWithClassificationResult {
  document: {
    id: number;
    name: string;
    type: string;
    [key: string]: any;
  };
  classification: ClassificationResult;
}

export function useDocumentClassifier() {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // Function to classify document text directly
  const classifyDocument = async (documentText: string): Promise<ClassificationResult> => {
    setIsProcessing(true);
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/documents/classify',
        { content: documentText }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to classify document');
      }
      
      const result = await response.json();
      
      // Enhance result with label
      return {
        ...result,
        documentTypeLabel: getDocumentTypeLabel(result.documentType)
      };
    } catch (error) {
      toast({
        title: 'Classification Error',
        description: error instanceof Error ? error.message : 'Failed to classify document',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to upload a document and get its classification in one step
  const uploadWithClassification = async ({
    workflowId,
    name,
    content
  }: UploadWithClassificationParams): Promise<UploadWithClassificationResult> => {
    setIsUploading(true);
    
    try {
      const response = await apiRequest(
        'POST',
        '/api/documents',
        {
          workflowId,
          name,
          content,
          autoClassify: true
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      const result = await response.json();
      
      // Transform result to expected format
      return {
        document: result,
        classification: {
          documentType: result.type,
          documentTypeLabel: getDocumentTypeLabel(result.type),
          confidence: result.classification?.confidence || 0.95,
          wasManuallyClassified: result.classification?.wasManuallyClassified || false
        }
      };
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Mock classifier for demo purposes when backend is not available
  const mockClassify = async (documentText: string): Promise<ClassificationResult> => {
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Simple keyword-based classification
      const text = documentText.toLowerCase();
      
      let documentType = 'unclassified';
      let confidence = 0.5;
      
      if (text.includes('plat') || text.includes('survey')) {
        if (text.includes('plat') && text.includes('map')) {
          documentType = 'plat_map';
          confidence = 0.92;
        } else if (text.includes('survey')) {
          documentType = 'survey';
          confidence = 0.88;
        }
      } else if (text.includes('deed') || text.includes('convey') || text.includes('warranty')) {
        documentType = 'deed';
        confidence = 0.87;
      } else if (text.includes('legal description') || text.includes('metes and bounds')) {
        documentType = 'legal_description';
        confidence = 0.85;
      } else if (text.includes('boundary') && text.includes('adjust')) {
        documentType = 'boundary_line_adjustment';
        confidence = 0.82;
      } else if (text.includes('tax') && (text.includes('form') || text.includes('payment'))) {
        documentType = 'tax_form';
        confidence = 0.78;
      }
      
      return {
        documentType,
        documentTypeLabel: getDocumentTypeLabel(documentType),
        confidence,
        wasManuallyClassified: false
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Return public API
  return {
    classifyDocument,
    uploadWithClassification,
    mockClassify,
    isUploading,
    isProcessing
  };
}