import { useState, useEffect, useRef } from 'react';
import { CollaborationSession, PermitComment } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { Sparkles, PenTool, MessageSquare, Users  } from '@mui/icons-material';
import { ParticipantsList } from './ParticipantsList';
import { PermitComments } from './PermitComments';
import { CollaborativeEditor } from './CollaborativeEditor';
import { Separator } from '@/components/ui/separator';
import { useCollaboration } from '@/hooks/use-collaboration';
import { useYjsCollaboration } from '@/hooks/use-yjs-collaboration';

interface CollaborationPanelProps {
  uploadId: number;
  selectedPermitId?: number;
}

export function CollaborationPanel({ uploadId, selectedPermitId }: CollaborationPanelProps) {
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Generate a consistent color for the user
  const userColorRef = useRef<string>('');
  if (!userColorRef.current) {
    const colors = [
      '#F87171', // red
      '#FB923C', // orange
      '#FBBF24', // amber
      '#34D399', // emerald
      '#60A5FA', // blue
      '#A78BFA', // violet
      '#F472B6', // pink
    ];
    userColorRef.current = colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Initialize our collaboration hooks with default values
  // These will only be active when the user is connected
  const collaboration = useCollaboration({
    uploadId,
    userName: userName.trim(),
    onEvent: (event) => {
      console.log('Collaboration event:', event);
    },
    enabled: isConnected
  });
  
  // Only activate Y.js collaboration when we have a session
  const yjsCollaboration = useYjsCollaboration({
    sessionId: collaboration.session?.id || '',
    userName: userName.trim(),
    userColor: userColorRef.current,
    enabled: isConnected && !!collaboration.session
  });
  
  const handleJoin = () => {
    if (!userName.trim()) return;
    
    setIsJoining(true);
    
    try {
      // This will activate our hooks above
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
    } finally {
      setIsJoining(false);
    }
  };
  
  // If not connected, show join form
  if (!isConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>Join Collaboration Session</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Collaborate with others in real-time to review this permit upload
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2"><>

              <label htmlFor="userName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
</>
                id="userName"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleJoin} 
              disabled={!userName.trim() || isJoining}
              className="w-full"
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If connected but no collaboration hook, show error
  if (!collaboration) {
    return (
      <Alert variant="destructive">
        <FaExclamationTriangle className="h-4 w-4" />
        <AlertDescription>
          <div>Failed to initialize collaboration session</div>
        </AlertDescription>
      </Alert>
    );
  }
  
  const { 
    session, 
    userId, 
    userColor, 
    participants, 
    comments, 
    error,
    addComment,
    focusPermit,
  } = collaboration;
  
  // If no permit is selected, focus on participants
  const defaultTab = selectedPermitId ? "comments" : "participants";
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // When a permit is selected, focus on it
  useEffect(() => {
    if (selectedPermitId && session?.activePermitId !== selectedPermitId) {
      focusPermit(selectedPermitId);
    }
    
    if (selectedPermitId) {
      setActiveTab("comments");
    }
  }, [selectedPermitId, session, focusPermit]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span>Collaboration Session</span>
        </CardTitle>
        {error && (
          <Alert variant="destructive" className="mt-2">
            <FaExclamationTriangle className="h-4 w-4" />
            <AlertDescription><div>{error}</div></AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="participants"><>

              <Users className="h-4 w-4 mr-2" />
              Participants
            </TabsTrigger>
            <TabsTrigger
</> value="comments" disabled={!selectedPermitId}><>

              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </TabsTrigger>
            <TabsTrigger
</> value="editor">
              <PenTool className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <TabsContent value="participants"><>

              <ParticipantsList 
                participants={participants} 
                currentUserId={userId}
              />
            </TabsContent>
            
            <TabsContent
</> value="comments">
              {selectedPermitId ? (
                <PermitComments
                  comments={comments}
                  permitId={selectedPermitId}
                  currentUserId={userId}
                  currentUserColor={userColor}
                  onAddComment={addComment}
                />
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  Select a permit to view and add comments
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="editor">
              {session ? (
                yjsCollaboration ? (
                  <CollaborativeEditor 
                    sessionId={session.id}
                    userName={userName}
                    userColor={userColor || '#60A5FA'}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">
                      Initializing collaborative editor...
                    </p>
                  </div>
                )
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No active session found
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}