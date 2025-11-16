import React, { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { sendConversationMessage, resetConversation, addConversationContext } from "@/lib/langchainApi";
import { Permit } from "@/types";
import { AlertCircle, Bot, Refresh, Send, User  } from '@mui/icons-material';

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ConversationalAssistantProps {
  sessionId: string;
  className?: string;
  permitContext?: Permit[];
  currentPermitId?: number;
}

export function ConversationalAssistant({ 
  sessionId, 
  className = "", 
  permitContext = [],
  currentPermitId
}: ConversationalAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate welcome message based on permit context
  useEffect(() => {
    if (!initialLoaded && permitContext && permitContext.length > 0) {
      const contextMessage = permitContext.length === 1 
        ? `I'm ready to help you with information about permit #${permitContext[0].id}.`
        : `I'm ready to help you with information about ${permitContext.length} permits.`;
        
      setMessages([
        {
          id: "welcome",
          content: `Hello! ${contextMessage} What would you like to know?`,
          sender: "assistant",
          timestamp: new Date()
        }
      ]);
      setInitialLoaded(true);
    }
  }, [permitContext, initialLoaded]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ message, permitIds }: { message: string, permitIds?: number[] }) => 
      sendConversationMessage(sessionId, message, permitIds),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          content: data.response,
          sender: "assistant",
          timestamp: new Date()
        }
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: (error as Error)?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Reset conversation mutation
  const resetMutation = useMutation({
    mutationFn: () => {
      const permitIds = permitContext?.map(p => p.id);
      return resetConversation(sessionId, permitIds);
    },
    onSuccess: () => {
      setMessages([
        {
          id: "welcome-reset",
          content: "Conversation has been reset. How can I help you today?",
          sender: "assistant",
          timestamp: new Date()
        }
      ]);
      toast({
        title: "Conversation reset",
        description: "The conversation has been reset successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error resetting conversation",
        description: (error as Error)?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Add permit context mutation
  const addContextMutation = useMutation({
    mutationFn: (permitIds: number[]) => addConversationContext(sessionId, permitIds),
    onSuccess: (data) => {
      toast({
        title: "Context added",
        description: `Added ${data.permitCount} permits to the conversation context.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding context",
        description: (error as Error)?.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Determine if we should include current permit context
    const permitIds = currentPermitId ? [currentPermitId] : undefined;
    
    // Send message to API
    sendMessageMutation.mutate({ message: input, permitIds });
    
    // Clear input
    setInput("");
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  // Add current permit to context if needed
  useEffect(() => {
    if (currentPermitId && initialLoaded) {
      addContextMutation.mutate([currentPermitId]);
    }
  }, [currentPermitId]);

  return (
    <Card className={`flex flex-col h-[600px] border border-primary/20 ${className}`}>
      <CardHeader className="bg-primary/5 pb-3">
        <CardTitle className="flex items-center gap-2 text-xl"><>

          <Bot className="h-5 w-5 text-primary" />
          LangChain Assistant
        </CardTitle>
        <div
</> className="flex justify-between items-center">
          <CardDescription>
            Contextual conversation with memory about permits
          </CardDescription>
          {permitContext && permitContext.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2">
                    {permitContext.length} permit{permitContext.length !== 1 ? 's' : ''} in context
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The assistant has access to these permit details in this conversation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="pt-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>Start a conversation to get help with permit questions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-3 ${
                    msg.sender === "assistant" ? "" : "flex-row-reverse"
                  }`}
                >
                  <Avatar className={msg.sender === "assistant" ? "bg-primary/10" : "bg-secondary"}>
                    {msg.sender === "assistant" ? (
                      <Bot className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                    <AvatarFallback>
                      {msg.sender === "assistant" ? "AI" : "You"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg py-2 px-3 max-w-[80%] ${
                      msg.sender === "assistant" 
                        ? "bg-muted" 
                        : "bg-primary text-primary-foreground"
                    }`}
                  ><>

                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    <div
</> className={`text-[10px] mt-1 ${
                      msg.sender === "assistant" 
                        ? "text-muted-foreground" 
                        : "text-primary-foreground/70"
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </ScrollArea>
      
      <Separator />
      
      <CardFooter className="p-3">
        {sendMessageMutation.isPending && (
          <Alert className="mb-3">
            <Refresh className="h-4 w-4 animate-spin" /><>

            <AlertTitle>Processing</AlertTitle>
            <AlertDescription
</>>
              The assistant is thinking...
            </AlertDescription>
          </Alert>
        )}
        
        {sendMessageMutation.isError && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>>
              {(sendMessageMutation.error as Error)?.message || "Failed to send message. Please try again."}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            title="Reset conversation"
          ><>

            <Refresh className={`h-4 w-4 ${resetMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
          
          <Input
</>
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}