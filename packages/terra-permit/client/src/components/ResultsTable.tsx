import React, { useState } from 'react';
import { Permit } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Check, X, Edit, MoreVertical, Search, Eye, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PermitUpdateForm } from './PermitUpdateForm';
import { useToast } from '@/hooks/use-toast';

interface ResultsTableProps {
  permits: Permit[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ permits }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPermit, setEditingPermit] = useState<Permit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Generate a mock session ID since we don't have an actual collaboration session
  const mockSessionId = 'local-session-' + Date.now();

  // Filter permits based on search term
  const filteredPermits = permits.filter(permit => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      permit.parcelNumber.toLowerCase().includes(searchTermLower) ||
      permit.neighborhoodCode.toLowerCase().includes(searchTermLower) ||
      permit.permitDescription.toLowerCase().includes(searchTermLower) ||
      permit.reason.toLowerCase().includes(searchTermLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredPermits.length / itemsPerPage);
  const paginatedPermits = filteredPermits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle editing permit
  const handleEditPermit = (permit: Permit) => {
    setEditingPermit(permit);
    setDialogOpen(true);
  };

  // Handle closing the dialog and resetting state
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setEditingPermit(null);
    }, 300); // Wait for dialog close animation
  };

  // Handle permit update completion
  const handleUpdateComplete = () => {
    toast({
      title: "Success",
      description: "Permit updated successfully.",
    });
    handleCloseDialog();
  };

  return (
    <>
      <Card>
        <CardHeader className="border-b flex flex-row items-center justify-between py-5">
          <CardTitle>Permits Classification</CardTitle>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search permits..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Parcel Number</TableHead>
                  <TableHead>Neighborhood Code</TableHead>
                  <TableHead>Permit Description</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPermits.map(permit => (
                  <TableRow key={permit.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          permit.enterPermit ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {permit.enterPermit ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </span>
                        <span className={`ml-2 text-sm font-medium ${
                          permit.enterPermit ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {permit.enterPermit ? 'Enter' : 'Skip'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-800">
                      {permit.parcelNumber}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-800">
                      {permit.neighborhoodCode}
                    </TableCell>
                    <TableCell className="text-sm text-gray-800 max-w-md truncate">
                      {permit.permitDescription}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-md truncate">
                      {permit.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary"
                        onClick={() => handleEditPermit(permit)}
                        title="Edit permit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-blue-600"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-600"
                        title="View history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredPermits.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredPermits.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Previous page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    
                    {/* Next page */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Permit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Permit</DialogTitle>
          </DialogHeader>
          {editingPermit && (
            <PermitUpdateForm 
              permit={editingPermit}
              sessionId={mockSessionId}
              onUpdateComplete={handleUpdateComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResultsTable;
