import React, { useState } from 'react';
import { CollaborativeChat } from './collaborative-chat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, 
  Users, 
  Map, 
  PanelRight, 
  PanelLeft,
  Copy
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

interface CollaborativeWorkspaceProps {
  roomId?: string;
  className?: string;
}

export function CollaborativeWorkspace({
  roomId: initialRoomId = '',
  className = ''
}: CollaborativeWorkspaceProps) {
  const [roomId, setRoomId] = useState(initialRoomId || generateRandomRoomId());
  const [roomInput, setRoomInput] = useState(roomId);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { toast } = useToast();
  const { user, updateUser } = useUser();
  
  // Join a different room
  const handleJoinRoom = () => {
    if (roomInput && roomInput.trim()) {
      setRoomId(roomInput.trim());
      toast({
        title: 'Room Joined',
        description: `You've joined room: ${roomInput.trim()}`,
      });
    }
  };
  
  // Copy room ID to clipboard
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      toast({
        title: 'Copied to Clipboard',
        description: 'Room ID has been copied to your clipboard.',
      });
    });
  };

  // Update username
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  
  const handleUpdateUsername = () => {
    if (usernameInput && usernameInput.trim()) {
      updateUser({ username: usernameInput.trim() });
      toast({
        title: 'Username Updated',
        description: `Your username is now: ${usernameInput.trim()}`,
      });
    }
  };
  
  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl flex items-center justify-between"><>

          <span>Collaborative Workspace</span>
          <Button
</>
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <PanelRight size={18} /> : <PanelLeft size={18} />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-4 pt-2">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Enter room ID"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleJoinRoom} size="sm">
                Join Room
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Your display name"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleUpdateUsername} size="sm">
                Update Name
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 my-2 text-sm"><>

            <span className="text-muted-foreground">Current Room:</span>
            <code
</> className="bg-muted px-2 py-1 rounded">{roomId}</code>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleCopyRoomId}
              title="Copy room ID"
            >
              <Copy size={14} />
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <Tabs defaultValue="chat">
            <TabsList className="mb-4">
              <TabsTrigger value="chat"><>

                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger
</> value="users"><>

                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger
</> value="map">
                <Map className="h-4 w-4 mr-2" />
                Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="m-0"><>

              <CollaborativeChat roomId={roomId} maxHeight="300px" />
            </TabsContent>
            
            <TabsContent
</> value="users" className="m-0">
              <div className="p-4 bg-muted/20 rounded-md"><>

                <h3 className="font-medium mb-2">Connected Users</h3>
                <p
</> className="text-muted-foreground">This feature will display real-time user presence.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="m-0">
              <div className="p-4 bg-muted/20 rounded-md"><>

                <h3 className="font-medium mb-2">Collaborative Map</h3>
                <p
</> className="text-muted-foreground">This feature will integrate with the map component for real-time collaboration.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

// Helper function to generate a random room ID
function generateRandomRoomId() {
  const prefix = 'room';
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${randomPart}`;
}