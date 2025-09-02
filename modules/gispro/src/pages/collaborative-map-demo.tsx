import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CollaborativeMap } from '@/components/maps/collaborative-map';
import { AlertCircle, FileText, Info, Map, Users  } from '@mui/icons-material';
import { Alert } from '@/components/ui/alert';

export default function CollaborativeMapDemoPage() {
  const [, setLocation] = useLocation();
  
  // Set document title
  useEffect(() => {
    document.title = 'Collaborative Map Demo - BentonGeoPro';
  }, []);
  
  // State for user information and room
  const [username, setUsername] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('benton-map-room');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [mapboxTokenAvailable, setMapboxTokenAvailable] = useState<boolean | null>(null);
  
  // Check if Mapbox token is available
  useEffect(() => {
    // In a real application, we'd check for the MAPBOX_ACCESS_TOKEN here
    // For this demo, we'll assume it's available
    setMapboxTokenAvailable(true);
  }, []);
  
  // Join the collaborative map room
  const handleJoin = () => {
    if (!username) {
      alert('Please enter a username to join');
      return;
    }
    
    setIsJoined(true);
  };
  
  // Leave the collaborative map room
  const handleLeave = () => {
    setIsJoined(false);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="mb-8"><>

        <h1 className="text-3xl font-bold mb-2">Collaborative Map</h1>
        <p
</> className="text-muted-foreground">
          Real-time collaborative mapping for Benton County Assessor's Office
        </p>
      </header>
      
      {mapboxTokenAvailable === false && (
        <Alert className="mb-4 bg-red-100 text-red-800 border border-red-200">
          <AlertCircle className="h-4 w-4" /><>

          <div className="font-medium">Missing Mapbox Token</div>
          <div
</> className="text-sm mt-1">
            The Mapbox access token is not available. Please ensure the MAPBOX_ACCESS_TOKEN environment variable is set.
          </div>
        </Alert>
      )}
      
      {!isJoined ? (
        <Card className="max-w-md mx-auto">
          <CardHeader><>

            <CardTitle>Join Collaborative Session</CardTitle>
            <CardDescription
</>>
              Enter your details to join a collaborative mapping session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="username">Your Name</Label>
                <Input
</>
                  id="username"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="roomId">Room ID</Label>
                <Input
</>
                  id="roomId"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleJoin} 
              disabled={!username || mapboxTokenAvailable === false}
              className="w-full"
            >
              <Users className="mr-2 h-4 w-4" />
              Join Session
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><>

              <h2 className="text-xl font-semibold">Collaborative Session: {roomId}</h2>
              <p
</> className="text-sm text-muted-foreground">You joined as: {username}</p>
            </div>
            <Button variant="outline" onClick={handleLeave}>
              Leave Session
            </Button>
          </div>
          
          <Alert className="bg-blue-50 border border-blue-200 text-blue-800">
            <Info className="h-4 w-4" /><>

            <div className="font-medium">Collaboration Features</div>
            <div
</> className="text-sm mt-1">
              <ul className="list-disc list-inside mt-2"><>

                <li>See other users' cursors in real-time</li>
                            <li
</>>Draw and annotate on the map collaboratively</li><>

                <li>Changes are synchronized with all participants</li>
                            <li
</>>Use the tools on the left to switch between modes</li>
              </ul>
            </div>
          </Alert>
          
          <div className="bg-background rounded-md overflow-hidden border"><>

            <CollaborativeMap
              roomId={roomId}
              username={username}
              showCollaborators={true}
              showControls={true}
              showLayerControls={true}
              allowDrawing={true}
              height="600px"
            />
          </div>
          
          <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><>

                    <Map className="h-4 w-4 mr-2 text-primary" />
                    Pan &amp; Zoom
                  </li>
                  <li
</> className="flex items-center"><>

                    <FileText className="h-4 w-4 mr-2 text-primary" />
                    Measure Distance
                  </li>
                  <li
</> className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    See Collaborators
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This collaborative map tool allows multiple users to work simultaneously on geospatial data. 
                  It's perfect for teams who need to coordinate land assessment, property boundary reviews, 
                  or any task requiring shared geographic context.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}