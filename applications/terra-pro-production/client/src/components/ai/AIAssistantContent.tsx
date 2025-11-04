import { useState, useEffect, useRef } from "react";
import { useAIAssistant } from "@/hooks/useAIAssistant";
import { AppraisalReport } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type AIAssistantContentProps = {
  currentReport: AppraisalReport | null;
};

export default function AIAssistantContent({ currentReport }: AIAssistantContentProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    chatQuery,
    isChatQuerying,
    analyzeProperty,
    isAnalyzingProperty,
    analyzeComparables,
    isAnalyzingComparables,
    generateNarrative,
    isGeneratingNarrative,
    validateUAD,
    isValidatingUAD,
  } = useAIAssistant();

  // Functions to scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await chatQuery({
        question: input,
        reportId: currentReport?.id,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant.",
        variant: "destructive",
      });
    }
  };

  // Handle AI analysis actions
  const handlePropertyAnalysis = async () => {
    if (!currentReport) {
      toast({
        title: "No report selected",
        description: "Please select a report first to analyze the property.",
        variant: "destructive",
      });
      return;
    }

    try {
      const analysis = await analyzeProperty(currentReport.propertyId);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `
# Property Analysis

## Market Trends
${analysis.marketTrends}

## Valuation Insights
${analysis.valuationInsights}

## Recommended Adjustments
${analysis.recommendedAdjustments}
        `,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error analyzing property:", error);
      toast({
        title: "Error",
        description: "Failed to analyze property with AI.",
        variant: "destructive",
      });
    }
  };

  const handleComparablesAnalysis = async () => {
    if (!currentReport) {
      toast({
        title: "No report selected",
        description: "Please select a report first to analyze comparables.",
        variant: "destructive",
      });
      return;
    }

    try {
      const analysis = await analyzeComparables(currentReport.id);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `
# Comparables Analysis

## Best Comparables
${analysis.bestComparables.map((id: number) => `- Comparable #${id}`).join("\n")}

## Adjustment Suggestions
${Object.entries(analysis.adjustmentSuggestions)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

## Reconciliation Notes
${analysis.reconciliationNotes}
        `,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error analyzing comparables:", error);
      toast({
        title: "Error",
        description: "Failed to analyze comparables with AI.",
        variant: "destructive",
      });
    }
  };

  const handleNarrativeGeneration = async () => {
    if (!currentReport) {
      toast({
        title: "No report selected",
        description: "Please select a report first to generate narratives.",
        variant: "destructive",
      });
      return;
    }

    try {
      const narrative = await generateNarrative(currentReport.id);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `
# Generated Narratives

## Neighborhood Description
${narrative.neighborhoodDescription}

## Property Description
${narrative.propertyDescription}

## Market Analysis
${narrative.marketAnalysis}

## Value Reconciliation
${narrative.valueReconciliation}
        `,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating narrative:", error);
      toast({
        title: "Error",
        description: "Failed to generate narratives with AI.",
        variant: "destructive",
      });
    }
  };

  const handleUADValidation = async () => {
    if (!currentReport) {
      toast({
        title: "No report selected",
        description: "Please select a report first to validate UAD compliance.",
        variant: "destructive",
      });
      return;
    }

    try {
      const validation = await validateUAD(currentReport.id);

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `
# UAD Compliance Check

## Status
${validation.compliant ? "✅ Report is UAD compliant" : "❌ Report has UAD compliance issues"}

## Issues
${
  validation.issues.length > 0
    ? validation.issues
        .map(
          (issue: { field: string; issue: string; severity: string }) =>
            `- ${issue.field}: ${issue.issue} (${issue.severity})`
        )
        .join("\n")
    : "No issues found."
}

## Suggestions
${validation.suggestions}
        `,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error validating UAD compliance:", error);
      toast({
        title: "Error",
        description: "Failed to validate UAD compliance with AI.",
        variant: "destructive",
      });
    }
  };

  // Sample prompts
  const sampleQueries = [
    "What are the key factors affecting the value of this property?",
    "Suggest adjustments for the comparable properties",
    "How do I determine the appropriate square footage adjustment rate?",
    "Summarize the current market conditions for this neighborhood",
    "What are common UAD compliance issues to watch out for?",
  ];

  return (
    <div className="flex flex-col h-[70vh]">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2"><>

          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger
</> value="tools">Analysis Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 border rounded-md p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8"><>

                <p className="mb-4">How can I help you with your appraisal today?</p>
                <div
</> className="border rounded-md p-3 bg-white mb-4 max-w-md mx-auto"><>

                  <p className="text-sm text-gray-700 font-medium">Sample questions:</p>
                  <ul
</> className="list-disc pl-5 text-sm mt-2">
                    {sampleQueries.map((query /* , index */) => (
                      <li key={index} className="mb-1">
                        <button
                          className="text-left text-blue-600 hover:underline"
                          onClick={() => setInput(query)}
                        >
                          {query}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    ><>

                      <div className="whitespace-pre-line prose prose-sm max-w-none break-words">
                        {message.content}
                      </div>
                      <div
</>
                        className={`text-xs mt-1 ${
                          message.role === "user" ? "text-primary-foreground/70" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endOfMessagesRef} />
              </div>
            )}
          </div>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something about your appraisal..."
              className="flex-1 resize-none"
              maxLength={500}
              disabled={isChatQuerying}
            />
            <Button type="submit" disabled={isChatQuerying || input.trim() === ""}>
              {isChatQuerying ? <Spinner size="sm" /> : "Send"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 bg-gray-50"><>

              <h3 className="font-medium mb-2">Property Analysis</h3>
              <p
</> className="text-sm text-gray-600 mb-4">
                Analyze the subject property for market trends, value drivers, and potential
                adjustments.
              </p>
              <Button
                onClick={handlePropertyAnalysis}
                disabled={isAnalyzingProperty || !currentReport}
                className="w-full"
              >
                {isAnalyzingProperty ? <Spinner size="sm" /> : "Analyze Property"}
              </Button>
            </div>

            <div className="border rounded-md p-4 bg-gray-50"><>

              <h3 className="font-medium mb-2">Comparables Analysis</h3>
              <p
</> className="text-sm text-gray-600 mb-4">
                Analyze comparables to identify best matches and suggest appropriate adjustments.
              </p>
              <Button
                onClick={handleComparablesAnalysis}
                disabled={isAnalyzingComparables || !currentReport}
                className="w-full"
              >
                {isAnalyzingComparables ? <Spinner size="sm" /> : "Analyze Comparables"}
              </Button>
            </div>

            <div className="border rounded-md p-4 bg-gray-50"><>

              <h3 className="font-medium mb-2">Narrative Generation</h3>
              <p
</> className="text-sm text-gray-600 mb-4">
                Generate professional narrative sections for your appraisal report.
              </p>
              <Button
                onClick={handleNarrativeGeneration}
                disabled={isGeneratingNarrative || !currentReport}
                className="w-full"
              >
                {isGeneratingNarrative ? <Spinner size="sm" /> : "Generate Narratives"}
              </Button>
            </div>

            <div className="border rounded-md p-4 bg-gray-50"><>

              <h3 className="font-medium mb-2">UAD Compliance Check</h3>
              <p
</> className="text-sm text-gray-600 mb-4">
                Check your report for Uniform Appraisal Dataset compliance issues.
              </p>
              <Button
                onClick={handleUADValidation}
                disabled={isValidatingUAD || !currentReport}
                className="w-full"
              >
                {isValidatingUAD ? <Spinner size="sm" /> : "Validate UAD Compliance"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-600 mb-2">
              {currentReport
                ? `Using AI tools with report: ${currentReport.reportType} (${currentReport.id})`
                : "No report selected. Please open a report to use these tools."}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
