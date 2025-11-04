import React, { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Home,
  FileText,
  Image,
  PencilRuler,
  FileBarChart2,
  ShieldCheck,
  Brain,
  MailPlus,
  Database,
  Upload,
  Book,
  Refresh,
  Cloud,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  HelpCircle,
  LayoutDashboard,
  ClipboardList,
  Workflow,
  FileLineChart,
  Building2,
  FileCheck,
  Smartphone,
  Lightbulb,
  FolderSync,
  Images,
  Cog,
  Inbox,
  Search,
  Activity,
  Zap,
  Sparkles,
  Network,
 } from '@mui/icons-material';
import { SyncStatus } from "@/components/ui/sync-status";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interface for navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
  };
  active?: boolean;
  description?: string; // Description for tooltip
}

// Section interface for grouping navigation items
interface NavSection {
  title: string;
  items: NavItem[];
}

// Component for rendering individual navigation links
function NavLink({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const isActive = location === item.href || item.active;

  return (
    <div className="flex items-center">
      {item.description ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => console.log(`${item.label} clicked`)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badge.variant} className="ml-auto">
                      {item.badge.text}
                    </Badge>
                  )}
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Link href={item.href}>
          <div
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors cursor-pointer",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => console.log(`${item.label} clicked`)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant={item.badge.variant} className="ml-auto">
                {item.badge.text}
              </Badge>
            )}
          </div>
        </Link>
      )}
    </div>
  );
}

// NavSection component to render section with title and items
function NavSection({ section }: { section: NavSection }) {
  return (
    <div className="space-y-1">
      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center"><>

          <span className="w-full border-t border-muted" />
        </div>
        <div
</> className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-medium">
            {section.title}
          </span>
        </div>
      </div>
      <div className="space-y-1 pt-2">
        {section.items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Appraisal Workflow - Redesigned to emphasize the AI-enhanced appraisal process
  const appraisalWorkflowItems: NavItem[] = [
    {
      href: "/legacy-import",
      label: "Legacy Importer",
      icon: <Database className="h-4 w-4" />,
      description: "Import legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, Alamode",
    },
    {
      href: "/property-analysis-new",
      label: "Property Analysis",
      icon: <LayoutDashboard className="h-4 w-4" />,
      description: "AI-powered property analysis for any property",
    },
    {
      href: "/email-order",
      label: "Order Intake",
      icon: <Inbox className="h-4 w-4" />,
      description: "AI-assisted order processing and property identification",
    },
    {
      href: "/property-data",
      label: "Property Intelligence",
      icon: <Building2 className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Smart property data with AI-enriched information",
    },
    {
      href: "/comps-search",
      label: "Smart Comparables",
      icon: <Search className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "AI-driven comparable selection and analysis",
    },
    {
      href: "/photos",
      label: "Visual Analysis",
      icon: <Images className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Computer vision for property condition assessment",
    },
    {
      href: "/urar",
      label: "AI Form Assistant",
      icon: <FileCheck className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Intelligent form completion and validation",
    },
    {
      href: "/infiniform",
      label: "Infiniform Engine",
      icon: <Sparkles className="h-4 w-4" />,
      badge: { text: "∞", variant: "destructive" },
      description: "Post-human appraisal intelligence - living protocol system",
    },
  ];

  // AI Analysis Tools - Enhanced AI-specific features prominently displayed
  const aiAnalysisItems: NavItem[] = [
    {
      href: "/ai-valuation",
      label: "AI Valuations",
      icon: <Brain className="h-4 w-4" />,
      badge: { text: "Core", variant: "default" },
      description: "Machine learning-powered property valuation engine",
    },
    {
      href: "/meta-infrastructure",
      label: "Meta-Infrastructure",
      icon: <Zap className="h-4 w-4" />,
      badge: { text: "Advanced", variant: "default" },
      description: "Blockchain verification, predictive modeling, and drone coordination",
    },
    {
      href: "/market-analysis",
      label: "Market Intelligence",
      icon: <Lightbulb className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Predictive analytics for market trends and forecasting",
    },
    {
      href: "/condition-assessment",
      label: "Condition Analysis",
      icon: <Activity className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "AI assessment of property condition from photos",
    },
    {
      href: "/batch-adjustment",
      label: "Smart Adjustments",
      icon: <FileBarChart2 className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "AI-recommended adjustments for comparable properties",
    },
    {
      href: "/system-monitor",
      label: "AI Model Health",
      icon: <Activity className="h-4 w-4" />,
      description: "Monitor AI model performance and accuracy metrics",
    },
    {
      href: "/uad-pipeline",
      label: "UAD 3.6 Pipeline",
      icon: <Zap className="h-4 w-4" />,
      badge: { text: "Live", variant: "default" },
      description: "UAD 3.6 form pipeline with simulation and validation suite",
    },
    {
      href: "/neural-appraiser",
      label: "Neural Appraiser",
      icon: <Brain className="h-4 w-4" />,
      badge: { text: "NAME", variant: "destructive" },
      description: "Digital twin agents learning from 72,000+ real-world appraisal forms",
    },
    {
      href: "/multi-zip-forecast",
      label: "Multi-Zip Forecast",
      icon: <TrendingUp className="h-4 w-4" />,
      badge: { text: "MZDF", variant: "destructive" },
      description: "Predictive modeling for infrastructure investment and land lift forecasting",
    },
    {
      href: "/zk-chain-trust",
      label: "zkChain of Trust",
      icon: <Shield className="h-4 w-4" />,
      badge: { text: "ZCT", variant: "destructive" },
      description: "Zero-knowledge proof verification for appraisal integrity",
    },
    {
      href: "/uad-training",
      label: "UAD Training Agent",
      icon: <GraduationCap className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "AI-powered training system for UAD 3.6 compliance and certification",
    },
    {
      href: "/agent-sessions",
      label: "Agent Sessions",
      icon: <Bot className="h-4 w-4" />,
      badge: { text: "Live", variant: "destructive" },
      description: "Real-time monitoring of appraiser simulation and training sessions",
    },
    {
      href: "/infiniform",
      label: "Infiniform Engine",
      icon: <Sparkles className="h-4 w-4" />,
      badge: { text: "∞", variant: "destructive" },
      description: "Post-human appraisal intelligence - living protocol system",
    },
  ];

  // Report Generation - Tools for finalizing and delivering reports
  const reportToolsItems: NavItem[] = [
    {
      href: "/sketches",
      label: "Property Sketches",
      icon: <PencilRuler className="h-4 w-4" />,
      description: "Create and edit property floor plans",
    },
    {
      href: "/reports",
      label: "Report Builder",
      icon: <FileCheck className="h-4 w-4" />,
      description: "Generate and export professional appraisal reports",
    },
    {
      href: "/compliance",
      label: "AI Compliance Check",
      icon: <ShieldCheck className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Intelligent verification of report compliance",
    },
    {
      href: "/reviewer",
      label: "Review Dashboard",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: { text: "AI", variant: "secondary" },
      description: "Collaborative review with AI quality analysis",
    },
  ];

  // TerraField Mobile Features
  const terraFieldItems: NavItem[] = [
    {
      href: "/photo-sync-test",
      label: "Field Sync",
      icon: <FolderSync className="h-4 w-4" />,
      description: "Synchronize data with mobile devices",
    },
    {
      href: "/photo-enhancement",
      label: "Photo Enhancement",
      icon: <Image className="h-4 w-4" />,
      description: "Enhance and correct property photos",
    },
    {
      href: "/crdt-test",
      label: "Offline Editing",
      icon: <Workflow className="h-4 w-4" />,
      description: "Test offline data synchronization",
    },
    {
      href: "/notification-test",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      description: "Manage mobile notifications",
    },
  ];

  // Utilities and Reference
  const utilityItems: NavItem[] = [
    {
      href: "/legacy-import",
      label: "Legacy Importer",
      icon: <Database className="h-4 w-4" />,
      description: "Import legacy appraisal data from TOTAL, ClickForms, ACI, DataMaster, Alamode",
    },
    {
      href: "/import",
      label: "Import Data",
      icon: <Upload className="h-4 w-4" />,
      description: "Import data from external sources",
    },
    {
      href: "/terms",
      label: "Terminology",
      icon: <Book className="h-4 w-4" />,
      description: "Real estate terminology reference",
    },
    {
      href: "/system-monitor",
      label: "System Monitor",
      icon: <Activity className="h-4 w-4" />,
      description: "Monitor system health and performance",
    },
    {
      href: "/basic-ws-test",
      label: "WebSocket Test",
      icon: <Refresh className="h-4 w-4" />,
      description: "Test WebSocket connectivity",
      badge: { text: "New", variant: "secondary" },
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Cog className="h-4 w-4" />,
      description: "Application settings and preferences",
    },
    {
      href: "/help",
      label: "Help & Support",
      icon: <HelpCircle className="h-4 w-4" />,
      description: "Get help and access documentation",
    },
  ];

  // Navigation sections for sidebar - reorganized to highlight AI capabilities
  const navSections: NavSection[] = [
    { title: "AI-Powered Workflow", items: appraisalWorkflowItems },
    { title: "Smart Analysis", items: aiAnalysisItems },
    { title: "Report Generation", items: reportToolsItems },
    { title: "TerraField Mobile", items: terraFieldItems },
    { title: "Utilities", items: utilityItems },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background shadow-md"><>

        <div className="h-1.5 w-full bg-gradient-to-r from-primary/80 via-blue-600/60 to-primary/80 animate-pulse"></div>
        <div
</> className="container flex h-16 items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <div className="flex items-center gap-2 border-b pb-4">
                  <a href="/" className="flex items-center gap-2 font-semibold">
                    <div className="relative">
                      <Brain className="h-6 w-6 text-primary" />
                      <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <span className="flex items-center gap-1"><>

                      <span className="font-bold">Terra</span>
                      <span
</> className="text-primary font-bold">Fusion</span>
                      <Badge
                        variant="outline"
                        className="h-5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
                      >
                        AI
                      </Badge>
                    </span>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="mt-4 flex-1 space-y-4 overflow-auto">
                  {navSections.map((section /* , index */) => (
                    <div key={index} className="space-y-1">
                      <div className="relative py-2">
                        <div className="relative flex text-xs uppercase">
                          <span className="bg-background text-muted-foreground font-medium flex items-center gap-1">
                            {section.title.includes("AI") && (
                              <Zap className="h-3 w-3 text-primary" />
                            )}
                            {section.title}
                          </span>
                        </div>
                      </div>
                      {section.items.map((item) => (
                        <NavLink key={item.href} item={item} />
                      ))}
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <a href="/" className="flex items-center gap-2">
              <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background"></div>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base flex items-center">
                  Terrafusion<span className="text-primary">AI</span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Intelligent Appraisal Platform
                </span>
              </div>
            </a>

            {/* AI Quick Actions */}
            <div className="ml-4 hidden md:flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary"
                      onClick={() => (window.location.href = "/email-order")}
                    >
                      <Zap className="h-3.5 w-3.5 mr-1 animate-pulse" />
                      AI Order Processing
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Process new orders with AI assistance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => (window.location.href = "/ai-valuation")}
                    >
                      <Brain className="h-3.5 w-3.5 mr-1 text-primary" />
                      Smart Valuation
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI-powered property valuations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            {/* AI Model Status Indicator */}
            <div className="hidden md:flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-200">
              <div className="flex items-center"><>

                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span
</> className="text-xs font-medium">AI Models: Optimal</span>
              </div>
            </div>

            {/* SyncStatus with default values */}
            <div className="flex items-center gap-2">
              <SyncStatus state="synced" lastSynced={new Date()} />

              {/* Add link to WebSocket Test */}
              <a href="/basic-ws-test">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs flex items-center gap-1"
                >
                  <Refresh className="h-3 w-3" />
                  WS Test
                </Button>
              </a>
            </div>

            {/* Help button with AI badge */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex relative">
                    <HelpCircle className="h-5 w-5" /><>

                    <div className="absolute -top-1.5 -right-1.5 bg-primary text-[10px] text-white px-1 rounded-full">
                      AI
                    </div>
                    <span
</> className="sr-only">AI Help</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get AI-powered assistance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* TerraField Mobile Integration */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-primary" /><>

                    <span>TerraField</span>
                    <Badge
</> className="ml-1.5 h-4 px-1 text-[10px]">Connected</Badge>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mobile app is connected and syncing with AI</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User dropdown with AI assistant */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-primary/30 flex items-center gap-2"
                >
                  <div className="relative">
                    <User className="h-4 w-4" />
                    <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500"></div>
                  </div><>

                  <span className="text-sm hidden md:inline-block">John Appraiser</span>
                  <Badge
</>
                    variant="outline"
                    className="hidden md:flex h-5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
                  >
                    <Zap className="h-3 w-3 mr-0.5" />
                    AI Assistant
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1"><>

                      <p className="text-sm font-medium leading-none">John Appraiser</p>
                      <p
</> className="text-xs leading-none text-muted-foreground">
                        john@appraisal.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <Badge
                    variant="outline"
                    className="h-5 text-[10px] font-semibold bg-primary/10 text-primary border-primary/30"
                  >
                    Pro
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Brain className="mr-2 h-4 w-4 text-primary" />
                  <span>My AI Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="bg-primary/5">
                  <Zap className="mr-2 h-4 w-4 text-primary" />
                  <span>AI Command Center</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar navigation with AI indicators */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-background shadow-inner relative">
          {/* AI Activity Indicator */}
          <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-primary/50"></div>

          {/* AI Status Summary */}
          <div className="px-4 py-3 border-b flex items-center">
            <div className="bg-primary/5 border border-primary/20 rounded-md py-2 px-3 w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium flex items-center"><>

                  <Brain className="h-3.5 w-3.5 text-primary mr-1.5" />
                  AI Assistant Status
                </span>
                <Badge
</> className="h-4 text-[10px]">Active</Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <div className="flex items-center"><>

                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
                    <span
</>>Valuation</span>
                  </div>
                  <div className="flex items-center"><>

                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
                    <span
</>>Condition</span>
                  </div>
                </div>
                <button className="text-primary text-[10px] hover:underline">Details</button>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-auto py-4 px-4">
            {navSections.map((section /* , index */) => (
              <NavSection key={index} section={section} />
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Enhanced AI-powered Footer */}
      <footer className="border-t py-4 bg-background relative">
        {/* Subtle AI activity indicator */}<>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>

        <div
</> className="container flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <Brain className="h-3 w-3 text-primary mr-1.5" />
              <p className="text-xs font-medium">
                Terrafusion<span className="text-primary">AI</span> Platform
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; 2025 Intelligent Real Estate Appraisal Technology
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 divide-x divide-muted">
              <div className="flex items-center px-2"><>

                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span
</> className="text-xs text-muted-foreground">AI Models Online</span>
              </div>
              <div className="flex items-center px-2">
                <Badge
                  variant="outline"
                  className="h-4 text-[10px] font-medium bg-primary/5 text-primary border-primary/20"
                >
                  v3.2.1
                </Badge>
              </div>
              <div className="hidden md:flex items-center px-2 text-xs text-muted-foreground">
                <span>Last Model Update: May 11, 2025</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
