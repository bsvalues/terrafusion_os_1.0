import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Pencil } from 'lucide-react';

interface ViewModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  model: any;  // AssessmentModel
  onOpenDetails: () => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'in_review': return 'warning';
    case 'approved': return 'success';
    case 'published': return 'success';
    case 'archived': return 'outline';
    case 'deprecated': return 'destructive';
    default: return 'secondary';
  }
};

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case 'cost_approach': return 'outline';
    case 'sales_comparison': return 'default';
    case 'income_approach': return 'secondary';
    case 'hybrid': return 'warning';
    case 'statistical': return 'destructive';
    case 'specialized': return 'success';
    default: return 'outline';
  }
};

const ViewModelDialog: React.FC<ViewModelDialogProps> = ({
  isOpen,
  onClose,
  model,
  onOpenDetails,
}) => {
  const handleViewDetails = () => {
    onClose();
    onOpenDetails();
  };

  if (!model) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
          <DialogDescription>
            Assessment model details
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant={getTypeBadgeVariant(model.type)}>
              {model.type.replace('_', ' ')}
            </Badge>
            <Badge variant={getStatusBadgeVariant(model.status)}>
              {model.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">v{model.version}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Description</h4>
            <p className="text-sm text-gray-600">
              {model.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="text-sm font-semibold">Created</h4>
              <p className="text-sm text-gray-600">
                {new Date(model.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Last Modified</h4>
              <p className="text-sm text-gray-600">
                {new Date(model.lastModifiedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-2">Model Details Overview</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Variables:</span> 0
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Components:</span> 0
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Calculations:</span> 0
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Validation Rules:</span> 0
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button onClick={handleViewDetails} className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              View Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewModelDialog;