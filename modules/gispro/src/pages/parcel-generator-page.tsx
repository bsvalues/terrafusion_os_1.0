import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, KeySquare, Warning, CheckCircle, Copy, Info  } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AssistantPanel } from "@/components/chatbot/assistant-panel";
import { isValidParcelNumber, DEFAULT_MAP_LAYERS } from "@/lib/map-utils";
import { ParcelPreview } from "@/components/maps/parcel-preview";

export default function ParcelGeneratorPage() {
  // Bypass auth during development
  const user = { id: 1, username: 'admin', fullName: 'Administrator' };
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [parentParcelId, setParentParcelId] = useState<string>("");
  const [count, setCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [generationType, setGenerationType] = useState<string>("sequential");
  const [generatedParcels, setGeneratedParcels] = useState<string[]>([]);
  
  // Validation state
  const [parentParcelError, setParentParcelError] = useState<string>("");
  const [countError, setCountError] = useState<string>("");
  
  // Generation mutation
  const generateParcelsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/parcel-numbers/generate", {
        parentParcelId,
        count,
        notes,
        type: generationType
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedParcels(data);
      toast({
        title: "Parcels Generated",
        description: `Successfully generated ${data.length} new parcel number${data.length === 1 ? '' : 's'}.`,
      });
      
      // Switch to results tab
      setActiveTab("results");
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Reset errors
    setParentParcelError("");
    setCountError("");
    
    // Validate parent parcel ID
    if (!parentParcelId) {
      setParentParcelError("Parent parcel ID is required");
      isValid = false;
    } else if (!isValidParcelNumber(parentParcelId)) {
      setParentParcelError("Parent parcel ID must be a 15-digit number");
      isValid = false;
    }
    
    // Validate count
    if (!count || count < 1) {
      setCountError("Count must be at least 1");
      isValid = false;
    } else if (count > 100) {
      setCountError("Count cannot exceed 100");
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      generateParcelsMutation.mutate();
    }
  };
  
  // Copy a parcel number to clipboard
  const copyToClipboard = (parcelNumber: string) => {
    navigator.clipboard.writeText(parcelNumber).then(
      () => {
        toast({
          title: "Copied",
          description: `Parcel number ${parcelNumber} copied to clipboard.`,
        });
      },
      (err) => {
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    );
  };
  
  // Copy all parcel numbers to clipboard
  const copyAllToClipboard = () => {
    const text = generatedParcels.join("\n");
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied All",
          description: `All ${generatedParcels.length} parcel numbers copied to clipboard.`,
        });
      },
      (err) => {
        toast({
          title: "Copy Failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeModule="parcel-generator" />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* Page Header */}
          <div className="mb-6"><>

            <h1 className="text-2xl font-bold text-neutral-800">Parcel ID Generator</h1>
            <p
</>
className="text-sm text-neutral-500">Generate new parcel numbers based on Benton County Ab/Sub code system</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><>

                  <CardTitle>Parcel Number Generator</CardTitle>
                  <CardDescription
</>
</>>
                    Create new parcel numbers based on an existing parent parcel.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2"><>

                      <TabsTrigger value="generate">Generate</TabsTrigger>
                      <TabsTrigger
</>
value="results" disabled={generatedParcels.length === 0}>Results</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="generate">
                      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2"><>

                          <Label htmlFor="parentParcelId">Parent Parcel ID</Label>
                          <Input
</>

                            id="parentParcelId"
                            placeholder="15-digit Parcel ID"
                            value={parentParcelId}
                            onChange={(e) => setParentParcelId(e.target.value)}
                            className={parentParcelError ? "border-destructive" : ""}
                          />
                          {parentParcelError && (
                            <p className="text-sm text-destructive">{parentParcelError}</p>
                          )}
                          <p className="text-xs text-neutral-500">
                            Enter the 15-digit parent parcel ID from which to generate new parcels.
                          </p>
                        </div>
                        
                        <div className="space-y-2"><>

                          <Label htmlFor="count">Number of Parcels to Generate</Label>
                          <Input
</>

                            id="count"
                            type="number"
                            placeholder="Enter a number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                            className={countError ? "border-destructive" : ""}
                          />
                          {countError && (
                            <p className="text-sm text-destructive">{countError}</p>
                          )}
                          <p className="text-xs text-neutral-500">
                            Specify how many sequential parcel numbers to generate (max 100).
                          </p>
                        </div>
                        
                        <div className="space-y-2"><>

                          <Label htmlFor="generationType">Generation Type</Label>
                          <RadioGroup
</>

                            defaultValue="sequential" 
                            value={generationType}
                            onValueChange={setGenerationType}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sequential" id="sequential" />
                              <Label htmlFor="sequential">Sequential (next available numbers)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="bla" id="bla" />
                              <Label htmlFor="bla">BLA (boundary line adjustment format)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="short_plat" id="short_plat" />
                              <Label htmlFor="short_plat">Short Plat format</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        
                        <div className="space-y-2"><>

                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
</>

                            id="notes"
                            placeholder="Enter any notes about these parcels"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                        
                        <Alert className="bg-amber-50 border-amber-200">
                          <Warning className="h-4 w-4 text-amber-600" /><>

                          <AlertTitle className="text-amber-800">Important</AlertTitle>
                          <AlertDescription
</>
className="text-amber-700">
                            New parcel numbers are automatically added to the Abstract Codes database. Please ensure the parent parcel ID is correct before proceeding.
                          </AlertDescription>
                        </Alert>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="results">
                      {generatedParcels.length > 0 ? (
                        <div className="space-y-4 pt-4">
                          <div className="flex justify-between items-center"><>

                            <h3 className="font-medium">Generated Parcel Numbers</h3>
                            <Button
</>

                              variant="outline" 
                              size="sm"
                              onClick={copyAllToClipboard}
                            >
                              <Copy className="h-4 w-4 mr-1.5" />
                              Copy All
                            </Button>
                          </div>
                          
                          <div className="bg-neutral-50 rounded-md border border-neutral-200 p-2">
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {generatedParcels.map((parcelNumber /* , index */) => (
                                <div 
                                  key={index} 
                                  className="flex justify-between items-center p-2 bg-white rounded border border-neutral-100 hover:border-primary-200 hover:bg-primary-50"
                                >
                                  <div className="flex items-center"><>

                                    <span className="text-xs text-neutral-500 w-6">{index + 1}.</span>
                                    <span
</>
className="font-mono">{parcelNumber}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => copyToClipboard(parcelNumber)}
                                  >
                                    <Copy className="h-4 w-4 text-neutral-500 hover:text-primary-600" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <Alert className="bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" /><>

                            <AlertTitle className="text-green-800">Success</AlertTitle>
                            <AlertDescription
</>
className="text-green-700">
                              {generatedParcels.length} new parcel numbers have been generated and saved to the system.
                            </AlertDescription>
                          </Alert>
                          
                          <div className="flex justify-between pt-2"><>

                            <Button 
                              variant="outline"
                              onClick={() => setActiveTab("generate")}
                            >
                              Back to Generator
                            </Button>
                            <Button
</>

                              variant="default"
                              onClick={() => {
                                setParentParcelId("");
                                setCount(1);
                                setNotes("");
                                setGenerationType("sequential");
                                setGeneratedParcels([]);
                                setActiveTab("generate");
                              }}
                            >
                              Start New
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center"><>

                          <p className="text-neutral-500">No parcels have been generated yet.</p>
                          <Button
</>

                            variant="link"
                            onClick={() => setActiveTab("generate")}
                          >
                            Go to generator
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
                
                <CardFooter className="flex justify-end border-t pt-6">
                  {activeTab === "generate" && (
                    <Button 
                      type="submit"
                      onClick={handleSubmit}
                      disabled={generateParcelsMutation.isPending}
                    >
                      {generateParcelsMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                      ) : (
                          <KeySquare className="mr-2 h-4 w-4" />
                          Generate Parcel Numbers
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Parcel ID Rules */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Parcel ID Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
                      <h4 className="text-sm font-medium mb-2 flex items-center"><>

                        <Info className="h-4 w-4 mr-1.5 text-primary-600" />
                        15-Digit Format
                      </h4>
                      <div
</>
className="flex items-center justify-center mb-2">
                        <div className="flex"><>

                          <div className="border border-neutral-300 px-2 py-1 bg-primary-100 text-primary-800 font-mono text-xs">
                            1-2-3-4-5-6
                          </div>
                          <div
</>
className="border border-neutral-300 px-2 py-1 bg-secondary-100 text-secondary-800 font-mono text-xs">
                            7-8-9
                          </div>
                          <div className="border border-neutral-300 px-2 py-1 bg-neutral-100 text-neutral-800 font-mono text-xs">
                            10-11-12-13-14-15
                          </div>
                        </div>
                      </div>
                      <ul className="text-xs space-y-1 text-neutral-600">
                        <li><span className="text-primary-700 font-medium">Digits 1-6:</span> Township-Range-Section</li>
                        <li><span className="text-secondary-700 font-medium">Digits 7-9:</span> Abstract Code (Ab/Sub system)</li>
                        <li><span className="text-neutral-700 font-medium">Digits 10-15:</span> Sequential number within Abstract</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2"><>

                      <h4 className="text-sm font-medium">Generation Rules</h4>
                      <ul
</>
className="text-xs space-y-1.5 text-neutral-600"><>

                        <li>• New parcel numbers maintain township-range-section</li>
                            <li
</>
</>>• Abstract code (digits 7-9) may change based on type</li><>

                        <li>• Sequential numbers start from the next available</li>
                            <li
</>
</>>• BLA format uses specific abstract code conventions</li>
                        <li>• Short Plats follow county specific numbering rules</li>
                      </ul>
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200 p-3">
                      <AlertDescription className="text-xs text-blue-700"><>

                        <p className="font-medium">Need assistance with Ab/Sub code rules?</p>
                        <p
</>
className="mt-1">Refer to the Benton County Abstract Code Manual or ask the assistant below.</p>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
              
              {/* Help Panel */}
              <ParcelPreview parcelIds={generatedParcels} mapLayers={DEFAULT_MAP_LAYERS} />
              <AssistantPanel title="Parcel ID Generator Help" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
