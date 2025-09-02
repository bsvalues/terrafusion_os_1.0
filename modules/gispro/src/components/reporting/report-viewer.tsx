import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Table as TableIcon, BarChart2, Loader2, AlertCircle  } from '@mui/icons-material';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { ReportExporter } from '@/components/reporting/report-exporter';

interface ViewerProps {
  reportId: number;
}

export const ReportViewer = ({ reportId }: ViewerProps) => {
  const [selectedTab, setSelectedTab] = useState('data');
  const [page, setPage] = useState(1);
  const perPage = 10;
  
  // Fetch report metadata
  const reportQuery = useQuery({
    queryKey: [`/api/reports/${reportId}`],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      return response.json();
    }
  });
  
  // Fetch report data with pagination
  const dataQuery = useQuery({
    queryKey: [`/api/reports/${reportId}/data`, { page, perPage }],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}/data?page=${page}&perPage=${perPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      return response.json();
    },
    enabled: !!reportQuery.data && reportQuery.data.status === 'completed'
  });
  
  // If report is not completed, don't show data
  if (reportQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <p>Loading report metadata...</p>
      </div>
    );
  }
  
  if (reportQuery.isError) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" /><>

        <AlertTitle>Error</AlertTitle>
        <AlertDescription
</>
</>>
          Failed to load report metadata. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (reportQuery.data?.status === 'pending' || reportQuery.data?.status === 'processing') {
    return (
      <Alert className="my-4">
        <Loader2 className="h-4 w-4 animate-spin" /><>

        <AlertTitle>Report is processing</AlertTitle>
        <AlertDescription
</>
</>>
          This report is still being generated. Please check back later.
          {reportQuery.data?.status === 'processing' && (
            <span> Currently processing...</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (reportQuery.data?.status === 'failed') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" /><>

        <AlertTitle>Report generation failed</AlertTitle>
        <AlertDescription
</>
</>>
          There was an error generating this report. Please try creating it again.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!dataQuery.data?.pagination) return null;
    
    const { totalPages } = dataQuery.data.pagination;
    if (totalPages <= 1) return null;
    
    // Generate page numbers with ellipsis for long ranges
    const pageNumbers: (number | null)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if fewer than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Show ellipsis or pages in the middle
      if (page <= 3) {
        // Near the start
        for (let i = 2; i <= Math.min(page + 1, 4); i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push(null); // Ellipsis
      } else if (page >= totalPages - 2) {
        // Near the end
        pageNumbers.push(null); // Ellipsis
        for (let i = Math.max(totalPages - 3, 2); i < totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(null); // Ellipsis
        pageNumbers.push(page - 1);
        pageNumbers.push(page);
        pageNumbers.push(page + 1);
        pageNumbers.push(null); // Ellipsis
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(page - 1)}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {pageNumbers.map((pageNum /* , index */) => 
            pageNum === null ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => handlePageChange(pageNum as number)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(page + 1)}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  // Render data table with dynamic columns
  const renderDataTable = () => {
    if (dataQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Loading data...</p>
        </div>
      );
    }
    
    if (dataQuery.isError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>Error</AlertTitle>
          <AlertDescription
</>
</>>
            Failed to load report data. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!dataQuery.data?.rows?.length) {
      return (
        <div className="text-center py-10">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" /><>

          <h3 className="mt-4 text-lg font-medium">No Data Available</h3>
          <p
</>
className="mt-2 text-sm text-muted-foreground">
            This report did not return any data matching the criteria.
          </p>
        </div>
      );
    }
    
    // Extract column headers from the first row
    const columns = Object.keys(dataQuery.data.rows[0]);
    
    return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataQuery.data.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column}>{row[column]?.toString() || '-'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing page {dataQuery.data.pagination.page} of {dataQuery.data.pagination.totalPages}
            {' '}({dataQuery.data.pagination.totalRows} total rows)
          </div>
          {renderPagination()}
        </div>
    );
  };
  
  // Render summary/metrics panels
  const renderSummaries = () => {
    if (dataQuery.isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <p>Loading summaries...</p>
        </div>
      );
    }
    
    if (!dataQuery.data?.summaries || Object.keys(dataQuery.data.summaries).length === 0) {
      return (
        <div className="text-center py-10">
          <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground" /><>

          <h3 className="mt-4 text-lg font-medium">No Summaries Available</h3>
          <p
</>
className="mt-2 text-sm text-muted-foreground">
            This report does not include summary metrics.
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(dataQuery.data.summaries).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value.toString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Main render
  return (
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {reportQuery.data?.name}
                <IllustratedTooltip
                  illustration={illustrations.report.viewer}
                  title="Report Viewer"
                  content={
                    <div><>

                      <p className="mb-1">• View detailed report data</p>
                      <p
</>
className="mb-1">• Explore summary metrics</p><>

                      <p className="mb-1">• Navigate through paginated results</p>
                      <p
</>
</>>• Export report in various formats</p>
                    </div>
                  }
                  position="right"
                />
              </CardTitle>
              <CardDescription>
                {reportQuery.data?.templateName}
                {reportQuery.data?.completedAt && (
                  <span className="ml-2">
                    (Generated: {format(parseISO(reportQuery.data.completedAt), 'MMM d, yyyy h:mm a')})
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data"><>

                <TableIcon className="mr-2 h-4 w-4" />
                Data
              </TabsTrigger>
              <TabsTrigger
</>
value="summaries">
                <BarChart2 className="mr-2 h-4 w-4" />
                Summaries
              </TabsTrigger>
            </TabsList><>

            <TabsContent value="data" className="space-y-4">
              {renderDataTable()}
            </TabsContent>
            <TabsContent
</>
value="summaries" className="space-y-4">
              {renderSummaries()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {reportQuery.data?.status === 'completed' && (
        <ReportExporter report={reportQuery.data} />
      )}
  );
};