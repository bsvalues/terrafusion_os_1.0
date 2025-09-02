import React from 'react';
import { CollaborativeWorkspace } from '@/components/collaborative/collaborative-workspace';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { InfoIcon, Wrench, MessageSquare, Share2  } from '@mui/icons-material';

export default function CollaborativeFeaturesDemo() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card className="mb-8">
        <CardHeader className="pb-3"><>

          <CardTitle className="text-2xl">Collaborative Features Demo</CardTitle>
          <CardDescription
</>>
            Explore the real-time collaboration capabilities of BentonGeoPro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="flex gap-2 items-start">
            <InfoIcon className="h-4 w-4 mt-1" />
            <div><>

              <div className="font-medium mb-1">How to use this demo</div>
              <div
</> className="text-sm">
                Open this page in multiple browser windows to simulate multiple users collaborating in real-time.
                Each window will need to join the same room ID for collaboration.
              </div>
            </div>
          </Alert>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3"><>

              <CardTitle>Collaboration Workspace</CardTitle>
              <CardDescription
</>>
                A unified environment for map collaboration, chat, and user presence
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <CollaborativeWorkspace />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3"><>

              <CardTitle>Technical Details</CardTitle>
              <CardDescription
</>>
                How the collaboration system is implemented
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="architecture">
                <TabsList className="mb-4">
                  <TabsTrigger value="architecture"><>

                    <Wrench className="h-4 w-4 mr-2" />
                    Architecture
                  </TabsTrigger>
                  <TabsTrigger
</> value="messaging"><>

                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messaging
                  </TabsTrigger>
                  <TabsTrigger
</> value="syncing">
                    <Share2 className="h-4 w-4 mr-2" />
                    State Syncing
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="architecture" className="space-y-4"><>

                  <h3 className="text-lg font-medium">WebSocket Architecture</h3>
                  <p
</>>
                    The collaboration system uses a WebSocket server built with the native 'ws' library in Node.js.
                    The server maintains a list of collaboration rooms, each with its own set of connected clients,
                    features, and annotations.
                  </p><>

                  
                  <p>
                    The server implements a room-based collaboration model, where users can join specific rooms
                    and only receive updates relevant to those rooms. This allows multiple collaboration sessions
                    to run simultaneously without interference.
                  </p>
                  
                  <p
</>>
                    We use ping/pong heartbeat messages to maintain connection status, and include reconnection
                    logic on the client to handle temporary disconnections.
                  </p>
                </TabsContent>
                
                <TabsContent value="messaging" className="space-y-4"><>

                  <h3 className="text-lg font-medium">Message Protocol</h3>
                  <p
</>>
                    Messages between clients and server follow a standard JSON format with fields for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><span className="font-mono">type</span>: The message type (e.g., 'chat', 'cursor_move')</li>
                    <li><span className="font-mono">roomId</span>: The collaboration room identifier</li>
                    <li><span className="font-mono">userId</span>: The sender's user ID</li>
                    <li><span className="font-mono">username</span>: The display name of the sender</li>
                    <li><span className="font-mono">payload</span>: The actual message data</li>
                    <li><span className="font-mono">timestamp</span>: When the message was sent</li>
                  </ul>
                  
                  <p>
                    The system supports both client-side and server-side message formats for backward compatibility,
                    handling field name differences and format variations transparently.
                  </p>
                </TabsContent>
                
                <TabsContent value="syncing" className="space-y-4"><>

                  <h3 className="text-lg font-medium">State Synchronization</h3>
                  <p
</>>
                    When a user joins a collaboration room, they receive the current state including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4"><>

                    <li>All existing GeoJSON features</li>
                            <li
</>>All text annotations and notes</li>
                    <li>List of currently connected users</li>
                  </ul><>

                  
                  <p>
                    Changes to features and annotations are immediately broadcast to all connected clients in the room.
                    This includes add, update, and delete operations. The server maintains the authoritative state and
                    ensures all clients stay synchronized.
                  </p>
                  
                  <p
</>>
                    We use WebSocket instead of HTTP polling to enable true real-time updates with minimal latency,
                    critical for collaborative mapping and drawing.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><>

              <CardTitle>WebSocket Health</CardTitle>
              <CardDescription
</>>
                Check the status of the WebSocket server
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2"><>

                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span
</>>Server Status: Online</span>
              </div>
              
              <div><>

                <div className="text-sm text-muted-foreground mb-1">Connected to:</div>
                <code
</> className="text-xs bg-muted p-1 rounded">wss://[your-domain]/ws</code>
              </div>
              
              <Separator />
              
              <div><>

                <div className="text-sm font-medium mb-1">Room Information</div>
                <p
</> className="text-sm text-muted-foreground">
                  Active Rooms: <span className="font-mono">2</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Connected Users: <span className="font-mono">5</span>
                </p>
              </div>
              
              <Button size="sm" className="w-full">Refresh Status</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Usage Instructions</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div><>

                <h3 className="text-sm font-medium mb-1">Joining a Room</h3>
                <p
</> className="text-sm text-muted-foreground">
                  Enter a room ID and click "Join Room" to enter a collaboration space.
                  Share the room ID with others to collaborate together.
                </p>
              </div>
              
              <div><>

                <h3 className="text-sm font-medium mb-1">Chat Features</h3>
                <p
</> className="text-sm text-muted-foreground">
                  The chat system allows real-time messaging between all users in the same room.
                  Messages include sender information and timestamps.
                </p>
              </div>
              
              <div><>

                <h3 className="text-sm font-medium mb-1">Coming Soon</h3>
                <ul
</> className="text-sm text-muted-foreground list-disc list-inside pl-2 space-y-1"><>

                  <li>User presence indicators</li>
                            <li
</>>Real-time cursor position sharing</li><>

                  <li>Collaborative drawing and annotations</li>
                            <li
</>>Feature editing history and undo/redo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}