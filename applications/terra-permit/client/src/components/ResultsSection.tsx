import React from 'react';
import { Permit, Summary } from '@/types';
import ResultsSummary from './ResultsSummary';
import ResultsTable from './ResultsTable';
import { Button } from '@/components/ui/button';
import { Download, Send  } from '@mui/icons-material';
import { exportPermitsToExcel } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ResultsSectionProps {
  permits: Permit[];
  summary: Summary;
  uploadId?: number;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ permits, summary, uploadId }) => {
  const { toast } = useToast();

  const handleExport = () => {
    if (!uploadId) {
      toast({
        title: 'Export Failed',
        description: 'Cannot export permits: missing upload ID',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      exportPermitsToExcel(uploadId);
      toast({
        title: 'Export Started',
        description: 'Your file is being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = () => {
    toast({
      title: 'Submitted Successfully',
      description: `${summary.enterCount} permits have been submitted for processing`,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800">Classification Results</h2>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={handleExport}
            disabled={!uploadId}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" 
            className="flex items-center"
            onClick={handleSubmit}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </div>
      </div>

      <ResultsSummary summary={summary} />
      <ResultsTable permits={permits} />
    </div>
  );
};

export default ResultsSection;
