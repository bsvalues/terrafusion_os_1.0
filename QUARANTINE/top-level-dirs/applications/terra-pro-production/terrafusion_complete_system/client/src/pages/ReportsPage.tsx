import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText,
  FilePlus,
  FileOutput,
  Check,
  ChevronDown,
  DownloadCloud,
  FileCode,
  FileWarning,
  Eye,
  Edit,
  Trash2,
  Refresh,
  AlertCircle,
  Download,
  CheckSquare,
  MoreVertical,
  Search,
  X,
  ArrowUpDown,
  Users,
 } from '@mui/icons-material';

// Report interface
interface Report {
  id: number;
  propertyId: number;
  userId: number;
  reportType: string;
  formType: string;
  status: string;
  purpose: string;
  effectiveDate: string;
  reportDate: string;
  clientName: string;
  clientAddress: string;
  lenderName: string;
  lenderAddress: string;
  borrowerName: string;
  occupancy: string;
  salesPrice: number | null;
  marketValue: number | null;
}

// Property interface
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  yearBuilt: number;
  grossLivingArea: number;
  bedrooms: number;
  bathrooms: number;
}

// Compliance issue interface
interface ComplianceIssue {
  id: number;
  reportId: number;
  rule: string;
  severity: "critical" | "warning" | "info";
  description: string;
  location: string;
  autoFixable: boolean;
  fixed: boolean;
}

// Status types for the report
type ReportStatus = "draft" | "in_progress" | "review" | "completed" | "submitted";

// Progress tracking interface
interface ExportProgress {
  status: "idle" | "generating" | "completed" | "error";
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
}

export default function ReportsPage() {
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<string>("reportDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isComplianceDialogOpen, setIsComplianceDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);
  const [isXmlDialogOpen, setIsXmlDialogOpen] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [xmlProgress, setXmlProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>([]);
  const [autoFixSelected, setAutoFixSelected] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get property ID from URL if present for filtering
  const propertyIdFromUrl = new URLSearchParams(location.split("?")[1]).get("propertyId");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    propertyIdFromUrl ? Number(propertyIdFromUrl) : null
  );

  // Fetch reports for the user
  const reportsQuery = useQuery({
    queryKey: [
      "/api/reports",
      selectedPropertyId,
      searchTerm,
      statusFilter,
      sortColumn,
      sortDirection,
    ],
    queryFn: async () => {
      let url = "/api/reports";
      const params = new URLSearchParams();

      if (selectedPropertyId) {
        params.append("propertyId", String(selectedPropertyId));
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      params.append("sort", sortColumn);
      params.append("order", sortDirection);

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      return apiRequest<Report[]>(url, {
        method: "GET",
      });
    },
  });

  // Fetch properties for filtering
  const propertiesQuery = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      return apiRequest<Property[]>("/api/properties", {
        method: "GET",
      });
    },
  });

  // Fetch selected report details
  const reportQuery = useQuery({
    queryKey: ["/api/reports", selectedReportId],
    enabled: !!selectedReportId,
    queryFn: async () => {
      return apiRequest<Report>(`/api/reports/${selectedReportId}`, {
        method: "GET",
      });
    },
  });

  // Fetch property details for the selected report
  const propertyQuery = useQuery({
    queryKey: ["/api/properties", reportQuery.data?.propertyId],
    enabled: !!reportQuery.data?.propertyId,
    queryFn: async () => {
      return apiRequest<Property>(`/api/properties/${reportQuery.data?.propertyId}`, {
        method: "GET",
      });
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/reports/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Report deleted",
        description: "Report has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete report. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/reports/${id}`, {
        method: "PUT",
        data: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Status updated",
        description: "Report status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update report status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (id: number) => {
      setPdfProgress({
        status: "generating",
        progress: 10,
        message: "Initializing PDF generation...",
      });

      // Simulating progress updates
      const intervalId = setInterval(() => {
        setPdfProgress((prev) => {
          if (prev.progress >= 90) {
            clearInterval(intervalId);
            return prev;
          }
          return {
            ...prev,
            progress: prev.progress + 10,
            message:
              prev.progress < 30
                ? "Collecting report data..."
                : prev.progress < 60
                  ? "Generating document..."
                  : "Applying formatting...",
          };
        });
      }, 500);

      try {
        const response = await apiRequest<{ url: string }>(`/api/reports/${id}/generate-pdf`, {
          method: "POST",
        });

        clearInterval(intervalId);

        return response;
      } catch (error) {
        clearInterval(intervalId);
        throw error;
      }
    },
    onSuccess: (data) => {
      setPdfProgress({
        status: "completed",
        progress: 100,
        message: "PDF generated successfully!",
        downloadUrl: data.url,
      });

      toast({
        title: "PDF Generated",
        description: "Report PDF has been generated successfully.",
      });
    },
    onError: (error) => {
      setPdfProgress({
        status: "error",
        progress: 0,
        message: "Error generating PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate XML mutation
  const generateXmlMutation = useMutation({
    mutationFn: async (id: number) => {
      setXmlProgress({
        status: "generating",
        progress: 10,
        message: "Initializing XML generation...",
      });

      // Simulating progress updates
      const intervalId = setInterval(() => {
        setXmlProgress((prev) => {
          if (prev.progress >= 90) {
            clearInterval(intervalId);
            return prev;
          }
          return {
            ...prev,
            progress: prev.progress + 10,
            message:
              prev.progress < 30
                ? "Collecting report data..."
                : prev.progress < 60
                  ? "Generating MISMO XML..."
                  : "Validating against schema...",
          };
        });
      }, 500);

      try {
        const response = await apiRequest<{ url: string }>(`/api/reports/${id}/generate-xml`, {
          method: "POST",
        });

        clearInterval(intervalId);

        return response;
      } catch (error) {
        clearInterval(intervalId);
        throw error;
      }
    },
    onSuccess: (data) => {
      setXmlProgress({
        status: "completed",
        progress: 100,
        message: "XML generated successfully!",
        downloadUrl: data.url,
      });

      toast({
        title: "XML Generated",
        description: "MISMO XML has been generated successfully.",
      });
    },
    onError: (error) => {
      setXmlProgress({
        status: "error",
        progress: 0,
        message: "Error generating XML",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      toast({
        title: "Error",
        description: "Failed to generate XML. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Validate compliance mutation
  const validateComplianceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest<{ issues: ComplianceIssue[] }>(`/api/reports/${id}/validate-compliance`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      setComplianceIssues(data.issues);

      toast({
        title: "Compliance Check Complete",
        description: `Found ${data.issues.length} compliance issues to review.`,
        variant: data.issues.length > 0 ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to validate compliance. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fix compliance issues mutation
  const fixComplianceIssuesMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return apiRequest<{ issues: ComplianceIssue[] }>("/api/compliance/fix-issues", {
        method: "POST",
        data: { issueIds: ids },
      });
    },
    onSuccess: (data) => {
      // Update the compliance issues list with the fixed issues
      setComplianceIssues((prevIssues) =>
        prevIssues.map((issue) => {
          const fixedIssue = data.issues.find((i) => i.id === issue.id);
          return fixedIssue || issue;
        })
      );

      setAutoFixSelected([]);

      toast({
        title: "Issues Fixed",
        description: `Successfully fixed ${data.issues.length} compliance issues.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to fix compliance issues. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler for report deletion
  const handleDeleteReport = (id: number) => {
    setSelectedReportId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handler for report status update
  const handleUpdateStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Handler for PDF generation
  const handleGeneratePdf = (id: number) => {
    setSelectedReportId(id);
    setPdfProgress({
      status: "idle",
      progress: 0,
      message: "",
    });
    setIsPdfDialogOpen(true);
  };

  // Handler for XML generation
  const handleGenerateXml = (id: number) => {
    setSelectedReportId(id);
    setXmlProgress({
      status: "idle",
      progress: 0,
      message: "",
    });
    setIsXmlDialogOpen(true);
  };

  // Handler for compliance validation
  const handleValidateCompliance = (id: number) => {
    setSelectedReportId(id);
    setComplianceIssues([]);
    setAutoFixSelected([]);
    setIsComplianceDialogOpen(true);
    validateComplianceMutation.mutate(id);
  };

  // Handler for fixing compliance issues
  const handleFixComplianceIssues = () => {
    if (autoFixSelected.length > 0) {
      fixComplianceIssuesMutation.mutate(autoFixSelected);
    }
  };

  // Handler for toggling an issue in the autofix selection
  const toggleIssueSelection = (id: number) => {
    setAutoFixSelected((prev) =>
      prev.includes(id) ? prev.filter((issueId) => issueId !== id) : [...prev, id]
    );
  };

  // Handler for selecting all auto-fixable issues
  const selectAllAutoFixable = () => {
    const autoFixableIds = complianceIssues
      .filter((issue) => issue.autoFixable && !issue.fixed)
      .map((issue) => issue.id);

    setAutoFixSelected(autoFixableIds);
  };

  // Handler for clearing selection
  const clearSelection = () => {
    setAutoFixSelected([]);
  };

  // Handler for opening a report
  const handleOpenReport = (id: number) => {
    navigate(`/form?reportId=${id}`);
  };

  // Handler for creating a new report
  const handleNewReport = () => {
    navigate("/form");
  };

  // Handler for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter reports based on search term and status filter
  const filteredReports = reportsQuery.data || [];

  // Get severity count for display
  const getSeverityCounts = () => {
    const counts = {
      critical: 0,
      warning: 0,
      info: 0,
      fixed: 0,
    };

    complianceIssues.forEach((issue) => {
      if (issue.fixed) {
        counts.fixed++;
      } else {
        counts[issue.severity]++;
      }
    });

    return counts;
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Format currency value
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "submitted":
        return "bg-green-100 text-green-800";
      case "in_progress":
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "draft":
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  // Loading state
  if (reportsQuery.isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><>

        <h1 className="text-2xl font-bold">Appraisal Reports</h1>
        <div
</> className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full md:w-40"><>

              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent
</>><>

              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem
</> value="draft">Draft</SelectItem><>

              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem
</> value="review">Review</SelectItem><>

              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem
</> value="submitted">Submitted</SelectItem>
            </SelectContent>
          </Select>

          {propertiesQuery.data && propertiesQuery.data.length > 0 && (
            <Select
              value={selectedPropertyId?.toString() || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedPropertyId(null);
                  navigate("/reports");
                } else {
                  const propId = Number(value);
                  setSelectedPropertyId(propId);
                  navigate(`/reports?propertyId=${propId}`);
                }
              }}
            >
              <SelectTrigger className="w-full md:w-64"><>

                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent
</>>
                <SelectItem value="all">All Properties</SelectItem>
                {propertiesQuery.data.map((property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.address}, {property.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleNewReport}>
            <FilePlus className="mr-2 h-4 w-4" /> New Report
          </Button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div><>

              <h3 className="text-lg font-medium">No reports found</h3>
              <p
</> className="text-muted-foreground mt-1">
                {searchTerm || statusFilter
                  ? "Try changing your search or filter criteria"
                  : "Create your first appraisal report to get started"}
              </p>
            </div>
            <Button onClick={handleNewReport}>
              <FilePlus className="mr-2 h-4 w-4" /> Create New Report
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader><>

            <CardTitle>My Reports</CardTitle>
            <CardDescription
</>>
              {filteredReports.length} {filteredReports.length === 1 ? "report" : "reports"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("propertyId")}>
                      <div className="flex items-center">
                        Property Address
                        {sortColumn === "propertyId" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("formType")}>
                      <div className="flex items-center">
                        Form Type
                        {sortColumn === "formType" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                      <div className="flex items-center">
                        Status
                        {sortColumn === "status" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("reportDate")}>
                      <div className="flex items-center">
                        Date
                        {sortColumn === "reportDate" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("clientName")}>
                      <div className="flex items-center">
                        Client
                        {sortColumn === "clientName" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("marketValue")}>
                      <div className="flex items-center">
                        Value
                        {sortColumn === "marketValue" && (
                          <ArrowUpDown
                            className={`ml-1 h-4 w-4 ${sortDirection === "desc" ? "rotate-180" : ""}`}
                          />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    // Find the corresponding property data
                    const property = propertiesQuery.data?.find((p) => p.id === report.propertyId);

                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {property ? (
                            <div><>

                              <div>{property.address}</div>
                              <div
</> className="text-xs text-muted-foreground">
                                {property.city}, {property.state} {property.zipCode}
                              </div>
                            </div>
                          ) : (
                            `Property #${report.propertyId}`
                          )}
                        </TableCell><>

                        <TableCell>{report.formType}</TableCell>
                        <TableCell
</>>
                          <Badge className={getStatusBadgeColor(report.status)}>
                            {report.status.replace("_", " ")}
                          </Badge>
                        </TableCell><>

                        <TableCell>{formatDate(report.reportDate)}</TableCell>
                        <TableCell
</>>
                          {report.clientName ? (
                            <div>
                              <div>{report.clientName}</div>
                              {report.lenderName && (
                                <div className="text-xs text-muted-foreground">
                                  {report.lenderName}
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell><>

                        <TableCell>{formatCurrency(report.marketValue)}</TableCell>
                        <TableCell
</>>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end"><>

                              <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
                              <DropdownMenuItem
</> onClick={() => handleOpenReport(report.id)}><>

                                <Edit className="mr-2 h-4 w-4" /> Edit Report
                              </DropdownMenuItem>
                              <DropdownMenuSeparator
</> />
                              <DropdownMenuItem onClick={() => handleGeneratePdf(report.id)}><>

                                <FileText className="mr-2 h-4 w-4" /> Generate PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
</> onClick={() => handleGenerateXml(report.id)}><>

                                <FileCode className="mr-2 h-4 w-4" /> Export MISMO XML
                              </DropdownMenuItem>
                              <DropdownMenuItem
</> onClick={() => handleValidateCompliance(report.id)}><>

                                <FileWarning className="mr-2 h-4 w-4" /> Check Compliance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator
</> /><>

                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(report.id, "draft")}
                                disabled={report.status === "draft"}
                              >
                                Set as Draft
                              </DropdownMenuItem>
                              <DropdownMenuItem
</>
                                onClick={() => handleUpdateStatus(report.id, "in_progress")}
                                disabled={report.status === "in_progress"}
                              >
                                Set as In Progress
                              </DropdownMenuItem><>

                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(report.id, "review")}
                                disabled={report.status === "review"}
                              >
                                Set as In Review
                              </DropdownMenuItem>
                              <DropdownMenuItem
</>
                                onClick={() => handleUpdateStatus(report.id, "completed")}
                                disabled={report.status === "completed"}
                              >
                                Set as Completed
                              </DropdownMenuItem><>

                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(report.id, "submitted")}
                                disabled={report.status === "submitted"}
                              >
                                Set as Submitted
                              </DropdownMenuItem>
                              <DropdownMenuSeparator
</> />
                              <DropdownMenuItem
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><>

          <CardTitle>Report Actions</CardTitle>
          <CardDescription
</>>Tools for creating and exporting appraisal reports</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generate PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create a finalized PDF report for submission to clients or GSEs
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                disabled={filteredReports.length === 0}
                onClick={() => {
                  if (filteredReports.length > 0) {
                    handleGeneratePdf(filteredReports[0].id);
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" /> Generate PDF
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export MISMO XML</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Export MISMO 2.6 XML for electronic submission to GSEs and lenders
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                disabled={filteredReports.length === 0}
                onClick={() => {
                  if (filteredReports.length > 0) {
                    handleGenerateXml(filteredReports[0].id);
                  }
                }}
              >
                <FileCode className="mr-2 h-4 w-4" /> Export XML
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validate Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Check report for UAD and GSE compliance issues before submission
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                disabled={filteredReports.length === 0}
                onClick={() => {
                  if (filteredReports.length > 0) {
                    handleValidateCompliance(filteredReports[0].id);
                  }
                }}
              >
                <FileWarning className="mr-2 h-4 w-4" /> Run Validation
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><>

            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription
</>>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter><>

            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
</>
              variant="destructive"
              onClick={() => deleteReportMutation.mutate(selectedReportId!)}
              disabled={deleteReportMutation.isPending}
            >
              {deleteReportMutation.isPending ? "Deleting..." : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Generation Dialog */}
      <Dialog open={isPdfDialogOpen} onOpenChange={setIsPdfDialogOpen}>
        <DialogContent>
          <DialogHeader><>

            <DialogTitle>Generate PDF Report</DialogTitle>
            <DialogDescription
</>>
              Create a professional PDF report for this appraisal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pdfProgress.status === "idle" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><>

                    <Label htmlFor="includeCover">Include Cover Page</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="includeCover" defaultChecked />
                      <label
                        htmlFor="includeCover"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Add cover page with property details
                      </label>
                    </div>
                  </div>
                  <div><>

                    <Label htmlFor="includePhotos">Include Photos</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="includePhotos" defaultChecked />
                      <label
                        htmlFor="includePhotos"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Add all property photos
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><>

                    <Label htmlFor="includeComps">Include Comparable Grid</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="includeComps" defaultChecked />
                      <label
                        htmlFor="includeComps"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Add comparable properties grid
                      </label>
                    </div>
                  </div>
                  <div><>

                    <Label htmlFor="includeMap">Include Location Map</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="includeMap" defaultChecked />
                      <label
                        htmlFor="includeMap"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Add property location map
                      </label>
                    </div>
                  </div>
                </div>

                <div><>

                  <Label htmlFor="outputFormat">Output Format</Label>
                  <Select
</> defaultValue="pdf">
                    <SelectTrigger id="outputFormat"><>

                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem
</> value="xmlpdf">PDF with XML Embedded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {pdfProgress.status === "generating" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Refresh className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <h3 className="mt-2 font-medium">{pdfProgress.message}</h3>
                </div>
                <Progress value={pdfProgress.progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground">
                  This may take a few moments...
                </p>
              </div>
            )}

            {pdfProgress.status === "completed" && (
              <div className="space-y-4 text-center py-4">
                <Check className="h-8 w-8 mx-auto text-green-500" />
                <h3 className="font-medium text-green-500">{pdfProgress.message}</h3>
                {pdfProgress.downloadUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(pdfProgress.downloadUrl, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                )}
              </div>
            )}

            {pdfProgress.status === "error" && (
              <div className="space-y-4 text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                <h3 className="font-medium text-red-500">{pdfProgress.message}</h3>
                {pdfProgress.error && (
                  <p className="text-sm text-muted-foreground">{pdfProgress.error}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {pdfProgress.status === "idle" && (
              <><>

                <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</> onClick={() => generatePdfMutation.mutate(selectedReportId!)}>
                  Generate PDF
                </Button>
              </>
            )}

            {pdfProgress.status === "generating" && (
              <Button variant="outline" disabled>
                Generating...
              </Button>
            )}

            {(pdfProgress.status === "completed" || pdfProgress.status === "error") && (
              <Button variant="outline" onClick={() => setIsPdfDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XML Generation Dialog */}
      <Dialog open={isXmlDialogOpen} onOpenChange={setIsXmlDialogOpen}>
        <DialogContent>
          <DialogHeader><>

            <DialogTitle>Export MISMO XML</DialogTitle>
            <DialogDescription
</>>Generate MISMO 2.6 XML for electronic submission</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {xmlProgress.status === "idle" && (
              <div className="space-y-4">
                <div><>

                  <Label htmlFor="xmlVersion">MISMO Version</Label>
                  <Select
</> defaultValue="2.6">
                    <SelectTrigger id="xmlVersion"><>

                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="2.6">MISMO 2.6</SelectItem>
                      <SelectItem
</> value="2.6GSE">MISMO 2.6 GSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div><>

                  <Label htmlFor="xmlFormat">XML Format</Label>
                  <Select
</> defaultValue="standard">
                    <SelectTrigger id="xmlFormat"><>

                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="standard">Standard MISMO</SelectItem>
                      <SelectItem
</> value="fnma">Fannie Mae</SelectItem><>

                      <SelectItem value="fhlmc">Freddie Mac</SelectItem>
                      <SelectItem
</> value="fha">FHA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><>

                    <Label htmlFor="includePhotosXml">Include Photos</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="includePhotosXml" defaultChecked />
                      <label
                        htmlFor="includePhotosXml"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Embed photos as Base64
                      </label>
                    </div>
                  </div>
                  <div><>

                    <Label htmlFor="validateXml">Validate XML</Label>
                    <div
</> className="flex items-center space-x-2 mt-2">
                      <Checkbox id="validateXml" defaultChecked />
                      <label
                        htmlFor="validateXml"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Validate against schema
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {xmlProgress.status === "generating" && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Refresh className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <h3 className="mt-2 font-medium">{xmlProgress.message}</h3>
                </div>
                <Progress value={xmlProgress.progress} className="w-full" />
                <p className="text-xs text-center text-muted-foreground">
                  This may take a few moments...
                </p>
              </div>
            )}

            {xmlProgress.status === "completed" && (
              <div className="space-y-4 text-center py-4">
                <Check className="h-8 w-8 mx-auto text-green-500" />
                <h3 className="font-medium text-green-500">{xmlProgress.message}</h3>
                {xmlProgress.downloadUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(xmlProgress.downloadUrl, "_blank")}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download XML
                  </Button>
                )}
              </div>
            )}

            {xmlProgress.status === "error" && (
              <div className="space-y-4 text-center py-4">
                <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
                <h3 className="font-medium text-red-500">{xmlProgress.message}</h3>
                {xmlProgress.error && (
                  <p className="text-sm text-muted-foreground">{xmlProgress.error}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {xmlProgress.status === "idle" && (
              <><>

                <Button variant="outline" onClick={() => setIsXmlDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</> onClick={() => generateXmlMutation.mutate(selectedReportId!)}>
                  Generate XML
                </Button>
              </>
            )}

            {xmlProgress.status === "generating" && (
              <Button variant="outline" disabled>
                Generating...
              </Button>
            )}

            {(xmlProgress.status === "completed" || xmlProgress.status === "error") && (
              <Button variant="outline" onClick={() => setIsXmlDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Validation Dialog */}
      <Dialog open={isComplianceDialogOpen} onOpenChange={setIsComplianceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>Compliance Validation</DialogTitle>
            <DialogDescription
</>>Check report for UAD and GSE compliance issues</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {validateComplianceMutation.isPending ? (
              <div className="text-center py-8">
                <Refresh className="h-8 w-8 animate-spin mx-auto text-primary" /><>

                <h3 className="mt-2 font-medium">Validating compliance...</h3>
                <p
</> className="text-sm text-muted-foreground mt-2">
                  Checking against UAD rules and GSE requirements
                </p>
              </div>
            ) : complianceIssues.length === 0 ? (
              <div className="text-center py-8">
                {validateComplianceMutation.isSuccess ? (
                  <>
                    <Check className="h-8 w-8 mx-auto text-green-500" /><>

                    <h3 className="mt-2 font-medium text-green-500">No compliance issues found!</h3>
                    <p
</> className="text-sm text-muted-foreground mt-2">
                      This report appears to meet all UAD and GSE requirements
                    </p>
                  </>
                ) : (
                  <>
                    <FileWarning className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="mt-2 font-medium">
                      Click the button below to start compliance validation
                    </h3>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2"><>

                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Critical: {getSeverityCounts().critical}
                  </div>
                  <div
</> className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    Warning: {getSeverityCounts().warning}
                  </div><>

                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Info: {getSeverityCounts().info}
                  </div>
                  <div
</> className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Fixed: {getSeverityCounts().fixed}
                  </div>
                </div>

                <Tabs defaultValue="all">
                  <TabsList className="mb-4"><>

                    <TabsTrigger value="all">All Issues</TabsTrigger>
                    <TabsTrigger
</> value="critical">Critical</TabsTrigger><>

                    <TabsTrigger value="warning">Warnings</TabsTrigger>
                    <TabsTrigger
</> value="info">Info</TabsTrigger>
                    <TabsTrigger value="fixed">Fixed</TabsTrigger>
                  </TabsList>

                  {["all", "critical", "warning", "info", "fixed"].map((tab) => (
                    <TabsContent key={tab} value={tab}>
                      <div className="space-y-2">
                        {complianceIssues
                          .filter(
                            (issue) =>
                              tab === "all" ||
                              (tab === "fixed" && issue.fixed) ||
                              (tab !== "fixed" && !issue.fixed && issue.severity === tab)
                          )
                          .map((issue) => (
                            <Card
                              key={issue.id}
                              className={`
                              ${
                                issue.fixed
                                  ? "bg-green-50 border-green-200"
                                  : issue.severity === "critical"
                                    ? "bg-red-50 border-red-200"
                                    : issue.severity === "warning"
                                      ? "bg-amber-50 border-amber-200"
                                      : "bg-blue-50 border-blue-200"
                              }
                            `}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium flex items-center">
                                      {issue.fixed ? (
                                        <Check className="h-4 w-4 mr-1 text-green-500" />
                                      ) : issue.severity === "critical" ? (
                                        <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
                                      ) : issue.severity === "warning" ? (
                                        <FileWarning className="h-4 w-4 mr-1 text-amber-500" />
                                      ) : (<>

                                        <AlertCircle className="h-4 w-4 mr-1 text-blue-500" />
                                      )}
                                      {issue.rule}
                                    </h4>
                                    <p
</> className="text-sm mt-1">{issue.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Location: {issue.location}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {!issue.fixed && issue.autoFixable && (
                                      <Checkbox
                                        checked={autoFixSelected.includes(issue.id)}
                                        onCheckedChange={() => toggleIssueSelection(issue.id)}
                                        id={`fix-${issue.id}`}
                                      />
                                    )}
                                    {issue.fixed ? (
                                      <Badge className="bg-green-100 text-green-800">Fixed</Badge>
                                    ) : issue.autoFixable ? (
                                      <Badge className="bg-blue-100 text-blue-800">
                                        Auto-fixable
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-amber-100 text-amber-800">
                                        Manual Fix Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {validateComplianceMutation.isPending ? (
              <Button disabled>
                <Refresh className="mr-2 h-4 w-4 animate-spin" /> Validating...
              </Button>
            ) : validateComplianceMutation.isSuccess && complianceIssues.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllAutoFixable}
                    disabled={
                      complianceIssues.filter((i) => i.autoFixable && !i.fixed).length === 0
                    }
                  ><>

                    <CheckSquare className="mr-2 h-4 w-4" /> Select All Auto-fixable
                  </Button>
                  <Button
</>
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={autoFixSelected.length === 0}
                  >
                    <X className="mr-2 h-4 w-4" /> Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-2 ml-auto"><>

                  <Button variant="outline" onClick={() => setIsComplianceDialogOpen(false)}>
                    Close
                  </Button>
                  <Button
</>
                    onClick={handleFixComplianceIssues}
                    disabled={autoFixSelected.length === 0 || fixComplianceIssuesMutation.isPending}
                  >
                    {fixComplianceIssuesMutation.isPending ? (
                      <>
                        <Refresh className="mr-2 h-4 w-4 animate-spin" /> Fixing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Fix Selected Issues
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsComplianceDialogOpen(false)}>
                  Close
                </Button>
                {!validateComplianceMutation.isSuccess && (
                  <Button onClick={() => validateComplianceMutation.mutate(selectedReportId!)}>
                    <FileWarning className="mr-2 h-4 w-4" /> Validate Compliance
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
