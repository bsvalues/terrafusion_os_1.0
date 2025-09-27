import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Separator} from '@/components/ui/separator';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {MessageSquare,
  Users,
  Send,
  PlusCircle,
  Settings,
  MoreHorizontal,
  Video,
  Phone,
  Share,
  FileText,
  Image,
  Paperclip,
  Search,
  Bell,
  BellOff,
  Eye,
  UserPlus,
  Crown,
  Shield,
  Hash,
  Calendar,
  Clock,
  MapPin,
  Zap,
  Star,} from '@mui/icons-material';

interface User {id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  role: 'admin' | 'moderator' | 'member' | 'guest';
  lastSeen?: Date;}

interface Message {id: string;
  content: string;
  author: User;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'system' | 'location' | 'analysis';
  edited?: boolean;
  reactions?: Record<string, string[]>;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;}>;
  replyTo?: string;
  threadId?: string;
}

interface Channel {id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'video' | 'analysis';
  isPrivate: boolean;
  memberCount: number;
  unreadCount?: number;
  lastActivity?: Date;
  pinnedMessages?: string[];}

interface CollaborativeChatProps {currentUser: User;
  channels?: Channel[];
  initialChannel?: string;
  onChannelChange?: (channelId: string) => void;
  onUserInvite?: (userId: string) => void;
  onMessageSend?: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  className?: string;}

const CollaborativeChat: React.FC<CollaborativeChatProps> = ({currentUser,
  channels = [],
  initialChannel,
  onChannelChange,
  onUserInvite,
  onMessageSend,
  className = '',}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>(
    initialChannel || channels[0]?.id || 'general'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState<Record<string, User[]>>({});
  const [activeTab, setActiveTab] = useState('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data
  const sampleChannels: Channel[] = [
    {id: 'general',
      name: 'general',
      description: 'General project discussion',
      type: 'text',
      isPrivate: false,
      memberCount: 12,
      unreadCount: 3,
      lastActivity: new Date(),},
    {id: 'analysis',
      name: 'data-analysis',
      description: 'GIS data analysis discussions',
      type: 'analysis',
      isPrivate: false,
      memberCount: 8,
      unreadCount: 1,
      lastActivity: new Date(Date.now() - 3600000),},
    {id: 'fieldwork',
      name: 'field-work',
      description: 'Field collection coordination',
      type: 'text',
      isPrivate: false,
      memberCount: 5,
      lastActivity: new Date(Date.now() - 7200000),},
    {id: 'private-team',
      name: 'core-team',
      description: 'Private team discussions',
      type: 'text',
      isPrivate: true,
      memberCount: 4,
      lastActivity: new Date(Date.now() - 1800000),},
  ];

  const sampleUsers: User[] = [
    {id: 'user-1',
      name: 'Dr. Sarah Chen',
      status: 'online',
      role: 'admin',
      avatar: '/avatars/sarah.jpg',},
    {id: 'user-2',
      name: 'Michael Rodriguez',
      status: 'online',
      role: 'moderator',
      avatar: '/avatars/michael.jpg',},
    {id: 'user-3',
      name: 'Emily Johnson',
      status: 'away',
      role: 'member',
      avatar: '/avatars/emily.jpg',},
    {id: 'user-4',
      name: 'James Wilson',
      status: 'busy',
      role: 'member',
      lastSeen: new Date(Date.now() - 1800000),},
    {id: 'user-5',
      name: 'Lisa Park',
      status: 'offline',
      role: 'guest',
      lastSeen: new Date(Date.now() - 7200000),},
  ];

  const sampleMessages: Message[] = [
    {id: 'msg-1',
      content:
        'Good morning team! The field survey results from yesterday are now available in the shared drive.',
      author: sampleUsers[0],
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',},
    {id: 'msg-2',
      content:
        "Great work on the data collection! I've started the preliminary analysis. Initial patterns look promising.",
      author: sampleUsers[1],
      timestamp: new Date(Date.now() - 3300000),
      type: 'text',
      reactions: { '👍': ['user-2', 'user-3'], '🎉': ['user-1']},
    },
    {id: 'msg-3',
      content:
        "I've uploaded the updated GIS layers with the new coordinate system. Please validate the spatial accuracy.",
      author: sampleUsers[2],
      timestamp: new Date(Date.now() - 2700000),
      type: 'text',
      attachments: [
        {
          id: 'file-1',
          name: 'updated_layers.zip',
          type: 'application/zip',
          size: 15728640,
          url: '/files/updated_layers.zip',},
      ],
    },
    {id: 'msg-4',
      content:
        'Meeting scheduled for 2 PM to review the analysis results. Location: Conference Room B.',
      author: sampleUsers[0],
      timestamp: new Date(Date.now() - 1800000),
      type: 'system',},
    {id: 'msg-5',
      content:
        'The correlation analysis shows significant patterns in the northern region. Should we increase sampling density there?',
      author: sampleUsers[3],
      timestamp: new Date(Date.now() - 900000),
      type: 'analysis',},
  ];

  // Initialize data
  useEffect(() => {setMessages(sampleMessages);
    setOnlineUsers(sampleUsers.filter(user => user.status === 'online'));}, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
  }, [messages]);

  // Handle channel selection
  const handleChannelSelect = (channelId: string) => {setSelectedChannel(channelId);
    if (onChannelChange) {
      onChannelChange(channelId);}
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageInput,
      author: currentUser,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

    if (onMessageSend) {onMessageSend({
        content: messageInput,
        author: currentUser,
        type: 'text',});
    }
  };

  // Handle file attachment
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) =>{
    const file = event.target.files?.[0];
    if (file) {
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: `Shared a file: ${file.name}`,
        author: currentUser,
        timestamp: new Date(),
        type: 'file',
        attachments: [
          {
            id: `file-${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
          },
        ],
      };

      setMessages(prev => [...prev, newMessage]);
    }
  };

  // Handle message reaction
  const handleMessageReaction = (messageId: string, emoji: string) => {setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions};
          if (reactions[emoji]) {if (reactions[emoji].includes(currentUser.id)) {
              reactions[emoji] = reactions[emoji].filter(id => id !== currentUser.id);
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];}
            } else {reactions[emoji].push(currentUser.id);}
          } else {reactions[emoji] = [currentUser.id];}
          return {...msg, reactions};
        }
        return msg;
      })
    );
  };

  // Get status color
  const getStatusColor = (status: User['status']) => {switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';}
  };

  // Get role icon
  const getRoleIcon = (role: User['role']) => {switch (role) {
      case 'admin':
        return<Crown className="h-3 w-3 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-600" />;
      default:
        return null;}
  };

  // Get channel icon
  const getChannelIcon = (channel: Channel) =>{switch (channel.type) {
      case 'voice':
        return<Phone className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'analysis':
        return <FileText className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;}
  };

  // Format time
  const formatTime = (date: Date) =>{return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',});
  };

  // Format file size
  const formatFileSize = (bytes: number) => {const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];};

  const currentChannels = channels.length > 0 ? channels : sampleChannels;
  const currentChannel = currentChannels.find(c => c.id === selectedChannel);

  return (<div className={`h-full flex ${className}`}>{/* Sidebar */}<div className="w-64 border-r bg-gray-50 flex flex-col">{/* Server Header */}<div className="p-4 border-b bg-white"><h2 className="font-semibold text-lg">TerraFusion Project</h2><p className="text-sm text-muted-foreground">GIS Collaboration Hub</p></div>{/* Channels */}<div className="flex-1 overflow-hidden"><ScrollArea className="h-full"><div className="p-2"><div className="mb-4"><div className="flex items-center justify-between mb-2 px-2"><h3 className="text-xs font-medium text-muted-foreground uppercase">Channels</h3><Button size="sm" variant="ghost" className="h-6 w-6 p-0"><PlusCircle className="h-3 w-3" /></Button></div><div className="space-y-1">{currentChannels.map(channel => (<Button
                      key={channel.id}
                      variant={selectedChannel === channel.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="w-full justify-start h-8"
                      onClick={() => handleChannelSelect(channel.id)}
                    ><div className="flex items-center gap-2 flex-1 min-w-0">{getChannelIcon(channel)}<span className="truncate">{channel.name}</span>{channel.isPrivate &&<Eye className="h-3 w-3" />}
                      </div>{channel.unreadCount && channel.unreadCount > 0 && (<Badge variant="destructive" className="ml-auto h-4 text-xs">{channel.unreadCount}</Badge>)}</Button>))}</div></div>{/* Online Users */}
              {showUserList && (<div className="mb-4"><div className="flex items-center justify-between mb-2 px-2"><h3 className="text-xs font-medium text-muted-foreground uppercase">Online — {onlineUsers.length}</h3><Button size="sm" variant="ghost" className="h-6 w-6 p-0"><UserPlus className="h-3 w-3" /></Button></div><div className="space-y-1">{onlineUsers.map(user => (<div
                        key={user.id}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white"
                      ><div className="relative"><Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /><AvatarFallback className="text-xs">{user.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}</AvatarFallback></Avatar><div
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="text-sm truncate">{user.name}</span>{getRoleIcon(user.role)}</div></div></div>))}</div></div>)}</div></ScrollArea></div>{/* User Profile */}<div className="p-3 border-t bg-white"><div className="flex items-center gap-2"><div className="relative"><Avatar className="h-8 w-8"><AvatarImage src={currentUser.avatar} /><AvatarFallback>{currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}</AvatarFallback></Avatar><div
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(currentUser.status)}`} /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{currentUser.name}</p><p className="text-xs text-muted-foreground">{currentUser.status}</p></div><Button size="sm" variant="ghost" className="h-6 w-6 p-0"><Settings className="h-3 w-3" /></Button></div></div></div>{/* Main Chat Area */}<div className="flex-1 flex flex-col min-w-0">{/* Channel Header */}<div className="p-4 border-b bg-white"><div className="flex items-center justify-between"><div className="flex items-center gap-3">{getChannelIcon(currentChannel!)}<div><h2 className="font-semibold">{currentChannel?.name}</h2>{currentChannel?.description && (<p className="text-sm text-muted-foreground">{currentChannel.description}</p>)}</div></div><div className="flex items-center gap-2"><Button size="sm" variant="ghost"><Phone className="h-4 w-4" /></Button><Button size="sm" variant="ghost"><Video className="h-4 w-4" /></Button><Button size="sm" variant="ghost"><Search className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() =>setNotifications(!notifications)}>
                {notifications ?<Bell className="h-4 w-4" />:<BellOff className="h-4 w-4" />}
              </Button><Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></div></div></div>{/* Messages Area */}<ScrollArea className="flex-1 p-4"><div className="space-y-4">{messages.map(message => (<div
                key={message.id}
                className={`flex gap-3 ${message.type === 'system' ? 'justify-center' : ''}`}
              >{message.type !== 'system' && (<Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={message.author.avatar} /><AvatarFallback>{message.author.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}</AvatarFallback></Avatar>)}<div className={`flex-1 min-w-0 ${message.type === 'system' ? 'max-w-md' : ''}`}>{message.type === 'system' ? (<Alert><Calendar className="h-4 w-4" /><AlertDescription>{message.content}</AlertDescription></Alert>) : (<div><div className="flex items-center gap-2 mb-1"><span className="font-medium text-sm">{message.author.name}</span>{getRoleIcon(message.author.role)}<span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>{message.edited && (<Badge variant="outline" className="text-xs">edited</Badge>)}
                        {message.type === 'analysis' && (<Badge variant="secondary" className="text-xs"><FileText className="h-3 w-3 mr-1" />Analysis</Badge>)}</div><div className="text-sm whitespace-pre-wrap mb-2">{message.content}</div>{/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (<div className="space-y-2 mb-2">{message.attachments.map(attachment => (<div
                              key={attachment.id}
                              className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                            ><Paperclip className="h-4 w-4 text-muted-foreground" /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{attachment.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p></div><Button size="sm" variant="outline">Download</Button></div>))}</div>)}

                      {/* Reactions */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (<div className="flex flex-wrap gap-1 mb-2">{Object.entries(message.reactions).map(([emoji, users]) => (<Button
                              key={emoji}
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs"
                              onClick={() =>handleMessageReaction(message.id, emoji)}
                            >
                              {emoji} {users.length}</Button>))}<Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() =>handleMessageReaction(message.id, '👍')}
                          >
                            +</Button></div>)}</div>)}</div></div>))}<div ref={messagesEndRef} /></div></ScrollArea>{/* Message Input */}<div className="p-4 border-t bg-white"><div className="flex items-end gap-2"><input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} /><Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-4 w-4" /></Button><div className="flex-1"><Input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder={`Message #${currentChannel?.name}`}
                onKeyPress={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();}
                }}
                className="resize-none"
              /></div><Button onClick={handleSendMessage} disabled={!messageInput.trim()} size="sm"><Send className="h-4 w-4" /></Button></div>{/* Typing Indicators */}
          {isTyping[selectedChannel] && isTyping[selectedChannel].length > 0 && (<div className="mt-2 text-xs text-muted-foreground">{isTyping[selectedChannel].map(user => user.name).join(', ')}
              {isTyping[selectedChannel].length === 1 ? ' is' : ' are'} typing...</div>)}</div></div></div>
  );
};

export default CollaborativeChat;
