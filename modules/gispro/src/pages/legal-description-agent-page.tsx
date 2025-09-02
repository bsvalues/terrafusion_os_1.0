import React, { useState } from 'react';
import { LegalDescriptionAgent } from '@/components/legal-description/legal-description-agent';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

/**
 * Legal Description Agent Page
 * 
 * This page provides tools for converting legal descriptions of properties into
 * visual map representations. Users can paste legal descriptions, analyze them,
 * and see the resulting parcel boundaries on a map.
 */
const LegalDescriptionAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('agent');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleSaveSuccess = () => {
    toast({
      title: "Parcel Saved",
      description: "The parcel has been successfully saved to the database.",
      duration: 5000,
    });
  };

  return (
    <Layout title="Legal Description Agent">
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 border-b"><>

          <h1 className="text-2xl font-bold">Legal Description Agent</h1>
          <p
</> className="text-muted-foreground">
            Convert legal descriptions into property boundaries.
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="agent" value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
            <div className="px-4 py-2 border-b">
              <TabsList><>

                <TabsTrigger value="agent">Legal Description Agent</TabsTrigger>
                <TabsTrigger
</> value="history">History</TabsTrigger>
                <TabsTrigger value="help">Help & Guide</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="agent" className="flex-1 p-0 overflow-hidden"><>

              <LegalDescriptionAgent onSaveSuccess={handleSaveSuccess} />
            </TabsContent>
            
            <TabsContent
</> value="history" className="flex-1 p-4">
              <div className="rounded-lg border p-4 h-full overflow-auto"><>

                <h3 className="text-lg font-medium mb-2">History</h3>
                <p
</> className="text-muted-foreground mb-4">
                  Your recently processed legal descriptions will appear here.
                </p>
                <div className="divide-y">
                  {/* Placeholder for history items */}
                  <p className="py-4 text-center text-muted-foreground">
                    No history items yet.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="help" className="flex-1 p-4">
              <div className="rounded-lg border p-4 h-full overflow-auto"><>

                <h3 className="text-lg font-medium mb-2">Help & Guide</h3>
                <div
</> className="space-y-4">
                  <div><>

                    <h4 className="font-medium">What is the Legal Description Agent?</h4>
                    <p
</> className="text-muted-foreground">
                      The Legal Description Agent helps you convert legal property descriptions
                      into visual map boundaries. It supports various formats including metes and bounds,
                      township/range descriptions, lot/block references, and more.
                    </p>
                  </div>
                  
                  <div><>

                    <h4 className="font-medium">How to use:</h4>
                    <ol
</> className="list-decimal list-inside space-y-2 text-muted-foreground"><>

                      <li>Paste a legal description into the text area.</li>
                            <li
</>>Click "Parse Description" to analyze the text.</li><>

                      <li>Review the detected boundaries on the map.</li>
                            <li
</>>Adjust points if needed using the editing tools.</li>
                      <li>Save the parcel to the database when ready.</li>
                    </ol>
                  </div>
                  
                  <div><>

                    <h4 className="font-medium">Supported Formats:</h4>
                    <ul
</> className="list-disc list-inside space-y-1 text-muted-foreground"><>

                      <li>Metes and Bounds descriptions</li>
                            <li
</>>Township, Range, and Section references</li><>

                      <li>Lot and Block references</li>
                            <li
</>>Informal property descriptions</li>
                    </ul>
                  </div>
                  
                  <div><>

                    <h4 className="font-medium">Tips:</h4>
                    <ul
</> className="list-disc list-inside space-y-1 text-muted-foreground"><>

                      <li>Complete descriptions work better than partial ones.</li>
                            <li
</>>Include a Point of Beginning for metes and bounds descriptions.</li><>

                      <li>Check the confidence score to gauge accuracy.</li>
                            <li
</>>Use manual editing for low-confidence results.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default LegalDescriptionAgentPage;