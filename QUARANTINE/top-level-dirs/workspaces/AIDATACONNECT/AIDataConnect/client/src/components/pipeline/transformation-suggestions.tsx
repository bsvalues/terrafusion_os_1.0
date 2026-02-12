import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, InfoIcon, Copy, CheckCircle } from "lucide-react";

interface Transformation {
  name: string;
  description: string;
  transformation: string;
}

interface TransformationSuggestionsProps {
  data: any;
  onApply: (transformation: string) => void;
}

export function TransformationSuggestions({ data, onApply }: TransformationSuggestionsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Transformation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const suggestMutation = useMutation({
    mutationFn: async () => {
      if (!data) {
        throw new Error("No data available for analysis");
      }
      const res = await apiRequest("POST", "/api/suggest-transformations", { data });
      return res.json();
    },
    onSuccess: (data: Transformation[]) => {
      setSuggestions(data);
      toast({
        title: "AI Analysis Complete",
        description: `Generated ${data.length} transformation suggestions`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error getting suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground border rounded-lg">
        <InfoIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p>Connect a data source to get AI-powered suggestions</p>
        <p className="text-sm mt-2 text-muted-foreground">
          The AI will analyze your data and suggest useful transformations
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              Get intelligent transformation suggestions based on your data structure
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => suggestMutation.mutate()}
                  disabled={suggestMutation.isPending}
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  {suggestMutation.isPending ? "Analyzing Data..." : "Get AI Suggestions"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Let AI analyze your data and suggest useful transformations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Transformation Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            Select a suggestion to apply to your data
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSuggestions([]);
            setSelectedId(null);
          }}
        >
          Clear Suggestions
        </Button>
      </div>

      <ScrollArea className="h-[400px] border rounded-lg">
        <div className="p-4 space-y-4">
          {suggestions.map((suggestion, index) => (
            <Card 
              key={index}
              className={`transition-all hover:shadow-md ${
                selectedId === index ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{suggestion.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {suggestion.description}
                    </CardDescription>
                  </div>
                  {selectedId === index && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
                  <code>{suggestion.transformation}</code>
                </pre>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(suggestion.transformation);
                    toast({
                      title: "Copied to Clipboard",
                      description: "Transformation code copied",
                    });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSelectedId(index);
                    onApply(suggestion.transformation);
                    toast({
                      title: "Transformation Applied",
                      description: "The selected transformation has been applied to your data",
                    });
                  }}
                >
                  Apply
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}