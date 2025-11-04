import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { PageLayout } from "@/components/layout/page-layout";
import { AIFeatureIntro } from "@/components/home/AIFeatureIntro";
import NotificationPanel, { Notification } from "@/components/notifications/NotificationPanel";
import { Plus,
  FileText,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clipboard,
  FileBarChart2,
  Building2,
  ClipboardList,
  Image,
  PencilRuler,
  ArrowUpDown,
  MailPlus,
  Brain,
  BookOpen,
  Layers,
  LineChart,
  Send,
  ShieldCheck,
  Home as HomeIcon,
  LayoutDashboard,
  BarChart,
 } from '@mui/icons-material';
import { useApp } from "@/contexts/AppContext";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ProfileMiniCard } from "@/components/gamification/ProfileMiniCard";

// Interface for active appraisal reports
interface AppraisalReport {
  id: string;
  address: string;
  type: string;
  clientName: string;
  dueDate: string;
  status: "draft" | "in-progress" | "review" | "completed";
  progress: number;
  lastUpdated: string;
  orderNumber: string; // Added field for order reference
}

// Using the Notification type from our NotificationPanel component

// Component for displaying status badge
function StatusBadge({ status }: { status: AppraisalReport["status"] }) {
  const variants = {
    draft: { variant: "outline", icon: <CircleDashed className="h-3 w-3 mr-1" /> },
    "in-progress": { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
    review: { variant: "default", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    completed: { variant: "success", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  };

  const { variant, icon } = variants[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");

  return (
    <Badge variant={variant as any} className="flex items-center">
      {icon}
      <span>{label}</span>
    </Badge>
  );
}

// Main Dashboard Component
export default function EnhancedHome() {
  const [_, setLocation] = useLocation();
  const { startLoading, stopLoading, setError, clearError, startSync, syncSuccess, state } =
    useApp();
  const [activeReports, setActiveReports] = useState<AppraisalReport[]>([]);
  const [recentReports, setRecentReports] = useState<AppraisalReport[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  console.log("Home component rendering");

  // Simulate loading on initial render
  useEffect(() => {
    const loadDashboard = async () => {
      startLoading("Loading dashboard data...");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Load mock data for demonstration
      setActiveReports([
        {
          id: "apr-1001",
          address: "123 Main St, Cityville, CA 90210",
          type: "Single Family",
          clientName: "First National Bank",
          dueDate: "2025-05-15",
          status: "in-progress",
          progress: 65,
          lastUpdated: "2025-04-25",
          orderNumber: "ORD-4581",
        },
        {
          id: "apr-998",
          address: "456 Oak Avenue, Townsburg, CA 90211",
          type: "Condominium",
          clientName: "Homeward Mortgage",
          dueDate: "2025-05-02",
          status: "review",
          progress: 92,
          lastUpdated: "2025-04-26",
          orderNumber: "ORD-4492",
        },
      ]);

      setRecentReports([
        {
          id: "apr-997",
          address: "789 Pine Road, Villageton, CA 90212",
          type: "Multi-Family",
          clientName: "Unity Credit Union",
          dueDate: "2025-04-20",
          status: "completed",
          progress: 100,
          lastUpdated: "2025-04-19",
          orderNumber: "ORD-4389",
        },
        {
          id: "apr-995",
          address: "321 Cedar Lane, Hamletville, CA 90213",
          type: "Single Family",
          clientName: "Regional Bank Trust",
          dueDate: "2025-04-15",
          status: "completed",
          progress: 100,
          lastUpdated: "2025-04-14",
          orderNumber: "ORD-4350",
        },
      ]);

      setNotifications([
        {
          id: "notif-1",
          type: "compliance",
          message: "Appraisal #apr-998 requires compliance review before submission",
          date: "2025-04-26",
          read: false,
          importance: "high",
          aiGenerated: true,
        },
        {
          id: "notif-2",
          type: "reminder",
          message: "Appraisal #apr-1001 due in 18 days",
          date: "2025-04-27",
          read: true,
          importance: "medium",
        },
        {
          id: "notif-3",
          type: "update",
          message: "TerraField mobile app synced 15 new photos for 123 Main St",
          date: "2025-04-25",
          read: true,
        },
        {
          id: "notif-4",
          type: "insight",
          message: "AI analysis detected a 3.2% valuation variance in comparable selection",
          date: "2025-04-26",
          read: false,
          importance: "high",
          aiGenerated: true,
        },
        {
          id: "notif-5",
          type: "market",
          message: "Market trend analysis shows price stability in the subject property zone",
          date: "2025-04-25",
          read: false,
          importance: "medium",
          aiGenerated: true,
        },
      ]);

      // Simulate sync process
      startSync(5);
      await new Promise((resolve) => setTimeout(resolve, 500));
      syncSuccess();

      stopLoading();
    };

    loadDashboard();

    // Clean up
    return () => {
      stopLoading();
      clearError();
    };
  }, []);

  const renderAppraisalCard = (report: AppraisalReport) => (
    <Card key={report.id} className="group hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between"><>

          <Badge variant="outline" className="mb-1 font-normal">
            {report.type}
          </Badge>
          <StatusBadge
</> status={report.status} />
        </div><>

        <CardTitle className="text-lg">{report.address}</CardTitle>
        <CardDescription
</>>Client: {report.clientName}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground"><>

            <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
            <span
</>>Last updated: {new Date(report.lastUpdated).toLocaleDateString()}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm font-medium"><>

              <span>Progress</span>
              <span
</>>{report.progress}%</span>
            </div>
            <Progress value={report.progress} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button
          variant="ghost"
          className="text-xs h-8 px-2 mr-1"
          onClick={() => setLocation(`/property/${report.id}`)}
        ><>

          <Building2 className="h-3.5 w-3.5 mr-1" />
          Property
        </Button>
        <Button
</>
          variant="ghost"
          className="text-xs h-8 px-2 mr-1"
          onClick={() => setLocation(`/workflow/${report.id}`)}
        ><>

          <Layers className="h-3.5 w-3.5 mr-1" />
          Workflow
        </Button>
        <Button
</>
          variant="ghost"
          className="ml-auto text-xs h-8 px-3"
          onClick={() => setLocation(`/reports/${report.id}`)}
        >
          Continue
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <PageLayout
      title="Terrafusion Dashboard"
      description="Your real estate appraisal command center"
      showSyncStatus={true}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log("Create New Report clicked");
              setLocation("/appraisal/new");
            }}
            className="hidden sm:flex"
          ><>

            <Plus className="mr-2 h-4 w-4" />
            New Appraisal
          </Button>
          <Button
</>
            onClick={() => {
              console.log("Import Order clicked");
              setLocation("/email-order");
            }}
          >
            <MailPlus className="mr-2 h-4 w-4" />
            Import Order
          </Button>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Hero Section - Focused on appraiser's workflow needs */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 flex flex-col justify-center">
              <h1 className="text-4xl font-medium tracking-tight mb-6 text-black">
                ***APPRAISER UI TEST*** <br />
                PLEASE CONFIRM YOU SEE THIS
              </h1><>


              <p className="text-lg text-neutral-600 mb-8">
                Complete URAR forms, run comps analysis, and deliver reports faster with integrated
                tools designed for real estate appraisers.
              </p>

              <div
</> className="flex flex-col gap-4">
                <Button
                  size="lg"
                  className="bg-black text-white hover:bg-black/95 h-14 text-base font-normal w-full md:w-auto"
                  onClick={() => setLocation("/appraisal/new")}
                ><>

                  <FileText className="mr-2 h-5 w-5" />
                  Start New Report
                </Button>

                <div
</> className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border border-neutral-300 text-base font-normal"
                    onClick={() => setLocation("/email-order")}
                  ><>

                    <MailPlus className="mr-2 h-5 w-5" />
                    Import Order
                  </Button>

                  <Button
</>
                    variant="outline"
                    className="flex-1 h-12 border border-neutral-300 text-base font-normal"
                    onClick={() => setLocation("/reports")}
                  >
                    <Clipboard className="mr-2 h-5 w-5" />
                    My Reports
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 p-6">
                <div className="flex items-center justify-between mb-4"><>

                  <h2 className="text-lg font-medium">Quick Tasks</h2>
                  <Badge
</> variant="outline" className="bg-neutral-100">
                    Appraiser Shortcuts
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation("/continue-appraisal")}
                  >
                    <ClipboardList className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left"><>

                      <div className="font-medium">Continue Report</div>
                      <div
</> className="text-xs text-neutral-500">Last: 123 Main St</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation("/comps-search")}
                  >
                    <ArrowUpDown className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left"><>

                      <div className="font-medium">Run Comps Search</div>
                      <div
</> className="text-xs text-neutral-500">Find comparable sales</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation("/photo-import")}
                  >
                    <Image className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left"><>

                      <div className="font-medium">Import Photos</div>
                      <div
</> className="text-xs text-neutral-500">From device or TerraField</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-12 bg-white border-neutral-200"
                    onClick={() => setLocation("/review-submit")}
                  >
                    <Send className="mr-2 h-5 w-5 text-neutral-600" />
                    <div className="text-left"><>

                      <div className="font-medium">Review & Submit</div>
                      <div
</> className="text-xs text-neutral-500">Finalize reports</div>
                    </div>
                  </Button>
                </div>

                {activeReports.length > 0 && (
                  <div className="mt-5 border-t border-neutral-200 pt-4">
                    <div className="flex items-center justify-between mb-3"><>

                      <h3 className="text-sm font-medium">Current Assignments</h3>
                      <Badge
</> variant="secondary" className="bg-neutral-100 text-xs">
                        {activeReports.length} Active
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {activeReports.slice(0, 2).map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded cursor-pointer hover:border-neutral-400"
                          onClick={() => setLocation(`/report/${report.id}`)}
                        >
                          <div><>

                            <div className="font-medium text-sm">{report.address}</div>
                            <div
</> className="text-xs text-neutral-500">
                              Due: {report.dueDate} • {report.progress}% complete
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reports - Absolute minimalism */}
        {activeReports.length > 0 && (
          <div className="py-28"><>

            <h2 className="text-2xl font-medium mb-14">Reports</h2>

            <div
</>>
              {activeReports.map((report /* , index */) => (
                <div
                  key={report.id}
                  onClick={() => setLocation(`/report/${report.id}`)}
                  className={`py-8 ${index !== activeReports.length - 1 ? "border-b border-neutral-200" : ""} group cursor-pointer`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-y-4">
                    <div className="md:col-span-6">
                      <h3 className="text-xl font-normal">{report.address}</h3>
                    </div><>


                    <div className="md:col-span-4 text-neutral-500">{report.orderNumber}</div>

                    <div
</> className="md:col-span-2 text-right group-hover:text-black transition-colors">
                      <ArrowRight className="inline-block h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appraiser Workflow Tools - Practical appraisal functions */}
        <div className="py-12 border-t border-neutral-100"><>

          <h2 className="text-2xl font-medium mb-2">Appraiser Workflow</h2>
          <p
</> className="text-neutral-500 mb-10">
            Practical tools to complete appraisals efficiently and meet client requirements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6">
            {/* Primary tools - First row, more prominent */}
            <div
              onClick={() => setLocation("/orders")}
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <MailPlus className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Order Intake</h3>
              </div><>

              <p className="mb-4 opacity-80">Import and manage new orders from AMCs and lenders</p>
              <div
</> className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/form-filling")}
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <ClipboardList className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Form Filling</h3>
              </div><>

              <p className="mb-4 opacity-80">
                Complete URAR, 1004, and other standard appraisal forms
              </p>
              <div
</> className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/comps-map")}
              className="md:col-span-4 bg-black text-white p-6 hover:bg-black/90 cursor-pointer group"
            >
              <div className="flex items-center mb-4">
                <ArrowUpDown className="h-8 w-8 mr-3" />
                <h3 className="text-xl font-normal">Comp Selection</h3>
              </div><>

              <p className="mb-4 opacity-80">
                Select and adjust comparable properties for accurate valuations
              </p>
              <div
</> className="flex justify-end">
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Secondary tools - Second row */}
            <div
              onClick={() => setLocation("/photo-import")}
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3"><>

                <Image className="h-7 w-7 text-neutral-800" />
              </div>
              <h3
</> className="text-base font-medium mb-1">Photo Import</h3>
              <p className="text-neutral-500 text-sm">Import & organize property photos</p>
            </div>

            <div
              onClick={() => setLocation("/sketch")}
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3"><>

                <PencilRuler className="h-7 w-7 text-neutral-800" />
              </div>
              <h3
</> className="text-base font-medium mb-1">Sketch Tool</h3>
              <p className="text-neutral-500 text-sm">Draw floor plans with GLA calculation</p>
            </div>

            <div
              onClick={() => setLocation("/ai-valuation")}
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3"><>

                <Brain className="h-7 w-7 text-neutral-800" />
              </div>
              <h3
</> className="text-base font-medium mb-1">AI Valuation</h3>
              <p className="text-neutral-500 text-sm">AI-assisted valuation modeling</p>
            </div>

            <div
              onClick={() => setLocation("/final-review")}
              className="md:col-span-3 border border-neutral-200 p-5 hover:border-neutral-400 transition-colors cursor-pointer group"
            >
              <div className="mb-3"><>

                <CheckCircle2 className="h-7 w-7 text-neutral-800" />
              </div>
              <h3
</> className="text-base font-medium mb-1">Review & Submit</h3>
              <p className="text-neutral-500 text-sm">Check for errors and submit reports</p>
            </div>
          </div>
        </div>

        {/* In-Progress Assignments Section */}
        <div className="py-12 border-t border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <div><>

              <h2 className="text-2xl font-medium mb-1">My Assignments</h2>
              <p
</> className="text-neutral-500">
                Track deadlines and progress across all your active appraisals
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/workload")}
                className="hidden md:flex"
              ><>

                <BarChart className="h-4 w-4 mr-2" />
                Workload Manager
              </Button>

              <Button
</> onClick={() => setLocation("/appraisal/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Active Appraisal List */}
            <div className="md:col-span-8">
              {activeReports.length > 0 ? (
                <div className="overflow-hidden border border-neutral-200 rounded-md">
                  <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-neutral-700" />
                      <h3 className="font-medium text-sm">Appraisal Queue</h3>
                    </div>
                    <Badge variant="outline" className="text-xs bg-neutral-100">
                      {activeReports.length} Active
                    </Badge>
                  </div>

                  <div className="divide-y divide-neutral-200">
                    {activeReports.map((report) => (
                      <div
                        key={report.id}
                        className="hover:bg-neutral-50 cursor-pointer transition-colors"
                      >
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium flex items-center">
                              {report.address}<>

                              <ChevronRight className="h-4 w-4 ml-1 text-neutral-400" />
                            </h4>
                            <StatusBadge
</> status={report.status} />
                          </div><>


                          <div className="text-neutral-500 text-sm mb-3">
                            Order #{report.orderNumber} • {report.type} • {report.clientName}
                          </div>

                          <div
</> className="flex flex-col sm:flex-row gap-1 sm:gap-4 items-start sm:items-center mb-2 text-sm">
                            <div className="flex items-center text-neutral-600">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span
                                className={
                                  report.dueDate === "2025-05-02" ? "text-red-600 font-medium" : ""
                                }
                              >
                                Due {new Date(report.dueDate).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex-1 w-full">
                              <div className="flex items-center gap-3">
                                <Progress value={report.progress} className="flex-1 h-1.5" />
                                <span className="text-xs text-neutral-500 whitespace-nowrap">
                                  {report.progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-2 bg-neutral-50 flex justify-between border-t border-neutral-100">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/report/${report.id}/urar`);
                              }}
                            ><>

                              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                              URAR Form
                            </Button>

                            <Button
</>
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/report/${report.id}/comps`);
                              }}
                            >
                              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                              Comps Grid
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            className="h-8 text-xs bg-black text-white hover:bg-black/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/report/${report.id}/continue`);
                            }}
                          >
                            Continue <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeReports.length > 2 && (
                    <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-center">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs"
                        onClick={() => setLocation("/dashboard/assignments")}
                      >
                        View All Assignments
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-neutral-200 p-8 text-center rounded-md">
                  <div className="bg-neutral-50 inline-flex items-center justify-center p-4 rounded-full mb-4"><>

                    <FileText className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3
</> className="text-lg font-medium mb-2">No active assignments</h3><>

                  <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                    Get started by importing an order or creating a new appraisal report
                  </p>
                  <div
</> className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => setLocation("/email-order")}
                      className="bg-black text-white hover:bg-black/90"
                    ><>

                      <MailPlus className="h-4 w-4 mr-2" />
                      Import Order
                    </Button>
                    <Button
</> variant="outline" onClick={() => setLocation("/appraisal/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Productivity Stats & Notifications */}
            <div className="md:col-span-4 space-y-6">
              {/* Productivity Stats Card */}
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                  <h3 className="font-medium">Productivity Stats</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm"><>

                        <span className="text-neutral-600">Weekly Capacity</span>
                        <span
</> className="font-medium">8/10 Reports</span>
                      </div><>

                      <Progress value={80} className="h-1.5" />
                    </div>

                    <div
</>>
                      <div className="flex justify-between mb-1 text-sm"><>

                        <span className="text-neutral-600">Due This Week</span>
                        <span
</> className="font-medium text-amber-600">3 Reports</span>
                      </div><>

                      <Progress value={30} className="h-1.5 bg-amber-100" />
                    </div>

                    <div
</>>
                      <div className="flex justify-between mb-1 text-sm"><>

                        <span className="text-neutral-600">Avg. Completion Time</span>
                        <span
</> className="font-medium">3.2 Days</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications Panel */}
              <div className="border border-neutral-200 rounded-md overflow-hidden">
                <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                <div className="p-0">
                  <NotificationPanel
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDismiss={handleDismissNotification}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appraisal Tools - AI and Productivity Features */}
        <div className="py-12 border-t border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <div><>

              <h2 className="text-2xl font-medium mb-1">Appraisal Assistants</h2>
              <p
</> className="text-neutral-500">
                AI tools to help you complete appraisals faster and with greater accuracy
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => setLocation("/urar-assistant")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">URAR Assistant</h3>
                  <p
</> className="text-xs text-neutral-500">Form completion help</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                AI-powered assistance for completing URAR and other standard appraisal forms with
                relevant suggestions
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">
                  USPAP Compliant
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/comps-assistant")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <ArrowUpDown className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">Comps Finder</h3>
                  <p
</> className="text-xs text-neutral-500">Automated comps search</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                Discover the most relevant comparable properties with automated adjustment
                recommendations
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">
                  MLS Integration
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/condition-assistant")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <Image className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">Condition Analyzer</h3>
                  <p
</> className="text-xs text-neutral-500">Photo-based condition scoring</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                AI analysis of property photos to automatically detect condition issues and suggest
                condition scores
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="secondary" className="mr-2 text-xs">
                  New
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/compliance-checker")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">Compliance Checker</h3>
                  <p
</> className="text-xs text-neutral-500">Pre-submission validation</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                Automatically check your appraisal reports for potential compliance issues and hard
                stops
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">
                  FNMA/FHA Rules
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/mobile-sync")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">TerraField Mobile</h3>
                  <p
</> className="text-xs text-neutral-500">Mobile app integration</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                Sync field data and photos captured with your mobile device directly to your
                appraisal reports
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">
                  iOS & Android
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => setLocation("/batch-tools")}
              className="bg-neutral-50 border border-neutral-200 p-5 rounded-md hover:border-neutral-400 cursor-pointer group"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 bg-black rounded-md mr-3"><>

                  <BarChart className="h-5 w-5 text-white" />
                </div>
                <div
</>><>

                  <h3 className="font-medium">Productivity Tools</h3>
                  <p
</> className="text-xs text-neutral-500">Batch processing features</p>
                </div>
              </div><>

              <p className="text-sm text-neutral-600 mb-3">
                Import and process multiple reports at once, schedule tasks, and manage your team's
                workload
              </p>
              <div
</> className="flex items-center text-sm text-neutral-500"><>

                <Badge variant="outline" className="mr-2 text-xs bg-neutral-100">
                  Pro Feature
                </Badge>
                <ArrowRight
</> className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
