import React, { useState } from "react";
import { Sparkles, Send, X, ChevronDown, ChevronUp  } from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/ui/loading-state";
import { enhancedToast } from "@/components/ui/enhanced-toast";

// Different AI assistant types
export enum AssistantType {
  GENERAL = "general",
  NARRATIVE = "narrative",
  ANALYSIS = "analysis",
  COMPLIANCE = "compliance",
}

const assistantConfig = {
  [AssistantType.GENERAL]: {
    title: "General Assistant",
    description: "Your general purpose appraisal AI assistant",
    primaryColor: "bg-blue-500",
    secondaryColor: "text-blue-100",
    iconBg: "bg-blue-600",
  },
  [AssistantType.NARRATIVE]: {
    title: "Narrative Generator",
    description: "Create professional appraisal narratives based on your data",
    primaryColor: "bg-purple-500",
    secondaryColor: "text-purple-100",
    iconBg: "bg-purple-600",
  },
  [AssistantType.ANALYSIS]: {
    title: "Market Analysis",
    description: "Get insights and analysis from market data",
    primaryColor: "bg-green-500",
    secondaryColor: "text-green-100",
    iconBg: "bg-green-600",
  },
  [AssistantType.COMPLIANCE]: {
    title: "Compliance Checker",
    description: "Ensure your reports meet compliance standards",
    primaryColor: "bg-amber-500",
    secondaryColor: "text-amber-100",
    iconBg: "bg-amber-600",
  },
};

interface AssistantPanelProps {
  type?: AssistantType;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  contextData?: any;
  onRequestComplete?: (response: string) => void;
  className?: string;
  suggestions?: string[];
}

export function AssistantPanel({
  type = AssistantType.GENERAL,
  collapsible = true,
  defaultCollapsed = false,
  contextData,
  onRequestComplete,
  className = "",
  suggestions = [],
}: AssistantPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const config = assistantConfig[type];

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;

    try {
      setIsLoading(true);
      setResponse(null);

      // Simulate AI response for now - will be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock response based on the assistant type
      let aiResponse = "";
      switch (type) {
        case AssistantType.NARRATIVE:
          aiResponse =
            "Based on your data, here's a suggested narrative for the neighborhood section:\n\nThe subject property is located in an established residential neighborhood with good access to schools, shopping, and employment centers. The neighborhood consists primarily of single-family homes built between 1970-2000, with median home values around $350,000.";
          break;
        case AssistantType.ANALYSIS:
          aiResponse =
            "Analysis of comparable properties shows:\n• Average price per sq ft: $185\n• Average days on market: 22\n• Most significant value factors: updated kitchen, additional bathroom, and lot size.\n\nRecommendation: Consider adjusting comp #2 for its premium lot location.";
          break;
        case AssistantType.COMPLIANCE:
          aiResponse =
            "✅ UAD formatting is correct\n✅ Required fields are completed\n⚠️ Potential issue: The condition rating (C4) may need additional supporting comments in the improvements section.";
          break;
        default:
          aiResponse =
            "I've analyzed your request. You can improve your appraisal by adding more detail about the recent renovations and their impact on value. Consider mentioning the timeline and quality of the updates.";
      }

      setResponse(aiResponse);

      if (onRequestComplete) {
        onRequestComplete(aiResponse);
      }

      enhancedToast.success({
        title: "AI Response Generated",
        description: "The assistant has provided a response to your query.",
      });
    } catch (error) {
      console.error("Error getting AI response:", error);
      enhancedToast.error({
        title: "AI Request Failed",
        description: "Could not get a response from the AI assistant. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  if (isCollapsed && collapsible) {
    return (
      <Button
        className={`${config.primaryColor} text-white w-full flex justify-between items-center ${className}`}
        onClick={() => setIsCollapsed(false)}
      >
        <div className="flex items-center">
          <Sparkles className="h-4 w-4 mr-2" />
          <span>{config.title}</span>
        </div>
        <ChevronUp className="h-4 w-4 ml-2" />
      </Button>
    );
  }

  return (
    <Card className={`border-t-4 ${config.primaryColor} ${className}`}>
      <CardHeader
        className={`pb-2 flex flex-row items-center justify-between ${config.primaryColor} text-white rounded-t-md`}
      >
        <div className="flex items-center">
          <div className={`p-1 rounded-full ${config.iconBg} mr-2`}><>

            <Sparkles className="h-4 w-4" />
          </div>
          <CardTitle
</> className="text-base font-medium">{config.title}</CardTitle>
        </div>
        {collapsible && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:text-white hover:bg-white/20 rounded-full"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-4 pb-2">
        <LoadingState isLoading={isLoading} loadingText="Generating response..." variant="inline">
          {response ? (
            <div className="mb-4 p-3 bg-muted/50 rounded-md whitespace-pre-line text-sm">
              {response}
              <div className="mt-3 pt-2 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setResponse(null)}
                >
                  New Question
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Textarea
                placeholder={`Ask ${config.title.toLowerCase()} for help...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[100px] resize-none mb-2"
              />

              {suggestions && suggestions.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {suggestions.map((suggestion /* , index */) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs py-1 h-auto"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </LoadingState>
      </CardContent>

      {!response && (
        <CardFooter className="pt-0 justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className={`${config.primaryColor} text-white`}
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
