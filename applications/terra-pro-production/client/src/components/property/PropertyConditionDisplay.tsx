import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home,
  Droplet,
  ThermometerSun,
  DoorOpen,
  Construction,
  Hammer,
  Brain,
  Lightbulb,
  Warehouse,
  Image,
  ImagePlus,
  AlertCircle,
  HelpCircle,
 } from '@mui/icons-material';

/**
 * PropertyConditionDisplay Component
 *
 * A component that displays the AI-assessed property condition in a way
 * that's easy for appraisers to understand and incorporate into their reports.
 */

interface PropertyComponentCondition {
  name: string;
  score: number; // 1-5
  confidence?: number; // 0-100
  issues?: string[];
  icon?: React.ReactNode;
}

interface PropertyConditionDisplayProps {
  overallScore: number; // 1-5
  components?: PropertyComponentCondition[];
  confidence?: number; // 0-100
  inspectionDate?: string;
  imagePath?: string;
}

export function PropertyConditionDisplay({
  overallScore = 3.8,
  confidence = 85,
  inspectionDate = "2025-04-15",
  imagePath,
  components = [
    {
      name: "Roof",
      score: 4.2,
      confidence: 90,
      issues: ["Minor wear on shingles"],
      icon: <Home />,
    },
    {
      name: "Plumbing",
      score: 3.5,
      confidence: 82,
      issues: ["Older fixtures", "Some mineral deposits"],
      icon: <Droplet />,
    },
    {
      name: "HVAC",
      score: 4.0,
      confidence: 88,
      issues: ["5-7 years old", "Regular maintenance evident"],
      icon: <ThermometerSun />,
    },
    {
      name: "Interior",
      score: 3.9,
      confidence: 92,
      issues: ["Minor wear in high-traffic areas", "Updated kitchen"],
      icon: <DoorOpen />,
    },
    {
      name: "Foundation",
      score: 4.3,
      confidence: 78,
      issues: ["No visible cracks", "Limited visibility in some areas"],
      icon: <Warehouse />,
    },
    {
      name: "Electrical",
      score: 3.7,
      confidence: 85,
      issues: ["Updated panel", "Some older wiring remains"],
      icon: <Lightbulb />,
    },
  ],
}: PropertyConditionDisplayProps) {
  // Get condition description based on score
  const getConditionDescription = (score: number) => {
    if (score >= 4.5) return "Excellent";
    if (score >= 4.0) return "Very Good";
    if (score >= 3.5) return "Good";
    if (score >= 3.0) return "Average";
    if (score >= 2.0) return "Fair";
    if (score >= 1.0) return "Poor";
    return "Unknown";
  };

  // Get color based on score
  const getConditionColor = (score: number) => {
    if (score >= 4.5) return "bg-green-500";
    if (score >= 4.0) return "bg-green-400";
    if (score >= 3.5) return "bg-green-300";
    if (score >= 3.0) return "bg-yellow-400";
    if (score >= 2.0) return "bg-orange-400";
    if (score >= 1.0) return "bg-red-500";
    return "bg-gray-400";
  };

  // Get badge variant based on confidence
  const getConfidenceBadge = (confidenceScore: number) => {
    if (confidenceScore >= 85) return "default";
    if (confidenceScore >= 70) return "secondary";
    return "outline";
  };

  // Get report-ready language for the condition
  const getReportLanguage = (score: number) => {
    if (score >= 4.5) {
      return "The subject property appears to be in excellent condition with high-quality features and finishes. No significant deferred maintenance was observed.";
    } else if (score >= 4.0) {
      return "The subject property appears to be in very good condition overall. It shows pride of ownership with only minor wear consistent with its age.";
    } else if (score >= 3.5) {
      return "The subject property appears to be in good condition overall. Some minor maintenance items were noted, but these do not significantly impact the value.";
    } else if (score >= 3.0) {
      return "The subject property appears to be in average condition for its age. Typical wear and tear was observed with some maintenance needs identified.";
    } else if (score >= 2.0) {
      return "The subject property appears to be in fair condition, showing signs of deferred maintenance. Several items may require attention in the near term.";
    } else {
      return "The subject property appears to be in poor condition with significant deferred maintenance. Major repairs are needed which likely impact marketability and value.";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>Property Condition Assessment</CardTitle>
            <CardDescription
</>>
              AI-assisted analysis based on property inspection photos
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {inspectionDate && (
              <Badge variant="outline" className="text-xs">
                Assessed: {new Date(inspectionDate).toLocaleDateString()}
              </Badge>
            )}
            <Badge variant={getConfidenceBadge(confidence)} className="text-xs">
              {confidence}% Confidence
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-2/3">
            <div className="flex items-center justify-between mb-2"><>

              <h3 className="font-medium">
                Overall Condition: {getConditionDescription(overallScore)}
              </h3>
              <span
</> className="text-lg font-bold">{overallScore.toFixed(1)}/5.0</span>
            </div>

            <div className="relative h-8 w-full rounded-full overflow-hidden bg-muted mb-4"><>

              <div
                className={`absolute top-0 left-0 h-full ${getConditionColor(overallScore)} transition-all`}
                style={{ width: `${(overallScore / 5) * 100}%` }}
              ></div>
              <div
</> className="absolute top-0 left-0 w-full h-full flex items-center justify-between px-3"><>

                <span className="text-xs font-medium text-white drop-shadow-md">Poor</span>
                <span
</> className="text-xs font-medium text-white drop-shadow-md">Excellent</span>
              </div>
            </div>

            <div className="p-3 rounded border bg-muted/20"><>

              <p className="text-sm text-muted-foreground italic">
                "{getReportLanguage(overallScore)}"
              </p>
              <div
</> className="mt-2 flex items-center">
                <Brain className="h-3 w-3 text-primary mr-1" />
                <span className="text-xs text-primary">AI-generated report language</span>
              </div>
            </div>
          </div>

          {imagePath && (
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative overflow-hidden rounded-md border w-full max-w-[200px] aspect-square">
                <img src={imagePath} alt="Property Image" className="object-cover w-full h-full" />
                <div className="absolute bottom-0 right-0 p-1 bg-background/80 rounded-tl-md">
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    AI Analyzed
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="components">
          <TabsList className="grid w-full grid-cols-2"><>

            <TabsTrigger value="components">Component Breakdown</TabsTrigger>
            <TabsTrigger
</> value="details">Assessment Details</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {components.map((component) => (
                <Card key={component.name} className="bg-background border">
                  <CardHeader className="p-3 pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-1.5 bg-primary/10 rounded mr-2">
                          {component.icon || <Construction className="h-4 w-4 text-primary" />}
                        </div>
                        <h4 className="font-medium text-sm">{component.name}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {component.score.toFixed(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{getConditionDescription(component.score)}</span>
                        {component.confidence && (
                          <span className="text-muted-foreground">
                            {component.confidence}% confidence
                          </span>
                        )}
                      </div>
                      <Progress value={(component.score / 5) * 100} className="h-1.5" />
                    </div>
                    {component.issues && component.issues.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {component.issues.map((issue /* , index */) => (
                          <li key={index} className="text-xs flex items-start gap-1"><>

                            <div className="min-w-[12px] mt-0.5">•</div>
                            <span
</>>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="font-medium flex items-center"><>

                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                Assessment Methodology
              </h3>
              <p
</> className="text-sm text-muted-foreground">
                This assessment is generated by our AI system analyzing inspection photos and
                comparing them to thousands of reference images. The system identifies visible
                conditions, material quality, wear patterns, and potential issues.
              </p>
              <div className="pt-2 space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-sm"><>

                    <p className="font-medium">Confidence Score</p>
                    <p
</> className="text-muted-foreground">
                      Indicates the reliability of the assessment based on image quality, coverage,
                      and clarity. Higher confidence means more reliable assessment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5" />
                  <div className="text-sm"><>

                    <p className="font-medium">Condition Scale</p>
                    <p
</> className="text-muted-foreground">
                      5.0 - Excellent (new/like new) <br />
                      4.0 - Very Good (minimal wear) <br />
                      3.0 - Average (expected wear for age) <br />
                      2.0 - Fair (noticeable deterioration) <br />
                      1.0 - Poor (significant issues)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="border-t pt-3 flex justify-between">
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1"><>

          <ImagePlus className="h-3.5 w-3.5" />
          Add Photos
        </Button>
        <Button
</> variant="default" size="sm" className="text-xs">
          Include in Report
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PropertyConditionDisplay;
