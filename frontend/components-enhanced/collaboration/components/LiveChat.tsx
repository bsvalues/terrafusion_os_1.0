/**
 * Terrafusion OS 1.0 - Live Chat Component
 * Government-Grade Real-Time Messaging
 * 
 * Real-time chat interface with file attachments, mentions,
 * reactions, and government compliance features.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '../../ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import { Send,
  Paperclip,
  Smile,
  MoreVertical,
  Reply,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Angry,
  Download,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Archive,
  Warning,
 } from '@mui/icons-material';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import { useToast } from '../../ui/use-toast';
import {
  ChatMessage,
  MessageType,
  MessageAttachment,
  MessageReaction,
  CollaborationUser,
  CollaborationComponentProps,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface LiveChatProps extends CollaborationComponentProps {
  sessionId: string;
  messages?: ChatMessage[];
  maxHeight?: string;
}

const EMOJI_REACTIONS = [
  { emoji: '👍', name: 'thumbs-up', icon: ThumbsUp },
  { emoji: '👎', name: 'thumbs-down', icon: ThumbsDown },
  { emoji: '❤️', name: 'heart', icon: Heart },
  { emoji: '😂', name: 'laugh', icon: Laugh },
  { emoji: '😠', name: 'angry', icon: Angry },
];

export const LiveChat: React.FC<LiveChatProps> = ({
  className = '',
  sessionId,
  messages: initialMessages = [],
  currentUser,
  maxHeight = 'h-64',
  onUpdate,
  onError,
}) => {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<CollaborationUser[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle real-time message updates
  useEffect(() => {
    const handleMessageReceived = (message: ChatMessage) => {
      if (message.sessionId === sessionId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleUserTyping = (data: { sessionId: string; user: CollaborationUser; isTyping: boolean }) => {
      if (data.sessionId === sessionId && data.user.id !== currentUser?.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return prev.find(u => u.id === data.user.id) ? prev : [...prev, data.user];
          } else {
            return prev.filter(u => u.id !== data.user.id);
          }
        });
      }
    };

    collaborationService.on('message-received', handleMessageReceived);
    collaborationService.on('user-typing', handleUserTyping);

    return () => {
      collaborationService.off('message-received', handleMessageReceived);
      collaborationService.off('user-typing', handleUserTyping);
    };
  }, [sessionId, currentUser?.id]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // In a real implementation, this would send typing status to other users
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Send stop typing status
    }, 1000);
  }, [isTyping]);

  // Send message
  const sendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUser) return;

    try {
      const attachments: MessageAttachment[] = [];
      
      if (selectedFile) {
        // In a real implementation, this would upload the file
        const attachment: MessageAttachment = {
          id: `attachment_${Date.now()}`,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          url: URL.createObjectURL(selectedFile),
        };
        attachments.push(attachment);
      }

      const message: ChatMessage = {
        id: `message_${Date.now()}`,
        sessionId,
        user: currentUser,
        content: newMessage.trim(),
        type: selectedFile ? MessageType.FILE : MessageType.TEXT,
        timestamp: new Date(),
        mentions: extractMentions(newMessage),
        reactions: [],
        attachments,
      };

      await collaborationService.sendMessage(sessionId, newMessage.trim());
      
      // Add message locally for immediate feedback
      setMessages(prev => [...prev, message]);
      
      setNewMessage('');
      setSelectedFile(null);
      setReplyToMessage(null);
      setIsTyping(false);
      
      onUpdate?.(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    }
  }, [newMessage, selectedFile, currentUser, sessionId, toast, onUpdate, onError]);

  // Extract mentions from message text
  const extractMentions = useCallback((text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'image/*',
        'text/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });
      
      if (!isAllowed) {
        toast({
          title: 'File Type Not Allowed',
          description: 'Please select an image, document, or PDF file.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
    
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, [toast]);

  // Add reaction to message
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji && r.user.id === currentUser.id);
        
        if (existingReaction) {
          // Remove reaction
          return {
            ...msg,
            reactions: msg.reactions.filter(r => !(r.emoji === emoji && r.user.id === currentUser.id))
          };
        } else {
          // Add reaction
          const newReaction: MessageReaction = {
            emoji,
            user: currentUser,
            timestamp: new Date(),
          };
          return {
            ...msg,
            reactions: [...msg.reactions, newReaction]
          };
        }
      }
      return msg;
    }));
  }, [currentUser]);

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type === 'application/pdf') return FileText;
    if (type.includes('word') || type.includes('document')) return FileText;
    if (type.includes('excel') || type.includes('sheet')) return FileText;
    return Archive;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Group messages by day
  const groupedMessages = messages.reduce((groups: { date: Date; messages: ChatMessage[] }[], message) => {
    const messageDate = new Date(message.timestamp);
    const lastGroup = groups[groups.length - 1];
    
    if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        date: messageDate,
        messages: [message],
      });
    }
    
    return groups;
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          Live Chat
          <Badge variant="secondary" className="text-xs">
            {messages.length} messages
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages Area */}
        <div className={`${maxHeight} overflow-y-auto px-4 pb-2`}>
          {groupedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" /><>

              <p className="text-sm">No messages yet</p>
              <p
</>
className="text-xs">Start the conversation!</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date.toISOString()}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
                    {format(group.date, 'MMM dd, yyyy')}
                  </div>
                </div>
                
                {/* Messages */}
                {group.messages.map((message /* , index */) => {
                  const isCurrentUser = message.user.id === currentUser?.id;
                  const showAvatar = index === 0 || 
                    group.messages[index - 1].user.id !== message.user.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {message.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex-1 max-w-xs ${isCurrentUser ? 'text-right' : ''}`}>
                        {/* User name and timestamp */}
                        {showAvatar && (
                          <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${
                            isCurrentUser ? 'justify-end' : ''
                          }`}><>

                            <span className="font-medium">{message.user.name}</span>
                            <span
</>
</>>{format(new Date(message.timestamp), 'HH:mm')}</span>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div
                          className={`relative p-3 rounded-lg ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground ml-8'
                              : 'bg-muted mr-8'
                          }`}
                        >
                          {/* Reply indicator */}
                          {replyToMessage && message.id === replyToMessage.id && (
                            <div className="text-xs opacity-75 mb-1 border-l-2 pl-2">
                              Replying to {replyToMessage.user.name}
                            </div>
                          )}
                          
                          {/* Message text */}
                          {message.content && (
                            <p className="text-sm leading-relaxed break-words">
                              {message.content}
                            </p>
                          )}
                          
                          {/* File attachments */}
                          {message.attachments.map((attachment) => {
                            const FileIcon = getFileIcon(attachment.type);
                            
                            return (
                              <div
                                key={attachment.id}
                                className={`mt-2 p-2 rounded border ${
                                  isCurrentUser 
                                    ? 'bg-primary-foreground/10' 
                                    : 'bg-background'
                                } flex items-center gap-2`}
                              >
                                <FileIcon className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0"><>

                                  <p className="text-xs font-medium truncate">
                                    {attachment.name}
                                  </p>
                                  <p
</>
className="text-xs opacity-75">
                                    {formatFileSize(attachment.size)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    // Download file
                                    const a = document.createElement('a');
                                    a.href = attachment.url;
                                    a.download = attachment.name;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                          
                          {/* Message actions */}
                          <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 bg-background border rounded-lg shadow-sm p-1">
                              {/* Reaction buttons */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Smile className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2">
                                  <div className="flex gap-1">
                                    {EMOJI_REACTIONS.map(({ emoji, name }) => (
                                      <Button
                                        key={name}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-base"
                                        onClick={() => addReaction(message.id, emoji)}
                                      >
                                        {emoji}
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              
                              {/* More actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setReplyToMessage(message)}>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                  </DropdownMenuItem>
                                  {isCurrentUser && (
                                    <DropdownMenuItem className="text-red-600">
                                      <Warning className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                        
                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(
                              message.reactions.reduce((acc, reaction) => {
                                if (!acc[reaction.emoji]) {
                                  acc[reaction.emoji] = [];
                                }
                                acc[reaction.emoji].push(reaction.user);
                                return acc;
                              }, {} as Record<string, CollaborationUser[]>)
                            ).map(([emoji, users]) => (
                              <Button
                                key={emoji}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => addReaction(message.id, emoji)}
                              >
                                {emoji} {users.length}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className="flex gap-1"><>

                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div
</>
className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].name} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Reply indicator */}
        {replyToMessage && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="h-4 w-4" />
              <span>Replying to <strong>{replyToMessage.user.name}</strong></span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              ×
            </Button>
          </div>
        )}
        
        {/* Selected file indicator */}
        {selectedFile && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" />
              <span>
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              ×
            </Button>
          </div>
        )}
        
        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,text/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            ><>

              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
</>

              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
            />
            
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveChat;