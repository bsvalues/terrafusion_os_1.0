import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, 
  FolderOpen, 
  Trash2, 
  Clock,
  AlertCircle
 } from '@mui/icons-material';
import { toast } from "@/hooks/use-toast";
import { CollaborativeFeature } from "./collaborative-map";

// Session data structure
export interface SessionData {
  name: string;
  description?: string;
  features: CollaborativeFeature[];
  annotations: any[];
  timestamp: string;
  center: [number, number];
  zoom: number;
}

// Props for the component
export interface CollaborativeSessionManagerProps {
  roomId: string;
  onSave: (name: string, description?: string) => SessionData;
  onLoad: (sessionName: string) => SessionData | null;
}

// Component for managing collaborative sessions
export function CollaborativeSessionManager({
  roomId,
  onSave,
  onLoad
}: CollaborativeSessionManagerProps) {
  // State for the component
  const [sessionName, setSessionName] = useState<string>("");
  const [sessionDescription, setSessionDescription] = useState<string>("");
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sessionDetails, setSessionDetails] = useState<SessionData | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState<boolean>(false);
  
  // Load list of saved sessions on component mount
  useEffect(() => {
    loadSavedSessionsList();
  }, [roomId]);
  
  // Function to load list of saved sessions
  const loadSavedSessionsList = () => {
    try {
      // Check local storage for saved sessions
      const sessionsKey = `bentonGis.sessions.${roomId}`;
      const sessionsJson = localStorage.getItem(sessionsKey);
      
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        setSavedSessions(Object.keys(sessions));
      } else {
        setSavedSessions([]);
      }
    } catch (err) {
      console.error('Error loading sessions list:', err);
      setSavedSessions([]);
    }
  };
  
  // Function to handle save session dialog submission
  const handleSaveSession = () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for your session",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Save session to local storage
      const sessionData = onSave(sessionName, sessionDescription);
      const sessionsKey = `bentonGis.sessions.${roomId}`;
      
      // Get existing sessions or initialize empty object
      const sessionsJson = localStorage.getItem(sessionsKey);
      const sessions = sessionsJson ? JSON.parse(sessionsJson) : {};
      
      // Add or update session
      sessions[sessionName] = sessionData;
      
      // Save back to local storage
      localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      
      // Update saved sessions list
      loadSavedSessionsList();
      
      // Close dialog and reset form
      setSaveDialogOpen(false);
      setSessionName("");
      setSessionDescription("");
      
      // Show success toast
      toast({
        title: "Session saved",
        description: `Session "${sessionName}" has been saved`,
        variant: "default"
      });
    } catch (err) {
      console.error('Error saving session:', err);
      toast({
        title: "Error saving session",
        description: `An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Function to handle session selection
  const handleSessionSelect = (value: string) => {
    setSelectedSession(value);
    
    try {
      // Load session details from local storage
      const sessionsKey = `bentonGis.sessions.${roomId}`;
      const sessionsJson = localStorage.getItem(sessionsKey);
      
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        if (sessions[value]) {
          setSessionDetails(sessions[value]);
        } else {
          setSessionDetails(null);
        }
      }
    } catch (err) {
      console.error('Error loading session details:', err);
      setSessionDetails(null);
    }
  };
  
  // Function to handle loading a session
  const handleLoadSession = () => {
    if (!selectedSession) {
      toast({
        title: "No session selected",
        description: "Please select a session to load",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Call the onLoad callback
      const loadedData = onLoad(selectedSession);
      
      if (loadedData) {
        // Close dialog and reset selection
        setLoadDialogOpen(false);
        setSelectedSession("");
        setSessionDetails(null);
        
        // Show success toast
        toast({
          title: "Session loaded",
          description: `Session "${selectedSession}" has been loaded`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error loading session",
          description: "Failed to load the selected session",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error loading session:', err);
      toast({
        title: "Error loading session",
        description: `An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Function to delete a session
  const handleDeleteSession = () => {
    if (!selectedSession) return;
    
    try {
      // Remove session from local storage
      const sessionsKey = `bentonGis.sessions.${roomId}`;
      const sessionsJson = localStorage.getItem(sessionsKey);
      
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        if (sessions[selectedSession]) {
          delete sessions[selectedSession];
          localStorage.setItem(sessionsKey, JSON.stringify(sessions));
          
          // Update saved sessions list
          loadSavedSessionsList();
          
          // Reset selection
          setSelectedSession("");
          setSessionDetails(null);
          
          // Show success toast
          toast({
            title: "Session deleted",
            description: `Session "${selectedSession}" has been deleted`,
            variant: "default"
          });
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      toast({
        title: "Error deleting session",
        description: `An error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <Card className="w-auto">
      <CardHeader className="py-3"><>

        <CardTitle className="text-sm font-medium">Session Management</CardTitle>
        <CardDescription
</>
className="text-xs text-muted-foreground">
          Save and load map sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2 space-y-4">
        {/* Save Session Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setSaveDialogOpen(true)}
            >
              <Save className="mr-2 h-4 w-4" />
              <span>Save Session</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><>

              <DialogTitle>Save Session</DialogTitle>
              <DialogDescription
</>
</>>
                Save the current map state to return to it later.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><>

                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
</>

                  id="name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="My Session"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4"><>

                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
</>

                  id="description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Optional description"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter><>

              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
</>
onClick={handleSaveSession}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Load Session Dialog */}
        <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setLoadDialogOpen(true)}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Load Session</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader><>

              <DialogTitle>Load Session</DialogTitle>
              <DialogDescription
</>
</>>
                Select a previously saved session to load.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><>

                <Label htmlFor="session" className="text-right">
                  Session
                </Label>
                <div
</>
className="col-span-3">
                  {savedSessions.length > 0 ? (
                    <Select
                      value={selectedSession}
                      onValueChange={handleSessionSelect}
                    >
                      <SelectTrigger><>

                        <SelectValue placeholder="Select a session" />
                      </SelectTrigger>
                      <SelectContent
</>
</>>
                        {savedSessions.map((session) => (
                          <SelectItem key={session} value={session}>
                            {session}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                      <AlertCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">No saved sessions</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Session details */}
              {sessionDetails && (
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium">{sessionDetails.name}</div>
                  {sessionDetails.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {sessionDetails.description}
                    </div>
                  )}
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Saved: {formatDate(sessionDetails.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-xs"><>

                    <span className="text-muted-foreground">Features: </span>
                    <span
</>
</>>{sessionDetails.features.length}</span>
                  </div>
                  <div className="mt-1 text-xs"><>

                    <span className="text-muted-foreground">Annotations: </span>
                    <span
</>
</>>{sessionDetails.annotations.length}</span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeleteSession}
                disabled={!selectedSession}
              ><>

                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <div
</>
className="space-x-2"><>

                <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
</>

                  onClick={handleLoadSession}
                  disabled={!selectedSession}
                >
                  Load
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="py-2 px-6 text-xs text-muted-foreground">
        Sessions are stored locally in your browser
      </CardFooter>
    </Card>
  );
}