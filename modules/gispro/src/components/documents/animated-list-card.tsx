import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document } from '@shared/schema';
import { Eye, Clock, FileText, Image, File, FileImage, FileArchive  } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getDocumentTypeIcon, getDocumentTypeLabel } from '@/lib/document-utils';

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

interface AnimatedListCardProps {
  document: DocumentWithClassification;
  onView: (document: DocumentWithClassification) => void;
}

export function AnimatedListCard({ document, onView }: AnimatedListCardProps) {
  // Card hover animation
  const cardVariants = {
    initial: {
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      y: 0
    },
    hover: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      y: -2
    }
  };

  // Get document type icon component
  const IconComponent = getDocumentTypeIcon(document.type);

  return (
    <motion.div
      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 text-primary`}><>

            <IconComponent className="h-5 w-5" />
          </div>
          
          <div
</>
className="space-y-1"><>

            <div className="font-medium">{document.name}</div>
            <div
</>
className="flex items-center space-x-2"><>

              <Badge variant="outline" className="capitalize">
                {getDocumentTypeLabel(document.type)}
              </Badge>
              
              <div
</>
className="flex items-center text-xs text-slate-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(document.uploadedAt))} ago
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
      </div>
    </motion.div>
  );
}