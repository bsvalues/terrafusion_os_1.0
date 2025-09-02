import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollaborativeMapContainer } from "@/components/maps/collaborative-map-container";
import { EnhancedCollaborativeWorkspace } from "@/components/collaborative/enhanced-collaborative-workspace";
import { Users, Share, Plus, ArrowRight  } from '@mui/icons-material';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export function CollaborativeWorkspacePage() {
  const [activeRoomId, setActiveRoomId] = useState<string>("");
  const [newRoomId, setNewRoomId] = useState<string>("");
  const [joinRoomId, setJoinRoomId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    // Load recent rooms from localStorage
    try {
      const saved = localStorage.getItem("bentonGis.recentRooms");
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error("Failed to load recent rooms:", err);
      return [];
    }
  });
  
  // Handle creating a new room
  const handleCreateRoom = () => {
    let roomId = newRoomId.trim();
    
    // Generate a UUID if empty
    if (!roomId) {
      roomId = uuidv4().substring(0, 8);
    }
    
    // Save to recent rooms
    const updatedRooms = [roomId, ...recentRooms.filter(r => r !== roomId)].slice(0, 5);
    setRecentRooms(updatedRooms);
    localStorage.setItem("bentonGis.recentRooms", JSON.stringify(updatedRooms));
    
    // Set as active room
    setActiveRoomId(roomId);
    
    // Reset and close dialog
    setNewRoomId("");
    setCreateDialogOpen(false);
    
    // Show toast
    toast({
      title: "Room created",
      description: `You've created and joined room: ${roomId}`,
    });
  };
  
  // Handle joining an existing room
  const handleJoinRoom = () => {
    const roomId = joinRoomId.trim();
    
    if (!roomId) {
      toast({
        title: "Room ID required",
        description: "Please enter a room ID to join",
        variant: "destructive",
      });
      return;
    }
    
    // Save to recent rooms
    const updatedRooms = [roomId, ...recentRooms.filter(r => r !== roomId)].slice(0, 5);
    setRecentRooms(updatedRooms);
    localStorage.setItem("bentonGis.recentRooms", JSON.stringify(updatedRooms));
    
    // Set as active room
    setActiveRoomId(roomId);
    
    // Reset and close dialog
    setJoinRoomId("");
    setJoinDialogOpen(false);
    
    // Show toast
    toast({
      title: "Room joined",
      description: `You've joined room: ${roomId}`,
    });
  };
  
  // Handle leaving the current room
  const handleLeaveRoom = () => {
    setActiveRoomId("");
    
    toast({
      title: "Room left",
      description: "You've left the collaborative room",
    });
  };
  
  // Handle joining a recent room
  const handleJoinRecentRoom = (roomId: string) => {
    // Move this room to the top of the list
    const updatedRooms = [roomId, ...recentRooms.filter(r => r !== roomId)].slice(0, 5);
    setRecentRooms(updatedRooms);
    localStorage.setItem("bentonGis.recentRooms", JSON.stringify(updatedRooms));
    
    // Set as active room
    setActiveRoomId(roomId);
    
    // Show toast
    toast({
      title: "Room joined",
      description: `You've joined room: ${roomId}`,
    });
  };
  
  // Handle copying room ID to clipboard
  const handleCopyRoomId = () => {
    if (!activeRoomId) return;
    
    navigator.clipboard.writeText(activeRoomId)
      .then(() => {
        toast({
          title: "Room ID copied",
          description: "Room ID has been copied to clipboard",
        });
      })
      .catch((err) => {
        console.error("Failed to copy room ID:", err);
        toast({
          title: "Failed to copy",
          description: "Could not copy room ID to clipboard",
          variant: "destructive",
        });
      });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2"><>

        <h1 className="text-3xl font-bold tracking-tight">Collaborative Workspace</h1>
        <p
</>
className="text-muted-foreground">
          Create or join a room to collaborate with others in real-time
        </p>
      </div>
      
      {!activeRoomId ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Create new room card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <Plus className="mr-2 h-5 w-5" />
                Create New Room
              </CardTitle>
              <CardDescription
</>
</>>
                Start a new collaborative mapping session
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><>

                    <DialogTitle>Create a new room</DialogTitle>
                    <DialogDescription
</>
</>>
                      Enter a custom room ID or leave blank to generate one automatically
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 py-4"><>

                    <Input
                      placeholder="Custom room ID (optional)"
                      value={newRoomId}
                      onChange={(e) => setNewRoomId(e.target.value)}
                    />
                  </div>
                  <DialogFooter
</>
</>>
                    <Button onClick={handleCreateRoom}>
                      Create & Join
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          {/* Join existing room card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><>

                <Users className="mr-2 h-5 w-5" />
                Join Existing Room
              </CardTitle>
              <CardDescription
</>
</>>
                Join an ongoing collaborative session
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Join Room</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><>

                    <DialogTitle>Join an existing room</DialogTitle>
                    <DialogDescription
</>
</>>
                      Enter the room ID to join an existing collaborative session
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center space-x-2 py-4"><>

                    <Input
                      placeholder="Room ID"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value)}
                    />
                  </div>
                  <DialogFooter
</>
</>>
                    <Button onClick={handleJoinRoom}>
                      Join Room
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          {/* Recent rooms card */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader><>

              <CardTitle>Recent Rooms</CardTitle>
              <CardDescription
</>
</>>
                Quickly rejoin your recent collaborative sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentRooms.length > 0 ? (
                <div className="space-y-2">
                  {recentRooms.map((room) => (
                    <div key={room} className="flex items-center justify-between p-2 border rounded-md"><>

                      <span className="text-sm font-medium">{room}</span>
                      <Button
</>

                        variant="ghost"
                        size="sm"
                        onClick={() => handleJoinRecentRoom(room)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No recent rooms found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4"><>

              <Button variant="outline" onClick={handleLeaveRoom}>
                Leave Room
              </Button>
              <h2
</>
className="text-xl font-semibold">
                Room: {activeRoomId}
              </h2>
            </div>
            
            <Button variant="outline" size="sm" onClick={handleCopyRoomId}>
              <Share className="h-4 w-4 mr-2" />
              Share Room ID
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4"><>

              <EnhancedCollaborativeWorkspace 
                roomId={activeRoomId} 
                height={650}
              />
            </CardContent>
            <CardFooter
</>
className="text-sm text-muted-foreground">
              All changes are synchronized in real-time with other collaborators
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}