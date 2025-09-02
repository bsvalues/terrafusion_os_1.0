import { motion } from 'framer-motion';
import { Document } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { getDocumentTypeIcon, getDocumentTypeLabel } from '@/lib/document-utils';
import { Eye, Clock  } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Extended Document type with optional classification
interface DocumentWithClassification extends Document {
  classification?: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  };
  updatedAt?: Date;
  contentType?: string;
}

interface AnimatedDocumentCardProps {
  document: DocumentWithClassification;
  onView: (document: DocumentWithClassification) => void;
}

export function AnimatedDocumentCard({ document, onView }: AnimatedDocumentCardProps) {
  // Card animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    hover: { 
      y: -5,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15
      }
    }
  };
  
  // Get document type icon
  const IconComponent = getDocumentTypeIcon(document.type);
  
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card className="overflow-hidden h-full">
        <div className="relative h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <IconComponent className="h-16 w-16 text-slate-400" />
          
          {document.classification && (
            <div className="absolute top-2 right-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="font-semibold">
                  {Math.round(document.classification.confidence * 100)}% Match
                </Badge>
              </motion.div>
            </div>
          )}
        </div>
        
        <CardContent className="p-4"><>

          <h3 className="font-medium text-lg mb-1 line-clamp-1">{document.name}</h3>
          
          <div
</> className="flex items-center justify-between mt-2"><>

            <Badge variant="outline" className="capitalize">
              {getDocumentTypeLabel(document.type)}
            </Badge>
            
            <div
</> className="flex items-center text-xs text-slate-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(document.uploadedAt))} ago
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}