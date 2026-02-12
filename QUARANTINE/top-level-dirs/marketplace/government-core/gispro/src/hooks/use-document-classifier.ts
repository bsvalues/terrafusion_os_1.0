import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export interface UploadWithClassificationParams {
  workflowId?: number;
  file: File;
}

export interface UploadWithClassificationResult {
  id: number;
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
}

export function useDocumentClassifier() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Classify document content
  const classifyMutation = useMutation({
    mutationFn: async ({ content, fileType, fileName }: { content: string; fileType?: string; fileName?: string }) => {
      const response = await fetch('/api/test/documents/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, fileType, fileName }),
      });

      if (!response.ok) {
        throw new Error('Failed to classify document');
      }

      return response.json();
    }
  });

  // Upload and classify a document in one operation
  const uploadWithClassification = useCallback(
    async ({ file, workflowId }: UploadWithClassificationParams): Promise<UploadWithClassificationResult> => {
      setIsUploading(true);
      
      try {
        // Read file as text
        const content = await readFileAsText(file);
        
        // Classify document
        const classification = await classifyMutation.mutateAsync({
          content,
          fileType: file.type,
          fileName: file.name
        });
        
        // Upload document
        const formData = new FormData();
        formData.append('file', file);
        
        if (workflowId) {
          formData.append('workflowId', workflowId.toString());
        }
        
        formData.append('documentType', classification.documentType);
        formData.append('confidence', classification.confidence.toString());
        formData.append('wasManuallyClassified', 'false');
        
        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload document');
        }
        
        const uploadResult = await uploadResponse.json();
        
        // Invalidate documents cache
        if (workflowId) {
          queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        }
        
        // Return combined result with id from upload and classification details
        return {
          id: uploadResult.id,
          documentType: classification.documentType,
          documentTypeLabel: classification.documentTypeLabel,
          confidence: classification.confidence
        };
      } catch (error) {
        toast({
          title: 'Document upload failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [classifyMutation, toast]
  );

  return {
    classifyDocument: classifyMutation.mutateAsync,
    isClassifying: classifyMutation.isPending,
    uploadWithClassification,
    isUploading,
  };
}

// Helper function to read file as text
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}