import React from "react";
import { PageLayout } from "./page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { ChevronRight,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Clock,
  Clipboard,
  ListChecks,
  FileSpreadsheet,
  FileText,
  FileImage,
  Building,
  HardDrive,
  Home as HomeIcon,
  ExternalLink,
  CalendarCheck,
  Brain,
 } from '@mui/icons-material';

// Interface for all the props needed by AppraiserPageLayout
export interface AppraiserPageLayoutProps {
  /**
   * Page title (for browser title bar and header)
   */
  title: string;

  /**
   * Page subtitle (optional)
   */
  subtitle?: string;

  /**
   * Page description (optional) - appears below the title
   */
  description?: string;

  /**
   * Main content
   */
  children: React.ReactNode;

  /**
   * Back button URL (optional - if provided, shows a back button)
   */
  backUrl?: string;

  /**
   * Actions to display in the top-right
   */
  actions?: React.ReactNode;

  /**
   * Menu items in the right dropdown menu
   */
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    isDanger?: boolean;
  }>;

  /**
   * Whether to show the sync status
   */
  showSyncStatus?: boolean;

  /**
   * Whether the page is loading
   */
  isLoading?: boolean;

  /**
   * Whether to display a workflow context breadcrumb
   */
  showWorkflowContext?: boolean;

  /**
   * Current step in workflow (if showWorkflowContext is true)
   */
  workflowStep?: {
    previous: string;
    current: string;
    next: string;
  };

  /**
   * Appraiser tips to display in the right sidebar
   */
  appraisalTips?: Array<{
    title: string;
    content: string;
    type?: "info" | "warning" | "ai" | "tip";
  }>;

  /**
   * Quick actions displayed in the right sidebar
   */
  quickActions?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "secondary" | "outline";
  }>;

  /**
   * Whether to show the sidebar with tips and quick actions
   */
  showSidebar?: boolean;

  /**
   * Whether page is in AI-assisted mode
   */
  aiMode?: boolean;
}

/**
 * AppraiserPageLayout - A specialized layout for appraiser workflows
 * This builds on PageLayout with additional appraiser-specific features
 */
export function AppraiserPageLayout({
  title,
  subtitle,
  description,
  children,
  backUrl,
  actions,
  menuItems,
  showSyncStatus = false,
  isLoading = false,
  showWorkflowContext = false,
  workflowStep,
  appraisalTips = [],
  quickActions = [],
  showSidebar = true,
  aiMode = false,
}: AppraiserPageLayoutProps) {
  const [_, setLocation] = useLocation();

  return (
    <PageLayout
      title={title}
      subtitle={subtitle}
      description={description}
      backUrl={backUrl}
      showHomeButton={true}
      actions={actions}
      isLoading={isLoading}
      showSyncStatus={showSyncStatus}
      menuItems={menuItems}
      contentClassName="p-0 flex"
    >
      <div className="flex flex-col lg:flex-row w-full h-full">
        {/* Main content area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Optional Workflow Context Breadcrumb */}
          {showWorkflowContext && workflowStep && (
            <div className="mb-6">
              <div className="p-2 bg-muted rounded-md">
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="flex items-center"><>

                    <span className="opacity-70">{workflowStep.previous}</span>
                    <ChevronRight
</> className="h-4 w-4 mx-2 opacity-50" />
                  </div><>

                  <div className="font-medium text-foreground">{workflowStep.current}</div>
                  <div
</> className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2 opacity-50" />
                    <span className="opacity-70">{workflowStep.next}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Mode Badge - when AI assistance is active */}
          {aiMode && (
            <div className="mb-4">
              <Alert className="bg-primary/10 border-primary/30">
                <Brain className="h-4 w-4 text-primary" /><>

                <AlertTitle className="text-primary font-medium">AI Assistant Active</AlertTitle>
                <AlertDescription
</>>
                  Terrafusion AI is actively assisting with this workflow
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Main content container */}
          <div className="w-full">{children}</div>
        </div>

        {/* Contextual sidebar with tips and quick actions */}
        {showSidebar && (
          <div className="w-full lg:w-80 xl:w-96 p-4 border-t lg:border-t-0 lg:border-l border-border bg-card/50">
            <ScrollArea className="h-full">
              <div className="space-y-6 pb-8">
                {/* Quick Actions */}
                {quickActions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Quick Actions</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, i) => (
                        <Button
                          key={i}
                          variant={action.variant || "outline"}
                          size="sm"
                          className="justify-start h-auto py-3 font-normal"
                          onClick={action.onClick}
                        >
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appraiser Tips */}
                {appraisalTips.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      <span>Appraisal Tips</span>
                    </h3>

                    {appraisalTips.map((tip, i) => (
                      <Card
                        key={i}
                        className={
                          tip.type === "ai"
                            ? "border-primary/30 bg-primary/5"
                            : tip.type === "warning"
                              ? "border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-800"
                              : ""
                        }
                      >
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-sm flex items-center gap-1.5">
                            {tip.type === "ai" && <Brain className="h-4 w-4 text-primary" />}
                            {tip.type === "warning" && (
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                            )}
                            {tip.type === "info" && <Clipboard className="h-4 w-4 text-blue-500" />}
                            {tip.type === "tip" && <Lightbulb className="h-4 w-4 text-amber-500" />}
                            {tip.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                          <p className="text-xs">{tip.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
