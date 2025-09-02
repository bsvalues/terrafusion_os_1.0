import React, { useState, useRef, useEffect } from 'react';
import { useChatMessaging } from '@/hooks/use-chat-messaging';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, AlertCircle  } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Alert } from '@/components/ui/alert';

interface CollaborativeChatProps {
  roomId: string;
  maxHeight?: string;
  className?: string;
}

export function CollaborativeChat({ 
  roomId, 
  maxHeight = '400px',
  className = ''
}: CollaborativeChatProps) {
  const { messages, sendMessage, connected } = useChatMessaging(roomId);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sendMessage(inputValue)) {
      setInputValue('');
      
      // Focus back on input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };
  
  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg flex items-center"><>

          <span>Room Chat</span>
          <span
</>
className="text-xs ml-2 font-normal opacity-75">
            {connected ? (
              <span className="text-green-500 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                Connected
              </span>
            ) : (
              <span className="text-red-500 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                Disconnected
              </span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2 flex-grow">
        {!connected && (
          <Alert className="mb-3 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <div><>

              <div className="font-medium">Disconnected</div>
              <div
</>
className="text-sm">
                You are currently disconnected from the chat server. Messages cannot be sent until reconnected.
              </div>
            </div>
          </Alert>
        )}
        
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full" 
          style={{ maxHeight }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className="p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex justify-between items-start mb-1"><>

                    <div className="font-medium">{message.username}</div>
                    <div
</>
className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-sm break-words">{message.text}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 pt-1">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!connected || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}