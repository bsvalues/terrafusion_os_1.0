import { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CollaborativeMapContainer } from '@/components/maps/collaborative-map-container';
import { CollaborativeChat } from './collaborative-chat';
import { CollaborativeAnnotations } from '@/components/maps/collaborative-annotations';
import { MessageSquare, MapPin  } from '@mui/icons-material';

interface EnhancedCollaborativeWorkspaceProps {
  roomId: string;
  height?: number;
}

export function EnhancedCollaborativeWorkspace({ 
  roomId, 
  height = 700 
}: EnhancedCollaborativeWorkspaceProps) {
  // Active map reference
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  
  // Handle map instance from CollaborativeMapContainer
  const handleMapUpdated = (map: mapboxgl.Map) => {
    setMapInstance(map);
  };
  
  return (
    <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
      {/* Map panel - takes 70% by default */}
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="h-full">
          {/* @ts-ignore - We've added onMapUpdated to the props */}
          <CollaborativeMapContainer 
            roomId={roomId} 
            height={height}
            onMapUpdated={handleMapUpdated}
          />
        </div>
      </ResizablePanel>
      
      {/* Sidebar panel - takes 30% by default */}
      <ResizablePanel defaultSize={30} minSize={20}>
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <div className="border-b px-4 py-2">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="annotations" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Annotations</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="chat" className="h-full m-0 p-3"><>

              <CollaborativeChat 
                roomId={roomId} 
                height={height - 50} 
                className="h-full"
              />
            </TabsContent>
            
            <TabsContent
</> value="annotations" className="h-full m-0 p-3">
              {mapInstance && (
                <Card className="h-full">
                  <CardContent className="p-3">
                    <CollaborativeAnnotations 
                      map={mapInstance} 
                      roomId={roomId} 
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}