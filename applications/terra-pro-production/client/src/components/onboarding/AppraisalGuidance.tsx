import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronRight,
  HelpCircle,
  Home,
  BarChart3,
  Camera,
  FileText,
  BrainCircuit,
  ArrowRight,
 } from '@mui/icons-material';
import { Badge } from "@/components/ui/badge";

/**
 * AppraisalGuidance Component
 *
 * A guided workflow component that helps appraisers understand how to use the
 * Terrafusion platform in their daily workflow, with practical recommendations
 * and guidance for common appraisal tasks.
 */
type UserExperience = "beginner" | "intermediate" | "expert";

interface GuidedTask {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  duration: string;
}

type GuidedTasks = {
  [key in UserExperience]: GuidedTask[];
};

export function AppraisalGuidance() {
  const [location, setLocation] = useLocation();
  const [userExperience, setUserExperience] = useState<UserExperience>("beginner");

  // Sample tasks for guidance based on user experience level
  const guidedTasks: GuidedTasks = {
    beginner: [
      {
        title: "Create your first property report",
        description: "Learn the basic steps to create a complete property report",
        path: "/property-entry",
        icon: <FileText className="h-5 w-5" />,
        duration: "10-15 minutes",
      },
      {
        title: "Use AI to evaluate condition from photos",
        description: "Upload property photos and get objective condition scores",
        path: "/photos",
        icon: <Camera className="h-5 w-5" />,
        duration: "5-10 minutes",
      },
      {
        title: "Generate a basic valuation",
        description: "Enter property details and receive an AI-assisted valuation",
        path: "/ai-valuation",
        icon: <BarChart3 className="h-5 w-5" />,
        duration: "8-12 minutes",
      },
    ],
    intermediate: [
      {
        title: "Review AI-suggested adjustments",
        description: "Understand and modify the adjustments suggested by the AI",
        path: "/ai-valuation",
        icon: <BrainCircuit className="h-5 w-5" />,
        duration: "15-20 minutes",
      },
      {
        title: "Analyze market trends for your subject area",
        description: "Use the market analytics tools to support your valuation",
        path: "/market-analysis",
        icon: <BarChart3 className="h-5 w-5" />,
        duration: "10-15 minutes",
      },
      {
        title: "Customize your report templates",
        description: "Adapt report formats to your specific needs",
        path: "/report-generation",
        icon: <FileText className="h-5 w-5" />,
        duration: "15-20 minutes",
      },
    ],
    expert: [
      {
        title: "Review confidence scores in your valuations",
        description: "Understand what factors affect confidence levels and how to improve them",
        path: "/ai-valuation",
        icon: <BrainCircuit className="h-5 w-5" />,
        duration: "12-15 minutes",
      },
      {
        title: "Explore model performance trends",
        description: "View simplified model analytics to understand reliability",
        path: "/model-performance",
        icon: <BarChart3 className="h-5 w-5" />,
        duration: "8-10 minutes",
      },
      {
        title: "Create batch adjustments for multiple properties",
        description: "Apply consistent valuation adjustments across your portfolio",
        path: "/batch-adjustment",
        icon: <FileText className="h-5 w-5" />,
        duration: "15-25 minutes",
      },
    ],
  };

  return (
    <Card className="w-full border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-2xl">Appraiser Guidance</CardTitle>
            <CardDescription
</>>
              Step-by-step guidance to help you utilize Terrafusion in your appraisal workflow
            </CardDescription>
          </div>
          <div>
            <div className="space-x-2"><>

              <Button
                variant={userExperience === "beginner" ? "default" : "outline"}
                size="sm"
                onClick={() => setUserExperience("beginner")}
              >
                New User
              </Button>
              <Button
</>
                variant={userExperience === "intermediate" ? "default" : "outline"}
                size="sm"
                onClick={() => setUserExperience("intermediate")}
              >
                Intermediate
              </Button>
              <Button
                variant={userExperience === "expert" ? "default" : "outline"}
                size="sm"
                onClick={() => setUserExperience("expert")}
              >
                Expert
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {guidedTasks[userExperience].map((task: GuidedTask /* , index */: number) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              onClick={() => setLocation(task.path)}
            >
              <div className="flex items-center"><>

                <div className="bg-primary/10 p-2 rounded-full mr-4">{task.icon}</div>
                <div
</>><>

                  <h3 className="font-medium">{task.title}</h3>
                  <p
</> className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                  <div className="mt-1">
                    <Badge variant="outline">Estimated time: {task.duration}</Badge>
                  </div>
                </div>
              </div>
              <Button size="sm">
                Start <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button variant="outline" onClick={() => setLocation("/")}><>

          <Home className="mr-2 h-4 w-4" /> Dashboard
        </Button>
        <TooltipProvider
</>>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="link" size="sm" onClick={() => setLocation("/help-support")}>
                <HelpCircle className="mr-2 h-4 w-4" /> Need more help?
              </Button>
            </TooltipTrigger>
            <TooltipContent>Visit our help center for tutorials and guides</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}

export default AppraisalGuidance;
