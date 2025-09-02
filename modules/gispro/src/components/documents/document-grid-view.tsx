import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedDocumentCard } from './animated-document-card';
import { AnimatedListCard } from './animated-list-card';
import { Document } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Grid3X3, List  } from '@mui/icons-material';

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

interface DocumentGridViewProps {
  documents: DocumentWithClassification[];
  onViewDocument: (document: DocumentWithClassification) => void;
}

export function DocumentGridView({ documents, onViewDocument }: DocumentGridViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item animation variants for grid items
  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    show: { 
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-1 flex">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => setViewMode('grid')}
          ><>

            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
</>
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {documents.map((document) => (
              <motion.div key={document.id} variants={itemVariants}>
                <AnimatedDocumentCard 
                  document={document} 
                  onView={onViewDocument} 
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="space-y-2"
          >
            {documents.map((document) => (
              <motion.div key={document.id} variants={itemVariants}>
                <AnimatedListCard 
                  document={document} 
                  onView={onViewDocument} 
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}