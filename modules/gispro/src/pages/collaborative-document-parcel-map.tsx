import React, { useState, useEffect, useCallback } from 'react';
import { CollaborativeMapContainer } from '@/components/maps/collaborative-map-container';
import { DocumentParcelLinker } from '@/components/maps/collaborative/document-parcel-linker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, 
  Users, 
  MessageSquare, 
  Save, 
  FileText, 
  Link as LinkIcon,
  Copy
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

/**
 * Collaborative Document-Parcel Map Page
 * 
 * This page combines the collaborative map functionality with document-parcel linking capabilities
 * Users can join rooms, collaborate on maps, and link documents to parcels in real-time
 */
export default function CollaborativeDocumentParcelMapPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [selectedParcelId, setSelectedParcelId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<string>('map');

  // Set document title
  useEffect(() => {
    document.title = 'Collaborative Document-Parcel Map - BentonGeoPro';
  }, []);

  // Generate a random username if not provided
  useEffect(() => {
    if (!username) {
      setUsername(`User_${Math.floor(Math.random() * 1000)}`);
    }
  }, [username]);

  // Handle joining a room
  const handleJoinRoom = () => {
    if (!username) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username to join the room',
        variant: 'destructive'
      });
      return;
    }
    
    if (!roomId) {
      toast({
        title: 'Room ID Required',
        description: 'Please enter a room ID or create a new one',
        variant: 'destructive'
      });
      return;
    }
    
    setIsJoined(true);
    
    toast({
      title: 'Joined Room',
      description: `You've joined the collaborative room: ${roomId}`,
    });
  };

  // Handle leaving a room
  const handleLeaveRoom = () => {
    setIsJoined(false);
    setSelectedParcelId(undefined);
    setActiveTab('map');
    
    toast({
      title: 'Left Room',
      description: 'You have left the collaborative room',
    });
  };

  // Handle creating a new room with a generated ID
  const handleCreateRoom = () => {
    const newRoomId = `room-${uuidv4().substring(0, 8)}`;
    setRoomId(newRoomId);
    
    toast({
      title: 'New Room Created',
      description: 'A new room ID has been generated',
    });
  };

  // Handle copy room ID to clipboard
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    
    toast({
      title: 'Copied',
      description: 'Room ID copied to clipboard',
    });
  };

  // Handle when the map selects a parcel
  const handleParcelSelected = useCallback((id: number) => {
    setSelectedParcelId(id);
    setActiveTab('links');
    
    toast({
      title: 'Parcel Selected',
      description: `Parcel #${id} has been selected`,
    });
  }, [toast]);

  // Handle when document-parcel links change
  const handleLinksChanged = useCallback(() => {
    toast({
      title: 'Links Updated',
      description: 'Document-parcel links have been updated',
    });
  }, [toast]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <header><>

        <h1 className="text-3xl font-bold mb-2">Collaborative Document-Parcel Map</h1>
        <p
</> className="text-muted-foreground">
          Work collaboratively on maps and link documents to parcels in real-time
        </p>
      </header>
      
      {!isJoined ? (
        <Card>
          <CardHeader><>

            <CardTitle>Join a Collaborative Session</CardTitle>
            <CardDescription
</>>
              Enter your name and a room ID to join, or create a new room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2"><>

                <label htmlFor="username" className="text-sm font-medium">
                  Your Name
                </label>
                <Input
</>
                  id="username"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="space-y-2"><>

                <label htmlFor="roomId" className="text-sm font-medium">
                  Room ID
                </label>
                <div
</> className="flex space-x-2">
                  <Input
                    id="roomId"
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleCreateRoom}
                    title="Generate a new room ID"
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoinRoom} disabled={!username || !roomId}>
              <Users className="mr-2 h-4 w-4" />
              Join Room
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Users className="mr-2 h-4 w-4" />
                <span>{username}</span>
              </Badge>
              
              <Badge variant="outline" className="text-sm px-3 py-1">
                <MapPin className="mr-2 h-4 w-4" /><>

                <span>Room: {roomId}</span>
                <Button
</>
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-2"
                  onClick={handleCopyRoomId}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
            
            <Button variant="outline" onClick={handleLeaveRoom}>
              Leave Room
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger value="map"><>

                <MapPin className="mr-2 h-4 w-4" />
                Map
              </TabsTrigger>
              <TabsTrigger
</> value="links">
                <LinkIcon className="mr-2 h-4 w-4" />
                Document-Parcel Links
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-4">
              <div className="bg-card rounded-lg border overflow-hidden">
                <div className="h-[600px]">
                  <CollaborativeMapContainer
                    roomId={roomId}
                    height="100%"
                    onParcelSelected={handleParcelSelected}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="links" className="mt-4">
              <Card>
                <CardHeader><>

                  <CardTitle>Document-Parcel Linking</CardTitle>
                  <CardDescription
</>>
                    {selectedParcelId 
                      ? `Manage document links for Parcel #${selectedParcelId}`
                      : 'Select a parcel on the map to manage document links'}
                  </CardDescription>
                </CardHeader>
                <CardContent><>

                  <DocumentParcelLinker
                    roomId={roomId}
                    parcelId={selectedParcelId}
                    onLinksChanged={handleLinksChanged}
                    showLinkButton={!!selectedParcelId}
                  />
                </CardContent>
                <CardFooter
</>>
                  <Button variant="outline" onClick={() => setActiveTab('map')}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Back to Map
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}