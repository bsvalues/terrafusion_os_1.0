import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { AlertCircle,
  Warning,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Gauge,
  HelpCircle,
  Info,
  Link,
  Refresh,
  RotateCw,
  Shield,
  ShieldCheck,
  ThumbsUp,
  XCircle,
 } from '@mui/icons-material';
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { toast } from "../hooks/use-toast";

// Define compliance check types
interface ComplianceCheck {
  id: number;
  reportId: number;
  checkType: string;
  checkResult: "pass" | "fail" | "warning" | "info";
  severity: "high" | "medium" | "low";
  description: string;
  details: string | null;
  rule: string | null;
  recommendation: string | null;
  createdAt: string | null;
}

interface AppraisalReport {
  id: number;
  propertyId: number;
  userId: number;
  reportType: string;
  formType: string;
  status: string;
  purpose: string | null;
  effectiveDate: string | null;
  reportDate: string | null;
  clientName: string | null;
  clientAddress: string | null;
  lenderName: string | null;
  lenderAddress: string | null;
  borrowerName: string | null;
  occupancy: string | null;
  salesPrice: string | null;
  marketValue: string | null;
}

interface Property {
  id: number;
  userId: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
}

interface ComplianceCategory {
  name: string;
  description: string;
  rules: ComplianceRule[];
  progress: number;
}

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  status: "pass" | "fail" | "warning" | "info" | "not_checked";
  severity: "high" | "medium" | "low";
  details?: string;
  recommendation?: string;
}

// USPAP compliance categories
const uspapCategories: ComplianceCategory[] = [
  {
    name: "Ethics Rule",
    description: "Conduct, Management, Confidentiality, Record Keeping",
    rules: [],
    progress: 0,
  },
  {
    name: "Competency Rule",
    description: "Appraiser competence and knowledge",
    rules: [],
    progress: 0,
  },
  {
    name: "Scope of Work Rule",
    description: "Identification and disclosure of work performed",
    rules: [],
    progress: 0,
  },
  {
    name: "Jurisdictional Exception Rule",
    description: "Compliance with laws and regulations",
    rules: [],
    progress: 0,
  },
  {
    name: "Standards Rule 1",
    description: "Development of a real property appraisal",
    rules: [],
    progress: 0,
  },
  {
    name: "Standards Rule 2",
    description: "Reporting of a real property appraisal",
    rules: [],
    progress: 0,
  },
];

// UAD compliance categories
const uadCategories: ComplianceCategory[] = [
  {
    name: "Subject Property",
    description: "Subject property data accuracy and completeness",
    rules: [],
    progress: 0,
  },
  {
    name: "Contract",
    description: "Contract information and analysis",
    rules: [],
    progress: 0,
  },
  {
    name: "Neighborhood",
    description: "Neighborhood characteristics and analysis",
    rules: [],
    progress: 0,
  },
  {
    name: "Site",
    description: "Site description and analysis",
    rules: [],
    progress: 0,
  },
  {
    name: "Improvements",
    description: "Property improvement descriptions",
    rules: [],
    progress: 0,
  },
  {
    name: "Comparable Properties",
    description: "Selection and analysis of comparable properties",
    rules: [],
    progress: 0,
  },
  {
    name: "Sales Comparison Approach",
    description: "Adjustments and reconciliation",
    rules: [],
    progress: 0,
  },
  {
    name: "Cost Approach",
    description: "Cost calculations and depreciation",
    rules: [],
    progress: 0,
  },
  {
    name: "Income Approach",
    description: "Income and expense analysis",
    rules: [],
    progress: 0,
  },
  {
    name: "Reconciliation",
    description: "Final value conclusion and reconciliation",
    rules: [],
    progress: 0,
  },
];

export default function EnhancedCompliancePage() {
  const params = useParams<{ reportId?: string }>();
  const paramReportId = params.reportId;
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const reportId = Number(paramReportId) || 1;

  const [activeTab, setActiveTab] = useState<string>("uspap");
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ComplianceRule | null>(null);
  const [aiRuleText, setAiRuleText] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<string>("auto");

  // Fetch report, property, and compliance checks
  const { data: report, isLoading: isReportLoading } = useQuery<AppraisalReport>({
    queryKey: ["/api/reports", reportId],
    queryFn: () => apiRequest(`/api/reports/${reportId}`),
  });

  const { data: property, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: ["/api/properties", report?.propertyId],
    queryFn: () => apiRequest(`/api/properties/${report?.propertyId}`),
    enabled: !!report?.propertyId,
  });

  const {
    data: complianceChecks = [],
    isLoading: isComplianceLoading,
    isError: isComplianceError,
    refetch: refetchCompliance,
  } = useQuery<ComplianceCheck[]>({
    queryKey: ["/api/reports", reportId, "compliance"],
    queryFn: () => apiRequest(`/api/reports/${reportId}/compliance`),
  });

  // Run compliance check mutation
  const runComplianceCheckMutation = useMutation({
    mutationFn: ({
      reportId,
      checkType,
      aiProvider,
    }: {
      reportId: number;
      checkType: string;
      aiProvider: string;
    }) =>
      apiRequest(`/api/reports/${reportId}/validate-compliance`, {
        method: "POST",
        data: {
          checkType,
          aiProvider,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "compliance"] });
      setIsAiChecking(false);
      toast({
        title: "Compliance Check Complete",
        description: "AI has completed the compliance analysis of your report.",
      });
    },
    onError: (error) => {
      setIsAiChecking(false);
      toast({
        title: "Compliance Check Failed",
        description: "There was an error running the compliance check.",
        variant: "destructive",
      });
    },
  });

  // Create new compliance check
  const createComplianceCheckMutation = useMutation({
    mutationFn: (reqData: {
      reportId: number;
      checkType: string;
      checkResult: string;
      severity: string;
      description: string;
      details?: string;
      rule?: string;
      recommendation?: string;
    }) =>
      apiRequest(`/api/compliance`, {
        method: "POST",
        data: reqData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "compliance"] });
    },
  });

  // Delete compliance check
  const deleteComplianceCheckMutation = useMutation({
    mutationFn: (checkId: number) =>
      apiRequest(`/api/compliance/${checkId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "compliance"] });
    },
  });

  // Start AI compliance check
  const runAiComplianceCheck = () => {
    setIsAiChecking(true);
    runComplianceCheckMutation.mutate({
      reportId,
      checkType: activeTab,
      aiProvider,
    });
  };

  // Generate rule categories with populated compliance checks
  const mapComplianceChecksToCategories = (
    categories: ComplianceCategory[],
    checks: ComplianceCheck[]
  ) => {
    const mappedCategories = [...categories];

    // Reset rules for all categories
    mappedCategories.forEach((category) => {
      category.rules = [];
      category.progress = 0;
    });

    // Group checks by category
    checks.forEach((check) => {
      const [categoryName, ruleName] = check.checkType.split(":");

      const categoryIndex = mappedCategories.findIndex(
        (cat) => cat.name.toLowerCase() === categoryName.trim().toLowerCase()
      );

      if (categoryIndex >= 0) {
        mappedCategories[categoryIndex].rules.push({
          id: String(check.id),
          name: ruleName || check.description,
          description: check.description,
          status: check.checkResult,
          severity: check.severity,
          details: check.details || undefined,
          recommendation: check.recommendation || undefined,
        });
      } else {
        // Add to first category if no match found
        if (mappedCategories.length > 0) {
          mappedCategories[0].rules.push({
            id: String(check.id),
            name: check.description,
            description: check.description,
            status: check.checkResult,
            severity: check.severity,
            details: check.details || undefined,
            recommendation: check.recommendation || undefined,
          });
        }
      }
    });

    // Calculate progress for each category
    mappedCategories.forEach((category) => {
      if (category.rules.length > 0) {
        const passedRules = category.rules.filter((rule) => rule.status === "pass").length;
        category.progress = Math.round((passedRules / category.rules.length) * 100);
      }
    });

    return mappedCategories;
  };

  // Filter checked categories
  const filteredCategories = mapComplianceChecksToCategories(
    activeTab === "uspap" ? uspapCategories : uadCategories,
    complianceChecks.filter((check) =>
      check.checkType.startsWith(activeTab === "uspap" ? "USPAP" : "UAD")
    )
  );

  // Calculate overall compliance score
  const calculateOverallScore = (categories: ComplianceCategory[]) => {
    if (categories.length === 0) return 0;

    const totalRules = categories.reduce((acc, category) => acc + category.rules.length, 0);
    if (totalRules === 0) return 0;

    const passedRules = categories.reduce((acc, category) => {
      return acc + category.rules.filter((rule) => rule.status === "pass").length;
    }, 0);

    return Math.round((passedRules / totalRules) * 100);
  };

  // Get issues count by severity
  const getIssueCountBySeverity = (
    categories: ComplianceCategory[],
    severity: "high" | "medium" | "low"
  ) => {
    return categories.reduce((acc, category) => {
      return (
        acc +
        category.rules.filter((rule) => rule.status !== "pass" && rule.severity === severity).length
      );
    }, 0);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pass":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" /> Pass
          </Badge>
        );
      case "fail":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 hover:bg-red-50 flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" /> Fail
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 hover:bg-amber-50 flex items-center gap-1"
          >
            <Warning className="h-3 w-3" /> Warning
          </Badge>
        );
      case "info":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
          >
            <Info className="h-3 w-3" /> Info
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="rounded-sm">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 hover:bg-amber-50 rounded-sm"
          >
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="rounded-sm">
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  // Open issue dialog
  const openIssueDialog = (issue: ComplianceRule) => {
    setSelectedIssue(issue);
    setIsIssueDialogOpen(true);
  };

  // Generate a fix using AI
  const generateAiFix = async () => {
    if (!selectedIssue) return;

    toast({
      title: "Generating Solution",
      description: "AI is analyzing the issue and generating a solution...",
    });

    try {
      // In a real implementation, this would call the AI endpoint
      // This is a simplified version for demonstration
      setTimeout(() => {
        setAiRuleText(`To fix this issue, ensure that:

1. The property characteristics are accurately described in the report
2. All comparable properties have similar characteristics properly documented
3. The adjustment calculations are clearly explained and justified
4. The reconciliation section addresses how the comparable properties were weighted

This should satisfy the USPAP requirement for clear and accurate reporting.`);

        toast({
          title: "Solution Generated",
          description: "AI has suggested a solution for this compliance issue.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI solution.",
        variant: "destructive",
      });
    }
  };

  // Overall score for current tab
  const overallScore = calculateOverallScore(filteredCategories);

  // High severity issues count
  const highSeverityIssues = getIssueCountBySeverity(filteredCategories, "high");

  // Medium severity issues count
  const mediumSeverityIssues = getIssueCountBySeverity(filteredCategories, "medium");

  // Low severity issues count
  const lowSeverityIssues = getIssueCountBySeverity(filteredCategories, "low");

  // Check if any compliance checks exist
  const hasComplianceChecks = complianceChecks.length > 0;

  // Loading state
  const isLoading = isReportLoading || isPropertyLoading || isComplianceLoading;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div><>

          <h1 className="text-3xl font-bold mb-1">Compliance Check</h1>
          <p
</> className="text-muted-foreground">Verify compliance with USPAP and UAD standards</p>
        </div>

        {!isLoading && report && property && (
          <Card className="bg-muted/30 border-0">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm"><>

                <div className="font-medium">{property.address}</div>
                <div
</> className="text-muted-foreground">|</div><>

                <div>
                  {property.city}, {property.state} {property.zipCode}
                </div>
                <div
</> className="text-muted-foreground">|</div>
                <div>Report #{reportId}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <RotateCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p>Loading compliance data...</p>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="uspap" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="uspap" className="flex gap-1 items-center"><>

                <FileCheck className="h-4 w-4" /> USPAP Compliance
              </TabsTrigger>
              <TabsTrigger
</> value="uad" className="flex gap-1 items-center">
                <FileSpreadsheet className="h-4 w-4" /> UAD Compliance
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2">
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger className="w-[180px]"><>

                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="auto">Auto-select AI</SelectItem>
                  <SelectItem
</> value="openai">OpenAI (GPT-4o)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={runAiComplianceCheck}
                disabled={isAiChecking}
                className="flex items-center gap-1"
              >
                {isAiChecking ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Run AI Compliance Check
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Overall Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-muted-foreground/10"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      /><>

                      <circle
                        className={
                          overallScore >= 90
                            ? "text-green-500"
                            : overallScore >= 70
                              ? "text-amber-500"
                              : "text-red-500"
                        }
                        strokeWidth="10"
                        strokeDasharray={`${overallScore * 2.51} 251`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                      />
                    </svg>
                    <div
</> className="absolute inset-0 flex items-center justify-center flex-col"><>

                      <span className="text-3xl font-bold">{overallScore}%</span>
                      <span
</> className="text-xs text-muted-foreground">compliance</span>
                    </div>
                  </div>
                </div>

                {hasComplianceChecks ? (
                  <div className="text-sm text-center mt-4">
                    <p
                      className={
                        overallScore >= 90
                          ? "text-green-600"
                          : overallScore >= 70
                            ? "text-amber-600"
                            : "text-red-600"
                      }
                    >
                      {overallScore >= 90 ? (
                        <span className="flex items-center justify-center gap-1">
                          <ThumbsUp className="h-4 w-4" /> Excellent!
                        </span>
                      ) : overallScore >= 70 ? (
                        <span className="flex items-center justify-center gap-1">
                          <Warning className="h-4 w-4" /> Needs attention
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <AlertCircle className="h-4 w-4" /> Critical issues
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-center mt-4 text-muted-foreground"><>

                    <p>No compliance checks run yet</p>
                    <Button
</>
                      variant="link"
                      size="sm"
                      className="mt-1"
                      onClick={runAiComplianceCheck}
                    >
                      Run AI check now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Issues by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                {hasComplianceChecks ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <div className="flex items-center"><>

                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span
</>>High Severity</span>
                        </div>
                        <span className="font-medium">{highSeverityIssues}</span>
                      </div><>

                      <Progress value={100} className="h-2 bg-red-100" />
                    </div>

                    <div
</>>
                      <div className="flex justify-between mb-1 text-sm">
                        <div className="flex items-center"><>

                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span
</>>Medium Severity</span>
                        </div>
                        <span className="font-medium">{mediumSeverityIssues}</span>
                      </div><>

                      <Progress value={100} className="h-2 bg-amber-100" />
                    </div>

                    <div
</>>
                      <div className="flex justify-between mb-1 text-sm">
                        <div className="flex items-center"><>

                          <div className="w-3 h-3 rounded-full bg-muted-foreground mr-2"></div>
                          <span
</>>Low Severity</span>
                        </div>
                        <span className="font-medium">{lowSeverityIssues}</span>
                      </div><>

                      <Progress value={100} className="h-2 bg-muted" />
                    </div>

                    <div
</> className="pt-3 text-sm text-muted-foreground">
                      {highSeverityIssues > 0 ? (
                        <p>Critical issues require immediate attention</p>
                      ) : mediumSeverityIssues > 0 ? (
                        <p>Some issues need to be addressed</p>
                      ) : (
                        <p>No critical issues found</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[150px] flex items-center justify-center text-center">
                    <div>
                      <Warning className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No issues detected yet.
                        <br />
                        Run a compliance check first.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{activeTab.toUpperCase()} Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTab === "uspap" ? (
                    <>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            USPAP 2023 Standards <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Official USPAP reference document
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            Advisory Opinions <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Official guidance on USPAP application
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Link className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            FAQs & Interpretations <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Common questions and official answers
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            UAD Specification <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Official UAD technical specification
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            Field Reference Guide <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            UAD field codes and definitions
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <a
                            href="#"
                            className="text-sm font-medium hover:underline flex items-center"
                          >
                            Common UAD Errors <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          <p className="text-xs text-muted-foreground">
                            Frequently encountered UAD issues
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-1" /> Download Full Guide
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="uspap" className="mt-0">
            {complianceChecks.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4"><>

                  <h2 className="text-xl font-semibold">USPAP Standards</h2>
                  <div
</> className="flex items-center gap-2"><>

                    <Label htmlFor="show-failed" className="text-sm cursor-pointer">
                      Show Failed Only
                    </Label>
                    <input
</>
                      id="show-failed"
                      type="checkbox"
                      checked={showFailedOnly}
                      onChange={(e) => setShowFailedOnly(e.target.checked)}
                      className="rounded border-muted"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <Collapsible key={category.name} className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4"><>

                          <h3 className="font-medium">{category.name}</h3>
                          <p
</> className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded overflow-hidden">
                              <div
                                className={`h-full ${
                                  category.progress >= 90
                                    ? "bg-green-500"
                                    : category.progress >= 70
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${category.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{category.progress}%</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0">
                          <Separator className="mb-4" />
                          <div className="space-y-2">
                            {category.rules.length > 0 ? (
                              showFailedOnly ? (
                                category.rules
                                  .filter((rule) => rule.status !== "pass")
                                  .map((rule) => (
                                    <Card key={rule.id} className="overflow-hidden">
                                      <CardContent className="p-3">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                          <div className="flex items-start gap-2">
                                            <div className="pt-0.5">
                                              {rule.status === "fail" ? (
                                                <div className="rounded-full bg-red-100 p-1">
                                                  <XCircle className="h-4 w-4 text-red-600" />
                                                </div>
                                              ) : rule.status === "warning" ? (
                                                <div className="rounded-full bg-amber-100 p-1">
                                                  <Warning className="h-4 w-4 text-amber-600" />
                                                </div>
                                              ) : (
                                                <div className="rounded-full bg-blue-100 p-1">
                                                  <Info className="h-4 w-4 text-blue-600" />
                                                </div>
                                              )}
                                            </div>
                                            <div><>

                                              <div className="font-medium">{rule.name}</div>
                                              <p
</> className="text-sm text-muted-foreground">
                                                {rule.description}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {getSeverityBadge(rule.severity)}
                                            {getStatusBadge(rule.status)}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openIssueDialog(rule)}
                                            >
                                              <ArrowRight className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                              ) : (
                                category.rules.map((rule) => (
                                  <Card key={rule.id} className="overflow-hidden">
                                    <CardContent className="p-3">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                          <div className="pt-0.5">
                                            {rule.status === "pass" ? (
                                              <div className="rounded-full bg-green-100 p-1">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              </div>
                                            ) : rule.status === "fail" ? (
                                              <div className="rounded-full bg-red-100 p-1">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                              </div>
                                            ) : rule.status === "warning" ? (
                                              <div className="rounded-full bg-amber-100 p-1">
                                                <Warning className="h-4 w-4 text-amber-600" />
                                              </div>
                                            ) : (
                                              <div className="rounded-full bg-blue-100 p-1">
                                                <Info className="h-4 w-4 text-blue-600" />
                                              </div>
                                            )}
                                          </div>
                                          <div><>

                                            <div className="font-medium">{rule.name}</div>
                                            <p
</> className="text-sm text-muted-foreground">
                                              {rule.description}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {rule.status !== "pass" &&
                                            getSeverityBadge(rule.severity)}
                                          {getStatusBadge(rule.status)}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openIssueDialog(rule)}
                                          >
                                            <ArrowRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                No rules checked for this category
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed border-2 p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

                <h3 className="text-lg font-medium mb-2">No USPAP Compliance Checks</h3>
                <p
</> className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Run a compliance check to validate your appraisal report against USPAP (Uniform
                  Standards of Professional Appraisal Practice) requirements.
                </p>
                <Button onClick={runAiComplianceCheck} disabled={isAiChecking} className="gap-2">
                  {isAiChecking ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Run USPAP Compliance Check
                    </>
                  )}
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="uad" className="mt-0">
            {complianceChecks.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4"><>

                  <h2 className="text-xl font-semibold">UAD Standards</h2>
                  <div
</> className="flex items-center gap-2"><>

                    <Label htmlFor="show-failed-uad" className="text-sm cursor-pointer">
                      Show Failed Only
                    </Label>
                    <input
</>
                      id="show-failed-uad"
                      type="checkbox"
                      checked={showFailedOnly}
                      onChange={(e) => setShowFailedOnly(e.target.checked)}
                      className="rounded border-muted"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <Collapsible key={category.name} className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4"><>

                          <h3 className="font-medium">{category.name}</h3>
                          <p
</> className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded overflow-hidden">
                              <div
                                className={`h-full ${
                                  category.progress >= 90
                                    ? "bg-green-500"
                                    : category.progress >= 70
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${category.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{category.progress}%</span>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-0">
                          <Separator className="mb-4" />
                          <div className="space-y-2">
                            {category.rules.length > 0 ? (
                              showFailedOnly ? (
                                category.rules
                                  .filter((rule) => rule.status !== "pass")
                                  .map((rule) => (
                                    <Card key={rule.id} className="overflow-hidden">
                                      <CardContent className="p-3">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                          <div className="flex items-start gap-2">
                                            <div className="pt-0.5">
                                              {rule.status === "fail" ? (
                                                <div className="rounded-full bg-red-100 p-1">
                                                  <XCircle className="h-4 w-4 text-red-600" />
                                                </div>
                                              ) : rule.status === "warning" ? (
                                                <div className="rounded-full bg-amber-100 p-1">
                                                  <Warning className="h-4 w-4 text-amber-600" />
                                                </div>
                                              ) : (
                                                <div className="rounded-full bg-blue-100 p-1">
                                                  <Info className="h-4 w-4 text-blue-600" />
                                                </div>
                                              )}
                                            </div>
                                            <div><>

                                              <div className="font-medium">{rule.name}</div>
                                              <p
</> className="text-sm text-muted-foreground">
                                                {rule.description}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {getSeverityBadge(rule.severity)}
                                            {getStatusBadge(rule.status)}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => openIssueDialog(rule)}
                                            >
                                              <ArrowRight className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                              ) : (
                                category.rules.map((rule) => (
                                  <Card key={rule.id} className="overflow-hidden">
                                    <CardContent className="p-3">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                          <div className="pt-0.5">
                                            {rule.status === "pass" ? (
                                              <div className="rounded-full bg-green-100 p-1">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                              </div>
                                            ) : rule.status === "fail" ? (
                                              <div className="rounded-full bg-red-100 p-1">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                              </div>
                                            ) : rule.status === "warning" ? (
                                              <div className="rounded-full bg-amber-100 p-1">
                                                <Warning className="h-4 w-4 text-amber-600" />
                                              </div>
                                            ) : (
                                              <div className="rounded-full bg-blue-100 p-1">
                                                <Info className="h-4 w-4 text-blue-600" />
                                              </div>
                                            )}
                                          </div>
                                          <div><>

                                            <div className="font-medium">{rule.name}</div>
                                            <p
</> className="text-sm text-muted-foreground">
                                              {rule.description}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {rule.status !== "pass" &&
                                            getSeverityBadge(rule.severity)}
                                          {getStatusBadge(rule.status)}
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openIssueDialog(rule)}
                                          >
                                            <ArrowRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              )
                            ) : (
                              <div className="text-center py-6 text-muted-foreground">
                                No rules checked for this category
                              </div>
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed border-2 p-8 text-center">
                <Gauge className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><>

                <h3 className="text-lg font-medium mb-2">No UAD Compliance Checks</h3>
                <p
</> className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Run a compliance check to validate your appraisal report against UAD (Uniform
                  Appraisal Dataset) requirements for GSE submission.
                </p>
                <Button onClick={runAiComplianceCheck} disabled={isAiChecking} className="gap-2">
                  {isAiChecking ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Checking...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Run UAD Compliance Check
                    </>
                  )}
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Issue Details Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIssue?.status === "pass" ? (
                <div className="rounded-full bg-green-100 p-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ) : selectedIssue?.status === "fail" ? (
                <div className="rounded-full bg-red-100 p-1">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              ) : selectedIssue?.status === "warning" ? (
                <div className="rounded-full bg-amber-100 p-1">
                  <Warning className="h-4 w-4 text-amber-600" />
                </div>
              ) : (
                <div className="rounded-full bg-blue-100 p-1">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
              )}
              {selectedIssue?.name}
            </DialogTitle>
            <DialogDescription>{selectedIssue?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4"><>

            <div className="flex flex-wrap gap-2">
              {getStatusBadge(selectedIssue?.status || "info")}
              {selectedIssue?.status !== "pass" &&
                getSeverityBadge(selectedIssue?.severity || "low")}
            </div>

            <Separator
</> />

            <div className="space-y-4">
              <div><>

                <h3 className="text-sm font-medium mb-1">Details</h3>
                <ScrollArea
</> className="h-[150px] border rounded-md p-4">
                  <div className="prose prose-sm max-w-none">
                    <p>{selectedIssue?.details || "No detailed information provided."}</p>
                  </div>
                </ScrollArea>
              </div>

              {selectedIssue?.status !== "pass" && (
                <div><>

                  <h3 className="text-sm font-medium mb-1">Recommendation</h3>
                  <div
</> className="border rounded-md p-4 bg-muted/30">
                    <p className="text-sm">
                      {selectedIssue?.recommendation || "No specific recommendation provided."}
                    </p>
                  </div>
                </div>
              )}

              {selectedIssue?.status !== "pass" && (
                <div>
                  <div className="flex justify-between items-center"><>

                    <h3 className="text-sm font-medium mb-1">AI-Suggested Fix</h3>
                    <Button
</>
                      variant="outline"
                      size="sm"
                      onClick={generateAiFix}
                      className="text-xs px-2 h-7"
                      disabled={!!aiRuleText}
                    >
                      <Refresh className="h-3 w-3 mr-1" /> Generate
                    </Button>
                  </div>

                  {aiRuleText ? (
                    <div className="border rounded-md p-4 bg-primary/5">
                      <p className="text-sm whitespace-pre-line">{aiRuleText}</p>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 bg-muted/30">
                      <p className="text-sm italic text-muted-foreground">
                        Click "Generate" to get AI-suggested solutions for this issue.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button variant="outline" className="gap-1"><>

                <FileText className="h-4 w-4" /> View Reference
              </Button>

              <div
</> className="flex gap-2">
                <Button
                  variant={selectedIssue?.status === "pass" ? "default" : "outline"}
                  onClick={() => setIsIssueDialogOpen(false)}
                >
                  Close
                </Button>

                {selectedIssue?.status !== "pass" && (
                  <Button>
                    <CircleCheck className="h-4 w-4 mr-1" /> Mark as Fixed
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
