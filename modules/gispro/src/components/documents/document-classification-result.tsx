import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Brain, 
  CircleCheck, 
  Warning, 
  CheckCircle2, 
  AlertCircle 
 } from '@mui/icons-material';
import { DocumentConfidenceIndicator } from './document-confidence-indicator';
import { ClassificationConfidenceCard } from './classification-confidence-card';

export interface ClassificationResult {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  wasManuallyClassified: boolean;
  classifiedAt?: string;
}

interface DocumentClassificationResultProps {
  classification: ClassificationResult;
  variant?: 'default' | 'card' | 'compact';
  onUpdateClassification?: () => void;
  onReprocessDocument?: () => void;
}

export function DocumentClassificationResult({ 
  classification, 
  variant = 'default',
  onUpdateClassification,
  onReprocessDocument
}: DocumentClassificationResultProps) {
  // If card variant, use the ClassificationConfidenceCard component
  if (variant === 'card') {
    return (
      <ClassificationConfidenceCard 
        documentType={classification.documentType}
        documentTypeLabel={classification.documentTypeLabel}
        confidence={classification.confidence}
        onReclassify={onUpdateClassification || onReprocessDocument}
      />
    );
  }
  
  // If compact variant, show minimal UI
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge className="capitalize px-2 py-0.5 text-xs">
            {classification.documentTypeLabel}
          </Badge>
          
          {classification.wasManuallyClassified ? (
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <CircleCheck className="h-3 w-3 text-green-500 mr-1" />
              <span>Verified</span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
              <Brain className="h-3 w-3 text-purple-500 mr-1" />
              <span>AI</span>
            </div>
          )}
        </div>
        
        <DocumentConfidenceIndicator 
          confidence={classification.confidence} 
          size="sm"
          showPercentage={false}
        />
      </div>
    );
  }
  
  // Progress bar fill animation for default variant
  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: `${classification.confidence * 100}%`,
      transition: { 
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };
  
  // Default detailed view
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div><>

          <h3 className="text-base font-medium mb-1">Document Type</h3>
          <div
</> className="flex items-center space-x-2">
            <Badge className="capitalize px-3 py-1">{classification.documentTypeLabel}</Badge>
            
            {classification.wasManuallyClassified && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <CircleCheck className="h-3 w-3 text-green-500 mr-1" />
                <span>Manually Classified</span>
              </Badge>
            )}
          </div>
        </div>
        
        {classification.wasManuallyClassified ? (
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
            Verified
          </div>
        ) : (
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            <Brain className="h-4 w-4 text-purple-500 mr-1" />
            AI Classification
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1"><>

          <span className="text-sm font-medium">Confidence Score</span>
          <DocumentConfidenceIndicator
</> 
            confidence={classification.confidence} 
            showPercentage={true}
          />
        </div>
        
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full"
            style={{ 
              backgroundColor: classification.confidence >= 0.8 ? '#22c55e' : 
                              classification.confidence >= 0.6 ? '#eab308' : 
                              '#ef4444' 
            }}
            initial="initial"
            animate="animate"
            variants={progressVariants}
          />
        </div>
        
        {classification.confidence < 0.6 && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div><>

              <p className="font-medium text-red-800 dark:text-red-300">Low classification confidence</p>
              <p
</> className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                This document may be misclassified. Consider manually reviewing the document type.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}