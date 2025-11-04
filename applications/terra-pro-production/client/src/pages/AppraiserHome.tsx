import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppraiserPageLayout } from "@/components/layout/appraiser-page-layout";
import NotificationPanel, { Notification } from "@/components/notifications/NotificationPanel";
import { useState, useEffect } from "react";
import { Plus,
  FileText,
  ArrowRight,
  Clock,
  ChevronRight,
  Clipboard,
  ClipboardList,
  Image,
  ArrowUpDown,
  PencilRuler,
  LineChart,
  Building2,
  MailPlus,
  Brain,
  ShieldCheck,
  Send,
  BookOpen,
  CheckCircle2,
  BarChart,
  LayoutDashboard,
  Smartphone,
  Settings,
 } from '@mui/icons-material';

// Type for the status badge component
type StatusBadgeProps = {
  status: string;
};

// Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  let bgColor = "bg-neutral-100";
  let textColor = "text-neutral-700";

  if (status === "In Progress") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
  } else if (status === "Completed") {
    bgColor = "bg-green-100";
    textColor = "text-green-700";
  } else if (status === "Due Soon") {
    bgColor = "bg-amber-100";
    textColor = "text-amber-700";
  } else if (status === "Overdue") {
    bgColor = "bg-red-100";
    textColor = "text-red-700";
  }

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

// Example data for active reports
const EXAMPLE_REPORTS = [
  {
    id: 1,
    address: "123 Main Street, Anytown, USA",
    client: "ABC Mortgage",
    dueDate: "2025-05-15",
    status: "In Progress",
    type: "URAR 1004",
    progress: 35,
  },
  {
    id: 2,
    address: "456 Oak Avenue, Somewhere, USA",
    client: "XYZ Bank",
    dueDate: "2025-05-16",
    status: "Due Soon",
    type: "Condo 1073",
    progress: 15,
  },
  {
    id: 3,
    address: "789 Pine Lane, Elsewhere, USA",
    client: "First National",
    dueDate: "2025-05-13",
    status: "Overdue",
    type: "URAR 1004",
    progress: 65,
  },
  {
    id: 4,
    address: "345 Maple Road, Nowhere, USA",
    client: "Hometown Lender",
    dueDate: "2025-05-22",
    status: "In Progress",
    type: "Manufactured Home 1004C",
    progress: 85,
  },
];

// Example notifications data
const EXAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    message: "You have been assigned a new appraisal order for 789 Pine Lane.",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    type: "alert", // Using allowed types from Notification interface
  },
  {
    id: "2",
    message: "Client requested revisions for order #APO-2025-0031 (345 Maple Road).",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    read: false,
    type: "reminder",
  },
  {
    id: "3",
    message: "Order #APO-2025-0029 was successfully submitted to the client.",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: true,
    type: "update",
  },
];

// Main AppraiserHome Component
export default function AppraiserHome() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeReports, setActiveReports] = useState(EXAMPLE_REPORTS);
  const [notifications, setNotifications] = useState(EXAMPLE_NOTIFICATIONS);

  // Handler for marking notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Handler for marking all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Handler for dismissing a notification
  const handleDismissNotification = (id: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  };

  // Log when the component renders (for debugging)
  useEffect(() => {
    console.log("AppraiserHome component rendering");
  }, []);

  return (
    <AppraiserPageLayout
      title="Terrafusion Pro"
      subtitle="Professional Appraisal Suite"
      showWorkflowContext={false}
      appraisalTips={[
        {
          title: "AI Order Processing",
          content:
            "Use the AI order processing feature to automatically extract property details from emails and PDFs.",
          type: "ai",
        },
        {
          title: "Field Updates Available",
          content:
            "TerraField mobile app has new updates for field data collection with improved photo enhancements.",
          type: "info",
        },
      ]}
      quickActions={[
        {
          label: "Import Order",
          onClick: () => setLocation("/email-order"),
          icon: <MailPlus className="h-4 w-4" />,
          variant: "default",
        },
        {
          label: "View Assignments",
          onClick: () => setLocation("/assignments"),
          icon: <ClipboardList className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Mobile Sync",
          onClick: () => setLocation("/photo-sync-test"),
          icon: <Smartphone className="h-4 w-4" />,
          variant: "outline",
        },
        {
          label: "Settings",
          onClick: () => setLocation("/settings"),
          icon: <Settings className="h-4 w-4" />,
          variant: "outline",
        },
      ]}
      actions={
        <div className="flex gap-2"><>

          <Button
            variant="outline"
            onClick={() => setLocation("/settings")}
            className="hidden md:flex"
          >
            Settings
          </Button>
          <Button
</> onClick={() => setLocation("/email-order")}>
            <MailPlus className="h-4 w-4 mr-2" />
            Import Order
          </Button>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Property Analysis Component Replacement */}
        <div className="bg-white border rounded-md shadow-md">
          <div className="bg-primary text-white p-4 rounded-t-md"><>

            <h2 className="text-xl font-bold">Terrafusion Property Analysis</h2>
            <p
</> className="text-sm opacity-90">AI-powered property valuation and analytics</p>
            <Button
              className="mt-4 bg-white text-primary hover:bg-gray-100"
              onClick={() => (window.location.href = "/property-analyzer")}
            >
              Open New Property Analyzer
            </Button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4"><>

                <h3 className="text-lg font-medium mb-2">Property Details</h3>
                <div
</> className="space-y-3">
                  <div><>

                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
</>
                      type="text"
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter property address"
                      defaultValue="406 Stardust Ct"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div><>

                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
</>
                        type="text"
                        className="w-full p-2 border rounded-md"
                        placeholder="City"
                        defaultValue="Grandview"
                      />
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">State</label>
                      <select
</> className="w-full p-2 border rounded-md" defaultValue="WA"><>

                        <option value="WA">Washington</option>
                        <option
</> value="OR">Oregon</option><>

                        <option value="CA">California</option>
                        <option
</> value="ID">Idaho</option>
                      </select>
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">Zip</label>
                      <input
</>
                        type="text"
                        className="w-full p-2 border rounded-md"
                        placeholder="Zip Code"
                        defaultValue="99347"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div><>

                      <label className="block text-sm font-medium mb-1">Bedrooms</label>
                      <input
</>
                        type="number"
                        className="w-full p-2 border rounded-md"
                        defaultValue="3"
                      />
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">Bathrooms</label>
                      <input
</>
                        type="number"
                        className="w-full p-2 border rounded-md"
                        defaultValue="2"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div><>

                      <label className="block text-sm font-medium mb-1">Square Feet</label>
                      <input
</>
                        type="number"
                        className="w-full p-2 border rounded-md"
                        defaultValue="1850"
                      />
                    </div>
                    <div><>

                      <label className="block text-sm font-medium mb-1">Year Built</label>
                      <input
</>
                        type="number"
                        className="w-full p-2 border rounded-md"
                        defaultValue="1997"
                      />
                    </div>
                  </div>

                  <div><>

                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
</> className="w-full p-2 border rounded-md" defaultValue="Good"><>

                      <option>Excellent</option>
                      <option
</>>Good</option><>

                      <option>Average</option>
                      <option
</>>Fair</option>
                      <option>Poor</option>
                    </select>
                  </div>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 mt-4"
                  onClick={() => (window.location.href = "/property-analysis-new")}
                >
                  Access Full Property Analysis
                </Button>
              </div>

              <div className="border-t pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-6"><>

                <h3 className="text-lg font-medium mb-4">Recent Analysis Results</h3>

                <div
</> className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div><>

                        <p className="font-medium">406 Stardust Ct</p>
                        <p
</> className="text-sm text-gray-600">Grandview, WA 99347</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Completed
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><>

                        <p className="text-gray-500">Estimated Value</p>
                        <p
</> className="font-medium">$315,000</p>
                      </div>
                      <div><>

                        <p className="text-gray-500">Confidence</p>
                        <p
</> className="font-medium">High (94%)</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      View Details
                    </Button>
                  </div>

                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div><>

                        <p className="font-medium">123 Main St</p>
                        <p
</> className="text-sm text-gray-600">Grandview, WA 99347</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Recent</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><>

                        <p className="text-gray-500">Estimated Value</p>
                        <p
</> className="font-medium">$287,500</p>
                      </div>
                      <div><>

                        <p className="text-gray-500">Confidence</p>
                        <p
</> className="font-medium">Medium (78%)</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section - Focused on appraiser's workflow needs */}
        <div className="py-6">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {/* Quick Start Card */}
            <Card className="col-span-full md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Appraiser Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <MailPlus className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">1. Order Intake</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <Building2 className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">2. Property Research</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <Image className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">3. Inspection & Photos</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <ArrowUpDown className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">4. Comps Selection</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <PencilRuler className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">5. Sketch & Form Entry</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <LineChart className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">6. Analysis & Reconciliation</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <FileText className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">7. Report Generation</span><>

                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>

                  <div
</> className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1.5 rounded-full text-primary"><>

                      <Send className="h-5 w-5" />
                    </div>
                    <span
</> className="text-sm font-medium">8. Delivery & Billing</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Appraisal
                </Button>
              </CardFooter>
            </Card>

            {/* Active Assignments Card */}
            <Card className="col-span-full md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div><>

                          <h3 className="font-medium">{report.address}</h3>
                          <div
</> className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><>

                            <span>{report.type}</span>
                            <span
</>>•</span>
                            <span>{report.client}</span>
                          </div>
                        </div><>

                        <StatusBadge status={report.status} />
                      </div>
                      <div
</> className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1"><>

                          <span>Progress</span>
                          <span
</>>{report.progress}%</span>
                        </div><>

                        <Progress value={report.progress} className="h-2" />
                      </div>
                      <div
</> className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setLocation(`/report/${report.id}`)}
                        >
                          Continue
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="outline" size="sm" onClick={() => setLocation("/assignments")}>
                  View All Assignments
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* AI-Powered Tools Section */}
        <div><>

          <h2 className="text-2xl font-semibold mb-6">AI-Powered Tools</h2>
          <div
</> className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Smart Order Intake</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatically extract property details from emails and PDFs.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/email-order")}
                  className="w-full"
                >
                  Process Order
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Comp Selection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-powered comparable property selection and analysis.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/comps-search")}
                  className="w-full"
                >
                  Find Comps
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Form Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intelligent form completion and validation assistance.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/form")}
                  className="w-full"
                >
                  Open Forms
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Market Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Predictive analytics for market trends and forecasting.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/market-analysis")}
                  className="w-full"
                >
                  Analyze Market
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Quick Tasks & Notifications Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/sketch")}
                >
                  <PencilRuler className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Create Sketch</div>
                    <div
</> className="text-xs text-muted-foreground">Draw property sketches</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/photos")}
                >
                  <Image className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Manage Photos</div>
                    <div
</> className="text-xs text-muted-foreground">Upload and organize images</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/comps")}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Comparable Grid</div>
                    <div
</> className="text-xs text-muted-foreground">Edit and adjust comps</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/reports")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Generate Report</div>
                    <div
</> className="text-xs text-muted-foreground">Create final PDF</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/reviews")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Review Assistant</div>
                    <div
</> className="text-xs text-muted-foreground">AI quality check</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => setLocation("/crdt-test")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  <div className="text-left"><>

                    <div className="font-medium text-xs">Mobile Sync</div>
                    <div
</> className="text-xs text-muted-foreground">Connect field device</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDismiss={handleDismissNotification}
              />
            </CardContent>
          </Card>
        </div>

        {/* Productivity Dashboard */}
        <div><>

          <h2 className="text-2xl font-semibold mb-6">Productivity Dashboard</h2>
          <Tabs
</> defaultValue="weekly" className="w-full">
            <TabsList className="mb-4"><>

              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger
</> value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="p-0">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reports Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">2</span>
                      <Badge
</> className="bg-green-100 text-green-800 hover:bg-green-100">+1</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Avg. Completion Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">
                        3.5 <span className="text-base font-normal text-muted-foreground">hrs</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Orders Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">5</span>
                      <Badge
</> className="bg-amber-100 text-amber-800 hover:bg-amber-100">+2</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="p-0">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reports Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">12</span>
                      <Badge
</> className="bg-green-100 text-green-800 hover:bg-green-100">+3</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Avg. Completion Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">
                        4.2 <span className="text-base font-normal text-muted-foreground">hrs</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Orders Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">15</span>
                      <Badge
</> className="bg-amber-100 text-amber-800 hover:bg-amber-100">+5</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="p-0">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reports Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">47</span>
                      <Badge
</> className="bg-green-100 text-green-800 hover:bg-green-100">+12</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Avg. Completion Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">
                        4.5 <span className="text-base font-normal text-muted-foreground">hrs</span>
                      </div>
                      <Progress value={82} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Orders Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline space-x-2"><>

                      <span className="text-3xl font-bold">52</span>
                      <Badge
</> className="bg-amber-100 text-amber-800 hover:bg-amber-100">+15</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppraiserPageLayout>
  );
}
