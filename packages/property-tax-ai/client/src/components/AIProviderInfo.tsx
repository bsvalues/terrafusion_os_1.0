import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, CheckCircle, AlertCircle } from "lucide-react";

type AIProviderStatus = "operational" | "degraded" | "unavailable" | "unknown";

interface AIProvider {
  name: string;
  description: string;
  status: AIProviderStatus;
  model: string;
  useCases: string[];
}

const providers: AIProvider[] = [
  {
    name: "OpenAI",
    description: "Primary provider for standard property inquiries and citizen self-service",
    status: "operational",
    model: "GPT-4",
    useCases: ["Property searches", "Basic inquiries", "Self-service guidance"]
  },
  {
    name: "Anthropic Claude",
    description: "Specialized provider for complex assessments and multi-modal data analysis",
    status: "operational",
    model: "Claude 3.7 Sonnet",
    useCases: ["Complex property analyses", "Document interpretation", "Visual property assessments"]
  },
  {
    name: "Perplexity",
    description: "Enhanced provider for web-augmented property research and valuation insights",
    status: "operational",
    model: "Llama 3.1 Sonar Small",
    useCases: ["Market research", "Valuation insights", "Comparable property analysis"]
  }
];

const getStatusColor = (status: AIProviderStatus): string => {
  switch (status) {
    case "operational":
      return "bg-green-500";
    case "degraded":
      return "bg-yellow-500";
    case "unavailable":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusIcon = (status: AIProviderStatus) => {
  switch (status) {
    case "operational":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "degraded":
    case "unavailable":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
};

export function AIProviderInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" /> AI Provider Status
        </CardTitle>
        <CardDescription>
          Multi-provider AI strategy with automatic failover capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers.map((provider, index) => (
            <div key={provider.name}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-sm flex items-center gap-1.5">
                    {provider.name} 
                    <div 
                      className={`w-2 h-2 rounded-full ${getStatusColor(provider.status)}`} 
                      title={provider.status}
                    />
                  </h3>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  {provider.model}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-1 mb-3">
                {provider.useCases.map(useCase => (
                  <Badge key={useCase} variant="secondary" className="text-xs">
                    {useCase}
                  </Badge>
                ))}
              </div>
              {index < providers.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Last updated: April 2, 2025 - All systems operational
      </CardFooter>
    </Card>
  );
}

export default AIProviderInfo;