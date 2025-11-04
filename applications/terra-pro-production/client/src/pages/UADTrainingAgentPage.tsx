import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
  Brain,
  FileText,
  Play,
  Pause,
 } from '@mui/icons-material';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  completion: number;
  status: "Available" | "In Progress" | "Completed" | "Locked";
  prerequisites: string[];
}

interface AppraiserProfile {
  id: string;
  name: string;
  license: string;
  experience: string;
  specialization: string;
  currentModule: string;
  progressPercentage: number;
  completedModules: number;
  totalModules: number;
  status: "Active" | "Onboarding" | "Certified" | "Refresher";
}

interface TrainingMetrics {
  totalAppraisers: number;
  activeTraining: number;
  certifiedUAD36: number;
  averageCompletion: number;
  successRate: number;
  moduleCompletions: number;
}

export default function UADTrainingAgentPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [trainingInProgress, setTrainingInProgress] = useState(false);

  const trainingModules: TrainingModule[] = [
    {
      id: "uad-basics",
      title: "UAD 3.6 Fundamentals",
      description: "Core concepts and field requirements for UAD 3.6 compliance",
      duration: "45 minutes",
      difficulty: "Beginner",
      completion: 100,
      status: "Available",
      prerequisites: [],
    },
    {
      id: "field-validation",
      title: "Field Validation & AI Assistance",
      description: "Using Terrafusion AI for intelligent field validation and error prevention",
      duration: "60 minutes",
      difficulty: "Intermediate",
      completion: 87,
      status: "Available",
      prerequisites: ["uad-basics"],
    },
    {
      id: "override-management",
      title: "Override Justification & Documentation",
      description: "Best practices for documenting comp overrides with AI narrative assistance",
      duration: "40 minutes",
      difficulty: "Intermediate",
      completion: 73,
      status: "Available",
      prerequisites: ["uad-basics", "field-validation"],
    },
    {
      id: "zoning-integration",
      title: "Zoning AI Integration",
      description: "Leveraging ThinkLike zoning intelligence for enhanced valuations",
      duration: "50 minutes",
      difficulty: "Advanced",
      completion: 54,
      status: "Available",
      prerequisites: ["field-validation"],
    },
    {
      id: "blockchain-verification",
      title: "Blockchain Verification & NFT Comps",
      description: "Understanding cryptographic verification and NFT-based comparable properties",
      duration: "35 minutes",
      difficulty: "Advanced",
      completion: 31,
      status: "Available",
      prerequisites: ["override-management"],
    },
    {
      id: "regulator-compliance",
      title: "Regulator Export & Audit Trails",
      description: "Generating compliant exports and maintaining audit-ready documentation",
      duration: "30 minutes",
      difficulty: "Advanced",
      completion: 18,
      status: "Available",
      prerequisites: ["blockchain-verification"],
    },
  ];

  const appraiserProfiles: AppraiserProfile[] = [
    {
      id: "APP-001",
      name: "Sarah Chen",
      license: "WA-CG-4829",
      experience: "8 years",
      specialization: "Residential",
      currentModule: "zoning-integration",
      progressPercentage: 73,
      completedModules: 3,
      totalModules: 6,
      status: "Active",
    },
    {
      id: "APP-002",
      name: "Michael Rodriguez",
      license: "WA-CR-7231",
      experience: "12 years",
      specialization: "Commercial",
      currentModule: "blockchain-verification",
      progressPercentage: 89,
      completedModules: 4,
      totalModules: 6,
      status: "Active",
    },
    {
      id: "APP-003",
      name: "Jennifer Wilson",
      license: "WA-CG-1847",
      experience: "15 years",
      specialization: "Rural/Agricultural",
      currentModule: "regulator-compliance",
      progressPercentage: 95,
      completedModules: 5,
      totalModules: 6,
      status: "Certified",
    },
    {
      id: "APP-004",
      name: "David Park",
      license: "WA-TR-5294",
      experience: "3 years",
      specialization: "Residential",
      currentModule: "field-validation",
      progressPercentage: 42,
      completedModules: 1,
      totalModules: 6,
      status: "Onboarding",
    },
  ];

  const trainingMetrics: TrainingMetrics = {
    totalAppraisers: 1127,
    activeTraining: 347,
    certifiedUAD36: 284,
    averageCompletion: 67.8,
    successRate: 94.2,
    moduleCompletions: 2847,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
      case "Active":
      case "Certified":
        return "bg-green-100 text-green-800";
      case "In Progress":
      case "Onboarding":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      case "Locked":
      case "Refresher":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const startTraining = () => {
    setTrainingInProgress(true);
    setTimeout(() => setTrainingInProgress(false), 8000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <GraduationCap className="w-8 h-8 text-blue-600" />
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">UAD 3.6 Training Agent</h1>
          <p
</> className="text-gray-600">
            AI-powered training system for UAD 3.6 compliance and Terrafusion platform mastery
          </p>
        </div>
      </div>

      {/* Training Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Appraisers</CardTitle>
            <Users
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-blue-600">
              {trainingMetrics.totalAppraisers}
            </div>
            <p
</> className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Training</CardTitle>
            <BookOpen
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-green-600">
              {trainingMetrics.activeTraining}
            </div>
            <p
</> className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">UAD 3.6 Certified</CardTitle>
            <CheckCircle
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-purple-600">
              {trainingMetrics.certifiedUAD36}
            </div>
            <p
</> className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Target
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-orange-600">
              {trainingMetrics.averageCompletion}%
            </div>
            <p
</> className="text-xs text-muted-foreground">Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Brain
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-indigo-600">{trainingMetrics.successRate}%</div>
            <p
</> className="text-xs text-muted-foreground">Pass rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <FileText
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-red-600">
              {trainingMetrics.moduleCompletions}
            </div>
            <p
</> className="text-xs text-muted-foreground">Modules</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center space-x-4">
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-64"><>

            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent
</>><>

            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem
</> value="puget">Puget Sound Metro</SelectItem><>

            <SelectItem value="eastern">Eastern Washington</SelectItem>
            <SelectItem
</> value="southwest">Southwest Washington</SelectItem>
            <SelectItem value="peninsula">Olympic Peninsula</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={startTraining} disabled={trainingInProgress}>
          {trainingInProgress ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Training Active...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Mass Training
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger
</> value="appraisers">Appraiser Progress</TabsTrigger>
          <TabsTrigger value="analytics">Training Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>UAD 3.6 Training Curriculum</CardTitle>
              <CardDescription
</>>
                Comprehensive training modules for UAD 3.6 compliance and Terrafusion integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainingModules.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div><>

                          <div className="font-medium text-lg">{module.title}</div>
                          <div
</> className="text-sm text-gray-600">{module.description}</div>
                        </div>
                        <Badge className={getStatusColor(module.status)}>{module.status}</Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{module.duration}</span>
                        </div>
                        <Badge className={getDifficultyColor(module.difficulty)} variant="outline">
                          {module.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><>

                          <span>Completion Rate</span>
                          <span
</>>{module.completion}%</span>
                        </div>
                        <Progress value={module.completion} className="h-2" />
                      </div>

                      {module.prerequisites.length > 0 && (
                        <div><>

                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Prerequisites:
                          </div>
                          <div
</> className="flex flex-wrap gap-1">
                            {module.prerequisites.map((prereq /* , index */) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {prereq}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        variant={module.status === "Available" ? "default" : "outline"}
                      >
                        {module.status === "Available"
                          ? "Start Module"
                          : module.status === "In Progress"
                            ? "Continue"
                            : module.status === "Completed"
                              ? "Review"
                              : "Locked"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisers" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Appraiser Training Progress</CardTitle>
              <CardDescription
</>>
                Individual progress tracking for UAD 3.6 certification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appraiserProfiles.map((appraiser) => (
                  <div key={appraiser.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div><>

                            <div className="font-medium text-lg">{appraiser.name}</div>
                            <div
</> className="text-sm text-gray-600">
                              {appraiser.license} • {appraiser.experience} •{" "}
                              {appraiser.specialization}
                            </div>
                          </div>
                          <Badge className={getStatusColor(appraiser.status)}>
                            {appraiser.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div><>

                            <div className="text-sm text-gray-600">Current Module</div>
                            <div
</> className="font-medium">{appraiser.currentModule}</div>
                          </div>
                          <div><>

                            <div className="text-sm text-gray-600">Completed</div>
                            <div
</> className="font-medium">
                              {appraiser.completedModules}/{appraiser.totalModules} modules
                            </div>
                          </div>
                          <div><>

                            <div className="text-sm text-gray-600">Overall Progress</div>
                            <div
</> className="font-medium">{appraiser.progressPercentage}%</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm"><>

                            <span>Training Progress</span>
                            <span
</>>{appraiser.progressPercentage}%</span>
                          </div>
                          <Progress value={appraiser.progressPercentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Training Performance</CardTitle>
                <CardDescription
</>>System-wide training effectiveness metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Module Completion Rate</span>
                    <span
</>>94.2%</span>
                  </div><>

                  <Progress value={94.2} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Knowledge Retention</span>
                    <span
</>>89.7%</span>
                  </div><>

                  <Progress value={89.7} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Practical Application</span>
                    <span
</>>91.4%</span>
                  </div><>

                  <Progress value={91.4} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>AI Tool Adoption</span>
                    <span
</>>87.3%</span>
                  </div>
                  <Progress value={87.3} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Regional Training Status</CardTitle>
                <CardDescription
</>>Training completion by Washington regions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Puget Sound Metro</span>
                    <div
</> className="flex items-center space-x-2">
                      <Progress value={96.1} className="w-24 h-2" />
                      <span className="text-sm font-medium">96.1%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Eastern Washington</span>
                    <div
</> className="flex items-center space-x-2">
                      <Progress value={84.7} className="w-24 h-2" />
                      <span className="text-sm font-medium">84.7%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Southwest Washington</span>
                    <div
</> className="flex items-center space-x-2">
                      <Progress value={89.3} className="w-24 h-2" />
                      <span className="text-sm font-medium">89.3%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Olympic Peninsula</span>
                    <div
</> className="flex items-center space-x-2">
                      <Progress value={78.2} className="w-24 h-2" />
                      <span className="text-sm font-medium">78.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {trainingInProgress && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader><>

                <CardTitle className="text-blue-900">Mass Training Session Active</CardTitle>
                <CardDescription
</> className="text-blue-700">
                  AI training agent deploying UAD 3.6 modules across all registered appraisers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div className="text-blue-800">
                    Personalizing training content based on appraiser experience and
                    specialization...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
