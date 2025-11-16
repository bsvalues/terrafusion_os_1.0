import { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, 
  CheckCircle, 
  XCircle,
  ArrowUpDown,
  Filter,
  Download
 } from '@mui/icons-material';
import { Permit } from '@/types';
import { format } from 'date-fns';

interface ReportTableProps {
  permits: Permit[];
}

const ReportTable = ({ permits }: ReportTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Permit>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Handle search
  const filteredPermits = permits.filter(permit => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      permit.parcelNumber.toLowerCase().includes(searchTermLower) ||
      permit.neighborhoodCode.toLowerCase().includes(searchTermLower) ||
      permit.permitDescription.toLowerCase().includes(searchTermLower) ||
      permit.value.toLowerCase().includes(searchTermLower) ||
      String(permit.id).includes(searchTermLower)
    );
  });
  
  // Handle sorting
  const sortedPermits = [...filteredPermits].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Special case for enterPermit - sort by boolean value
    if (sortField === 'enterPermit') {
      return sortDirection === 'asc' 
        ? Number(aValue) - Number(bValue) 
        : Number(bValue) - Number(aValue);
    }
    
    // Handle case-insensitive string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Check for dates
    if (sortField === 'issueDate' || sortField === 'processedAt') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Default comparison
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Handle sort toggle
  const toggleSort = (field: keyof Permit) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Format permit value as currency
  const formatCurrency = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    if (isNaN(numericValue)) return value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><>

          <Input
            placeholder="Search permits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <div
</> className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="whitespace-nowrap"><>

            <Filter className="h-4 w-4 mr-1" />
            Advanced Filter
          </Button>
          <Button
</> variant="outline" size="sm" className="whitespace-nowrap">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]" onClick={() => toggleSort('id')}>
                  <div className="flex items-center cursor-pointer">
                    ID <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('parcelNumber')}>
                  <div className="flex items-center cursor-pointer">
                    Parcel Number <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('neighborhoodCode')}>
                  <div className="flex items-center cursor-pointer">
                    Neighborhood <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('permitDescription')}>
                  <div className="flex items-center cursor-pointer">
                    Description <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('value')}>
                  <div className="flex items-center cursor-pointer">
                    Value <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('issueDate')}>
                  <div className="flex items-center cursor-pointer">
                    Issue Date <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead onClick={() => toggleSort('enterPermit')}>
                  <div className="flex items-center cursor-pointer">
                    Status <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPermits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No permits found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPermits.map((permit) => (
                  <TableRow key={permit.id}><>

                    <TableCell className="font-medium">{permit.id}</TableCell>
                    <TableCell
</>>{permit.parcelNumber}</TableCell><>

                    <TableCell>{permit.neighborhoodCode}</TableCell>
                    <TableCell
</> className="max-w-[300px] truncate" title={permit.permitDescription}>
                      {permit.permitDescription}
                    </TableCell><>

                    <TableCell className="whitespace-nowrap">
                      {formatCurrency(permit.value)}
                    </TableCell>
                    <TableCell
</> className="whitespace-nowrap">
                      {format(new Date(permit.issueDate), 'MM/dd/yyyy')}
                    </TableCell>
                    <TableCell>
                      {permit.enterPermit ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Enter
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center">
                          <XCircle className="mr-1 h-3 w-3" />
                          Skip
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Showing {sortedPermits.length} of {permits.length} permits
      </div>
    </div>
  );
};

export default ReportTable;