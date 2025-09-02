import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentConfidenceIndicator } from './document-confidence-indicator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, HelpCircle  } from '@mui/icons-material';
import { Button } from '@/components/ui/button';

export interface ClassificationConfidenceCardProps {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  onReclassify?: () => void;
}

export function ClassificationConfidenceCard({
  documentType,
  documentTypeLabel,
  confidence,
  onReclassify
}: ClassificationConfidenceCardProps) {
  // Normalize confidence to 0-100 range
  const confidencePercent = Math.round(confidence * 100);
  
  // Determine confidence level
  const getConfidenceLevel = () => {
    if (confidencePercent >= 80) return 'high';
    if (confidencePercent >= 50) return 'medium';
    return 'low';
  };
  
  const confidenceLevel = getConfidenceLevel();
  
  // Helper function to get appropriate icon and text
  const getConfidenceInfo = () => {
    switch (confidenceLevel) {
      case 'high':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: 'High Confidence Classification',
          description: 'This document has been classified with high confidence. The system is very certain about this document type.'
        };
      case 'medium':
        return {
          icon: <HelpCircle className="h-5 w-5 text-yellow-500" />,
          title: 'Medium Confidence Classification',
          description: 'This document has been classified with medium confidence. Consider reviewing the classification.'
        };
      case 'low':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          title: 'Low Confidence Classification',
          description: 'This document has been classified with low confidence. We recommend reviewing and possibly reclassifying this document.'
        };
      default:
        return {
          icon: <HelpCircle className="h-5 w-5 text-slate-500" />,
          title: 'Unknown Confidence',
          description: 'The confidence for this classification is unknown.'
        };
    }
  };
  
  const confidenceInfo = getConfidenceInfo();
  
  return (
    <Card className="w-full" data-testid="confidence-card">
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg flex items-center gap-2">
          {confidenceInfo.icon}
          Document Classification
        </CardTitle>
        <CardDescription
</>>
          Confidence analysis for this document's classification
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div><>

            <span className="text-sm font-medium text-slate-500">Document Type:</span>
            <h3
</> className="text-xl font-semibold">{documentTypeLabel}</h3>
            <p className="text-xs text-slate-500">{documentType}</p>
          </div><>

          
          <DocumentConfidenceIndicator 
            confidence={confidence} 
            size="lg"
            showPercentage={true}
            data-testid="large-confidence-indicator"
          />
        </div>
        
        <Alert
</> className={`
          ${confidenceLevel === 'high' ? 'bg-green-50 text-green-800 border-green-200' : ''} 
          ${confidenceLevel === 'medium' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''} 
          ${confidenceLevel === 'low' ? 'bg-red-50 text-red-800 border-red-200' : ''}
        `}>
          <AlertCircle className={`
            h-4 w-4 
            ${confidenceLevel === 'high' ? 'text-green-500' : ''} 
            ${confidenceLevel === 'medium' ? 'text-yellow-500' : ''} 
            ${confidenceLevel === 'low' ? 'text-red-500' : ''}
          `} /><>

          <AlertTitle>{confidenceInfo.title}</AlertTitle>
          <AlertDescription
</> className="mt-1">
            {confidenceInfo.description}
          </AlertDescription>
        </Alert>
        
        {onReclassify && (confidenceLevel === 'medium' || confidenceLevel === 'low') && (
          <Button 
            variant="outline" 
            onClick={onReclassify}
            className="w-full"
            data-testid="reclassify-button"
          >
            Reclassify Document
          </Button>
        )}
      </CardContent>
    </Card>
  );
}