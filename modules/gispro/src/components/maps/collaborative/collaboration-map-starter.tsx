import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MapboxProvider from '@/components/maps/mapbox/mapbox-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2  } from '@mui/icons-material';

/**
 * MapStarter Component
 * 
 * This component provides a simple UI to start a collaborative map session
 * with a room ID.
 */
export function CollaborationMapStarter() {
  const [roomId, setRoomId] = useState<string>('');
  const [enteredRoom, setEnteredRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  
  // Generate a random room ID if none is provided
  useEffect(() => {
    if (!roomId) {
      const randomId = `map-${Math.floor(Math.random() * 1000000)}`;
      setRoomId(randomId);
    }
  }, []);
  
  // Fetch Mapbox token directly
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/mapbox-token');
        if (!response.ok) {
          throw new Error(`Failed to fetch Mapbox token: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data && typeof data.token === 'string') {
          console.log('Successfully retrieved Mapbox token for starter');
          setMapboxToken(data.token);
        } else {
          throw new Error('Invalid token format received');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Mapbox token');
        console.error('Error fetching token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchToken();
  }, []);
  
  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a valid room ID');
      return;
    }
    
    setEnteredRoom(roomId);
    setError(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading map resources...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" /><>

          <AlertTitle>Error</AlertTitle>
          <AlertDescription
</>
</>>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!enteredRoom) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div><>

          <Label htmlFor="room-id">Room ID</Label>
          <Input
</>

            id="room-id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room ID"
          />
        </div>
        <Button onClick={handleJoinRoom} className="w-full">
          Join Map Collaboration
        </Button>
      </div>
    );
  }
  
  return (
    <div className="h-full">
      <MapboxProvider
        initialViewState={{
          longitude: -121.3153,
          latitude: 44.0582,
          zoom: 13
        }}
      >
        <div className="absolute top-2 left-2 z-10 bg-background/80 p-2 rounded-md text-sm">
          Room: {enteredRoom}
        </div>
      </MapboxProvider>
    </div>
  );
}

export default CollaborationMapStarter;