import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useYjsCollaboration } from '@/hooks/use-yjs-collaboration';
import { PenTool, Users, Refresh  } from '@mui/icons-material';

interface CollaborativeEditorProps {
  sessionId: string;
  userName: string;
  userColor: string;
}

export function CollaborativeEditor({ sessionId, userName, userColor }: CollaborativeEditorProps) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Set up Y.js collaboration
  const {
    isConnected,
    isLoading,
    error,
    activeUsers,
    updateCursorPosition,
    updateText,
    getText,
    onTextChange,
  } = useYjsCollaboration({
    sessionId,
    userName,
    userColor,
  });
  
  // Local text state
  const [text, setText] = useState('Loading collaborative document...');
  
  // Update text when Y.js text changes
  useEffect(() => {
    if (!isLoading) {
      setText(getText());
      
      const unsubscribe = onTextChange((newText) => {
        setText(newText);
      });
      
      return unsubscribe;
    }
  }, [isLoading, getText, onTextChange]);
  
  // Handle text changes and sync with Y.js
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    updateText(newText);
  }, [updateText]);
  
  // Track mouse position to update cursor awareness
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateCursorPosition(x, y);
    }
  }, [updateCursorPosition]);
  
  // Render cursors for active users
  const renderUserCursors = () => {
    return activeUsers.map((user) => {
      // Convert to string for comparison since user.id is a number
      if (user.position && String(user.id) !== sessionId) {
        return (
          <div
            key={user.id}
            className="absolute pointer-events-none"
            style={{
              left: `${user.position.x}px`,
              top: `${user.position.y}px`,
              zIndex: 50,
            }}
          >
            <div className="relative">
              <div
                className="absolute h-5 w-5 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ backgroundColor: user.color, opacity: 0.5 }}
              />
              <div className="absolute whitespace-nowrap px-2 py-1 text-xs rounded mt-2 -ml-1" 
                style={{ backgroundColor: user.color, color: '#fff' }}>
                {user.name}
              </div>
            </div>
          </div>
        );
      }
      return null;
    });
  };
  
  if (error) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            <span>Collaborative Editor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="text-destructive flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span
>Connection Error: {error}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Unable to connect to the collaboration server. This might happen if the server is not running
              or if you are working in offline mode.
            </p>
            <div className="mt-2">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] resize-y"
                placeholder="You can still edit locally, but changes won't be synchronized with others."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            <span>Collaborative Editor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="flex flex-col items-center gap-2">
            <Refresh className="h-6 w-6 animate-spin" />
            <p>Connecting to collaborative session...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          <span>Collaborative Editor</span>
          {isConnected && (
            <Badge className="ml-2" variant="outline">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Active users ({activeUsers.length}):</span>
            <div className="flex items-center gap-1">
              {activeUsers.map((user) => (
                <div
                  key={user.id}
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div 
            ref={editorRef}
            className="relative min-h-[300px]"
            onMouseMove={handleMouseMove}
          >
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              className="min-h-[300px] resize-y"
              placeholder="Start typing to collaborate..."
            />
            
            {/* User cursors */}
            {renderUserCursors()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}