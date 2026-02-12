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

  // Core Workflow Navigation - Primary functions in a logical workflow order
  const coreWorkflowItems: NavItem[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      description: "Overview of your active appraisals and key metrics",
    },
    {
      href: "/email-order",
      label: "New Order",
      icon: <Inbox className="h-4 w-4" />,
      description: "Import a new order from email or document",
    },
    {
      href: "/property-data",
      label: "Property Data",
      icon: <Building2 className="h-4 w-4" />,
      description: "View and manage property information",
    },
    {
      href: "/uad-form",
      label: "UAD Form",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: { text: "Active", variant: "secondary" },
      description: "Complete the Uniform Appraisal Dataset form",
    },
    {
      href: "/comps",
      label: "Comparables",
      icon: <FileLineChart className="h-4 w-4" />,
      description: "Manage comparable properties for your appraisal",
    },
    {
      href: "/comps-search",
      label: "Comps Search",
      icon: <Search className="h-4 w-4" />,
      badge: { text: "New", variant: "secondary" },
      description: "Search and analyze comparable properties",
    },
  ];

  // Report Tools - Tools for report generation and compliance
  const reportToolsItems: NavItem[] = [
    {
      href: "/photos",
      label: "Photo Management",
      icon: <Images className="h-4 w-4" />,
      description: "Organize and enhance property photos",
    },
    {
      href: "/sketches",
      label: "Property Sketches",
      icon: <PencilRuler className="h-4 w-4" />,
      description: "Create and edit property floor plans",
    },
    {
      href: "/reports",
      label: "Report Generator",
      icon: <FileCheck className="h-4 w-4" />,
      description: "Generate and export appraisal reports",
    },
    {
      href: "/compliance",
      label: "Compliance Check",
      icon: <ShieldCheck className="h-4 w-4" />,
      description: "Verify appraisal compliance with standards",
    },
  ];

  // AI Assistant Tools - AI-powered features
  const aiToolsItems: NavItem[] = [
    {
      href: "/ai-valuation",
      label: "AI Valuation",
      icon: <Brain className="h-4 w-4" />,
      description: "Get AI-powered property valuations",
    },
    {
      href: "/market-analysis",
      label: "Market Analysis",
      icon: <Lightbulb className="h-4 w-4" />,
      badge: { text: "New", variant: "secondary" },
      description: "AI-generated market trend analysis",
    },
    {
      href: "/urar",
      label: "URAR + AI Assistant",
      icon: <FileCheck className="h-4 w-4" />,
      badge: { text: "New", variant: "secondary" },
      description: "Legal URAR form with AI condition insights",
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

  // Navigation sections for sidebar
  const navSections: NavSection[] = [
    { title: "Core Workflow", items: coreWorkflowItems },
    { title: "Report Tools", items: reportToolsItems },
    { title: "AI Assistant", items: aiToolsItems },
    { title: "TerraField Mobile", items: terraFieldItems },
    { title: "Utilities", items: utilityItems },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
        <div className="container flex h-16 items-center">
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
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    ><>

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3"
                      />
                    </svg>
                    <span
</>>Terrafusion</span>
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
                          <span className="bg-background text-muted-foreground font-medium">
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

            <a href="/" className="flex items-center gap-2 font-semibold">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              ><>

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3"
                />
              </svg>
              <span
</> className="hidden md:inline-block">Terrafusion Platform</span>
            </a>

            {/* Quick action buttons */}
            <div className="ml-4 hidden md:flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => (window.location.href = "/email-order")}
                    >
                      <MailPlus className="h-3.5 w-3.5 mr-1" />
                      New Order
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new appraisal order</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => (window.location.href = "/reports")}
                    >
                      <FileCheck className="h-3.5 w-3.5 mr-1" />
                      Reports
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View and manage reports</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            {/* SyncStatus with default values */}
            <SyncStatus state="synced" lastSynced={new Date()} />

            {/* Help button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Help</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get help and resources</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Mobile shortcuts indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden md:flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    <span>TerraField Connected</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your mobile app is connected and syncing</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end"><>

                <DropdownMenuLabel>John Appraiser</DropdownMenuLabel>
                <DropdownMenuSeparator
</> />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
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
        {/* Sidebar navigation */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-background shadow-inner">
          <nav className="flex-1 overflow-auto py-6 px-4">
            {navSections.map((section /* , index */) => (
              <NavSection key={index} section={section} />
            ))}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 bg-muted/30">
        <div className="container flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><>

          <p className="text-xs text-muted-foreground">
            &copy; 2025 Terrafusion Platform - Real Estate Appraisal Software
          </p>
          <div
</> className="flex items-center space-x-4"><>

            <p className="text-xs text-muted-foreground">Version 3.2.1</p>
            <div
</> className="flex items-center"><>

              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span
</> className="text-xs text-muted-foreground">System Online</span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
