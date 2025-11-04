/**
 * URAR Form Assistant Component
 * Provides AI-powered insights alongside the standard URAR form
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentAssistantShapConnector } from "./AgentAssistantShapConnector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ImageIcon,
  LayoutGrid,
  BarChart4,
  MessageSquare,
  Info,
  Camera,
  Building,
  ChevronRight,
 } from '@mui/icons-material';

interface UrarFormAssistantProps {
  propertyId: number;
  formData?: any;
  onInsightGenerated?: (insights: any) => void;
}

export function UrarFormAssistant({
  propertyId,
  formData,
  onInsightGenerated,
}: UrarFormAssistantProps) {
  const [activeTab, setActiveTab] = useState("condition");
  const [currentCondition, setCurrentCondition] = useState("good");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [insights, setInsights] = useState<Record<string, any>>({});

  // Example property data - in a real app, this would come from your API/backend
  const propertyData = {
    id: propertyId,
    address: formData?.address || "123 Main Street, Anytown, USA",
    propertyType: formData?.propertyType || "Single Family",
    yearBuilt: formData?.yearBuilt || 1985,
    images: [
      {
        id: 1,
        url: "/api/shap/sample-images/excellent_condition.png",
        type: "exterior",
        condition: "excellent",
      },
      {
        id: 2,
        url: "/api/shap/sample-images/good_condition.png",
        type: "exterior",
        condition: "good",
      },
      {
        id: 3,
        url: "/api/shap/sample-images/average_condition.png",
        type: "kitchen",
        condition: "average",
      },
      {
        id: 4,
        url: "/api/shap/sample-images/fair_condition.png",
        type: "bathroom",
        condition: "fair",
      },
      {
        id: 5,
        url: "/api/shap/sample-images/poor_condition.png",
        type: "foundation",
        condition: "poor",
      },
    ],
  };

  // Set first image on load
  useEffect(() => {
    if (propertyData.images.length > 0) {
      setCurrentImage(propertyData.images[0].url);
      setCurrentCondition(propertyData.images[0].condition);
    }
  }, [propertyData.images]);

  // Handle insights from SHAP analysis
  const handleInsightGenerated = (data: any) => {
    const updatedInsights = { ...insights, condition: data };
    setInsights(updatedInsights);

    if (onInsightGenerated) {
      onInsightGenerated(updatedInsights);
    }
  };

  // Select a specific image
  const selectImage = (image: { url: string; condition: string }) => {
    setCurrentImage(image.url);
    setCurrentCondition(image.condition);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>Property Assistant</CardTitle>
            <CardDescription
</>>AI-powered analysis &amp; insights</CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1">
            <Building className="h-3 w-3 mr-1" />
            <span>{propertyData.propertyType}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto pb-0">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            These AI-powered insights are provided alongside the URAR form to assist with property
            valuation. The legal form remains unmodified and compliant with all regulations.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="h-[calc(100%-3rem)]">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="condition">
              <BarChart4 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Condition</span>
            </TabsTrigger>
            <TabsTrigger value="photos">
              <ImageIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="comps">
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Comps</span>
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="condition" className="h-full overflow-auto"><>

            <AgentAssistantShapConnector
              propertyId={propertyId}
              imageUrl={currentImage || undefined}
              condition={currentCondition}
              modelVersion="latest"
              onInsightGenerated={handleInsightGenerated}
            />
          </TabsContent>

          <TabsContent
</> value="photos" className="h-full overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between"><>

                <h3 className="text-lg font-medium">Property Photos</h3>
                <Button
</> size="sm" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              </div>

              {currentImage && (
                <div className="rounded-md border overflow-hidden mb-4">
                  <img src={currentImage} alt="Property" className="w-full object-cover h-44" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {propertyData.images.map((image) => (
                  <div
                    key={image.id}
                    className={`
                      rounded-md border overflow-hidden cursor-pointer
                      ${currentImage === image.url ? "ring-2 ring-primary" : ""}
                    `}
                    onClick={() => selectImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`Property ${image.type}`}
                      className="w-full h-20 object-cover"
                    />
                    <div className="p-1 text-center bg-muted">
                      <Badge variant="outline" className="text-xs">
                        {image.condition}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comps" className="h-full overflow-auto">
            <div className="rounded-md border border-dashed p-6 text-center h-full flex flex-col items-center justify-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground mb-4" /><>

              <h3 className="text-lg font-medium mb-2">Comparable Properties</h3>
              <p
</> className="text-sm text-muted-foreground mb-4">
                AI-powered comparable property analysis will appear here
              </p>
              <Button>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Generate Comps Analysis
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="h-full overflow-auto">
            <div className="rounded-md border border-dashed p-6 text-center h-full flex flex-col items-center justify-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" /><>

              <h3 className="text-lg font-medium mb-2">AI Assistant Chat</h3>
              <p
</> className="text-sm text-muted-foreground mb-4">
                Ask questions about the property and get AI-powered insights
              </p>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Conversation
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
