import { useState } from "react";
import { AdjustmentModel } from "@shared/schema";
import { useAdjustmentModels } from "@/hooks/useAdjustmentModels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, PlusCircle, Refresh, Brain  } from '@mui/icons-material';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface AdjustmentModelSelectorProps {
  reportId: number;
  propertyId?: number;
  selectedModelId?: number;
  onSelectModel: (model: AdjustmentModel) => void;
}

export function AdjustmentModelSelector({
  reportId,
  propertyId,
  selectedModelId,
  onSelectModel,
}: AdjustmentModelSelectorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("manual");

  const { models, isLoadingModels, generateAIModel, isGeneratingAIModel } =
    useAdjustmentModels(reportId);

  const manualModels = models.filter((model) => model.modelType === "manual");
  const aiModels = models.filter((model) => model.modelType === "ai_generated");
  const marketModels = models.filter((model) => model.modelType === "market_derived");
  const hybridModels = models.filter((model) => model.modelType === "hybrid");

  const handleGenerateAIModel = async () => {
    try {
      await generateAIModel(
        {
          reportId,
          propertyId,
          aiProvider: "auto",
        },
        {
          onSuccess: (newModel) => {
            toast({
              title: "AI Model Generated",
              description: "New adjustment model has been created based on AI analysis",
            });
            onSelectModel(newModel.model);
            setActiveTab("ai");
          },
          onError: (error) => {
            toast({
              title: "Failed to Generate Model",
              description: "There was an error generating the AI model. Please try again.",
              variant: "destructive",
            });
            console.error("Error generating model:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error generating AI model:", error);
    }
  };

  const renderModelCards = (models: AdjustmentModel[]) => {
    if (models.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <AlertCircle className="w-10 h-10 mb-4" />
          <p>No models available</p>
        </div>
      );
    }

    return models.map((model) => (
      <Card
        key={model.id}
        className={`mb-4 cursor-pointer transition-all ${selectedModelId === model.id ? "border-2 border-primary" : "hover:border-primary/50"}`}
        onClick={() => onSelectModel(model)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start"><>

            <CardTitle className="text-lg">{model.name}</CardTitle>
            <Badge
</>
              variant={
                model.modelType === "manual"
                  ? "outline"
                  : model.modelType === "ai_generated"
                    ? "secondary"
                    : model.modelType === "market_derived"
                      ? "default"
                      : "destructive"
              }
            >
              {model.modelType.replace("_", " ")}
            </Badge>
          </div>
          <CardDescription>{model.description || "No description provided"}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          {model.metadata && model.metadata.confidence && (
            <div className="flex items-center mt-2"><>

              <span className="font-semibold mr-2">Confidence:</span>
              <span
</>>
                {typeof model.metadata.confidence === "number"
                  ? `${(model.metadata.confidence * 100).toFixed(1)}%`
                  : model.metadata.confidence}
              </span>
            </div>
          )}
          <div className="flex items-center mt-2"><>

            <span className="font-semibold mr-2">Created:</span>
            <span
</>>{new Date(model.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    ));
  };

  if (isLoadingModels) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><>

        <h3 className="text-lg font-semibold">Adjustment Models</h3>
        <div
</> className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAIModel}
            disabled={isGeneratingAIModel}
          >
            {isGeneratingAIModel ? (
              <>
                <Refresh className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Model
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Model
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4"><>

          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger
</> value="ai">AI Generated</TabsTrigger><>

          <TabsTrigger value="market">Market Derived</TabsTrigger>
          <TabsTrigger
</> value="hybrid">Hybrid</TabsTrigger>
        </TabsList><>


        <TabsContent value="manual" className="mt-0">
          {renderModelCards(manualModels)}
        </TabsContent>

        <TabsContent
</> value="ai" className="mt-0">
          {renderModelCards(aiModels)}
        </TabsContent><>


        <TabsContent value="market" className="mt-0">
          {renderModelCards(marketModels)}
        </TabsContent>

        <TabsContent
</> value="hybrid" className="mt-0">
          {renderModelCards(hybridModels)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
