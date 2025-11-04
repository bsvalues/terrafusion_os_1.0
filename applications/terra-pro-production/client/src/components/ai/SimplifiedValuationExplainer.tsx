import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoIcon,
  CheckCircle,
  AlertCircle,
  Home,
  Ruler,
  MapPin,
  Briefcase,
  Building,
  BarChart,
  Warning,
  ChevronDown,
  ChevronUp,
  HelpCircle,
 } from '@mui/icons-material';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * SimplifiedValuationExplainer Component
 *
 * A component that explains AI valuation concepts in terms that are accessible
 * to appraisers without technical backgrounds, focusing on practical implications
 * rather than technical details.
 */
interface ValuationExplainerProps {
  confidence?: number; // 0-100
  adjustmentFactors?: string[];
  showDetailedExplanation?: boolean;
}

export function SimplifiedValuationExplainer({
  confidence = 85,
  adjustmentFactors = ["Location", "Size", "Condition", "Amenities", "Market Trends"],
  showDetailedExplanation = true,
}: ValuationExplainerProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine confidence level description and styling
  const getConfidenceLevel = () => {
    if (confidence >= 85) {
      return {
        level: "High",
        badge: "success",
        icon: <CheckCircle className="h-4 w-4 mr-1" />,
        description:
          "The model has strong confidence in this valuation based on quality comparable properties and clear market data.",
      };
    } else if (confidence >= 70) {
      return {
        level: "Moderate",
        badge: "default",
        icon: <InfoIcon className="h-4 w-4 mr-1" />,
        description:
          "The model has reasonable confidence, but some factors may benefit from your professional review.",
      };
    } else {
      return {
        level: "Low",
        badge: "destructive",
        icon: <Warning className="h-4 w-4 mr-1" />,
        description:
          "The model has low confidence and significant professional judgment is recommended.",
      };
    }
  };

  const confidenceInfo = getConfidenceLevel();

  // Factor icons mapping
  const factorIcons: Record<string, React.ReactNode> = {
    Location: <MapPin className="h-4 w-4" />,
    Size: <Ruler className="h-4 w-4" />,
    Condition: <Home className="h-4 w-4" />,
    Amenities: <Building className="h-4 w-4" />,
    "Market Trends": <BarChart className="h-4 w-4" />,
    Employment: <Briefcase className="h-4 w-4" />,
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center"><>

          <CardTitle className="text-xl">Understanding Your AI Valuation</CardTitle>
          <Badge
</> variant={confidenceInfo.badge as any} className="flex items-center">
            {confidenceInfo.icon}
            <span>{confidenceInfo.level} Confidence</span>
          </Badge>
        </div>
        <CardDescription>
          How to interpret and use the AI-assisted valuation in your appraisal work
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 border rounded-md bg-muted/20">
          <h3 className="font-medium mb-2 flex items-center"><>

            <InfoIcon className="h-4 w-4 mr-2 text-blue-500" />
            What This Means For Your Appraisal
          </h3>
          <p
</> className="text-sm text-muted-foreground mb-2">{confidenceInfo.description}</p>

          <div className="mt-4"><>

            <h4 className="text-sm font-medium mb-2">Key Adjustment Factors:</h4>
            <div
</> className="flex flex-wrap gap-2">
              {adjustmentFactors.map((factor) => (
                <TooltipProvider key={factor}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {factorIcons[factor] || <HelpCircle className="h-4 w-4" />}
                        {factor}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        The AI considered {factor.toLowerCase()} when calculating adjustments
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>

        {showDetailedExplanation && (
          <Accordion type="single" collapsible>
            <AccordionItem value="understanding-confidence"><>

              <AccordionTrigger>How to use confidence scores in your work</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">High confidence (80%+):</span> The AI has found
                    strong comparable properties and clear patterns in the data. You can generally
                    rely on these valuations with minimal adjustments, but always apply your
                    professional judgment.
                  </p>
                  <p>
                    <span className="font-medium">Moderate confidence (70-80%):</span> Some factors
                    may be less certain. Review the key adjustment factors and consider whether
                    additional comparables or manual adjustments might be needed.
                  </p>
                  <p>
                    <span className="font-medium">Low confidence (below 70%):</span> Treat the AI
                    valuation as a starting point only. The property may have unique
                    characteristics, limited comparables, or be in a changing market that requires
                    significant professional analysis.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-it-works"><>

              <AccordionTrigger>How the AI valuation works</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-3 text-sm"><>

                  <p>
                    The Terrafusion AI analyzes thousands of recent property transactions to
                    identify patterns and relationships between property characteristics and market
                    values.
                  </p>
                  <p
</>>For your subject property, the system:</p>
                  <ol className="list-decimal pl-5 space-y-1"><>

                    <li>
                      Finds the most similar comparable properties based on location, size, age, and
                      features
                    </li>
                            <li
</>>
                      Calculates appropriate adjustments for differences between your subject
                      property and the comparables
                    </li><>

                    <li>Weighs each comparable based on its similarity to your subject property</li>
                            <li
</>>Analyzes market trends to account for time-based value changes</li>
                    <li>
                      Combines these factors to generate a final valuation estimate with a
                      confidence score
                    </li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="improving-results"><>

              <AccordionTrigger>How to improve AI valuation results</AccordionTrigger>
              <AccordionContent
</>>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Provide complete property details:</span> The more
                    accurate information you provide, the better the AI can match appropriate
                    comparables.
                  </p>
                  <p>
                    <span className="font-medium">Upload quality photos:</span> Property condition
                    is factored into valuations. Clear photos help the AI assess condition
                    accurately.
                  </p>
                  <p>
                    <span className="font-medium">Review and adjust comparables:</span> If you
                    believe some comparables should be weighted differently or excluded, use the
                    manual adjustment tools.
                  </p>
                  <p>
                    <span className="font-medium">Provide feedback:</span> When you adjust AI
                    valuations, the system learns from your expertise to improve future results.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-xs"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show More
            </>
          )}
        </Button>

        {expanded && (
          <div className="text-xs text-muted-foreground">
            Remember: AI valuations are tools to assist your professional judgment, not replace it.
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default SimplifiedValuationExplainer;
