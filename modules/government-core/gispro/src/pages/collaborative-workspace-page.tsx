import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useEnhancedWebSocket, MessageTypeEnum } from '@/hooks/use-enhanced-websocket';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  Settings, 
  Activity, 
  Clock, 
  Send,
  Plus,
  Eye,
  Edit,
  Save,
  UserPlus
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  role: 'admin' | 'editor' | 'viewer';
}

interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  modifiedBy: string;
  version: number;
  locked: boolean;
  lockedBy?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'notification';
}

interface WorkspaceActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: Date;
}

export default function CollaborativeWorkspacePage() {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedTab, setSelectedTab] = useState('documents');
  const [workspaceSettings, setWorkspaceSettings] = useState({
    name: 'GIS Project Workspace',
    description: 'Collaborative environment for GIS data processing and analysis',
    isPublic: false,
    allowGuestAccess: false
  });

  const currentUser: User = {
    id: 'current-user',
    name: 'John Smith',
    email: 'john.smith@bentoncounty.org',
    status: 'online',
    lastSeen: new Date(),
    role: 'admin'
  };

  // WebSocket for real-time collaboration
  const { send, messages, participants, connected } = useEnhancedWebSocket({
    roomId: 'workspace-main',
    autoConnect: true,
    onMessage: handleWebSocketMessage
  });

  // Initialize sample data
  useEffect(() => {
    const sampleUsers: User[] = [
      {
        id: 'user-1',
        name: 'Alice Johnson',
        email: 'alice.johnson@bentoncounty.org',
        status: 'online',
        lastSeen: new Date(),
        role: 'editor'
      },
      {
        id: 'user-2',
        name: 'Bob Wilson',
        email: 'bob.wilson@bentoncounty.org',
        status: 'online',
        lastSeen: new Date(Date.now() - 300000),
        role: 'editor'
      },
      {
        id: 'user-3',
        name: 'Carol Davis',
        email: 'carol.davis@bentoncounty.org',
        status: 'away',
        lastSeen: new Date(Date.now() - 900000),
        role: 'viewer'
      }
    ];

    const sampleDocuments: Document[] = [
      {
        id: 'doc-1',
        title: 'Project Requirements Document',
        content: 'This document outlines the requirements for the GIS data migration project...',
        lastModified: new Date(Date.now() - 3600000),
        modifiedBy: 'Alice Johnson',
        version: 3,
        locked: false
      },
      {
        id: 'doc-2',
        title: 'Data Processing Guidelines',
        content: 'Guidelines for processing and validating GIS datasets...',
        lastModified: new Date(Date.now() - 7200000),
        modifiedBy: 'Bob Wilson',
        version: 2,
        locked: true,
        lockedBy: 'Bob Wilson'
      },
      {
        id: 'doc-3',
        title: 'Quality Assurance Checklist',
        content: 'Comprehensive checklist for ensuring data quality...',
        lastModified: new Date(Date.now() - 1800000),
        modifiedBy: 'John Smith',
        version: 1,
        locked: false
      }
    ];

    const sampleMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        userId: 'user-1',
        userName: 'Alice Johnson',
        message: 'Good morning everyone! Ready to tackle the data migration today.',
        timestamp: new Date(Date.now() - 1800000),
        type: 'text'
      },
      {
        id: 'msg-2',
        userId: 'user-2',
        userName: 'Bob Wilson',
        message: 'I\'ve updated the processing guidelines. Please review when you have a chance.',
        timestamp: new Date(Date.now() - 1200000),
        type: 'text'
      },
      {
        id: 'msg-3',
        userId: 'current-user',
        userName: 'John Smith',
        message: 'Thanks Bob! I\'ll take a look at the changes shortly.',
        timestamp: new Date(Date.now() - 600000),
        type: 'text'
      }
    ];

    const sampleActivities: WorkspaceActivity[] = [
      {
        id: 'activity-1',
        userId: 'user-1',
        userName: 'Alice Johnson',
        action: 'joined the workspace',
        target: '',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        id: 'activity-2',
        userId: 'user-2',
        userName: 'Bob Wilson',
        action: 'updated document',
        target: 'Data Processing Guidelines',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 'activity-3',
        userId: 'current-user',
        userName: 'John Smith',
        action: 'created document',
        target: 'Quality Assurance Checklist',
        timestamp: new Date(Date.now() - 1800000)
      }
    ];

    setActiveUsers([currentUser, ...sampleUsers]);
    setDocuments(sampleDocuments);
    setChatMessages(sampleMessages);
    setActivities(sampleActivities);
  }, []);

  // Handle WebSocket messages
  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case MessageTypeEnum.CHAT_MESSAGE:
        if (message.data.message) {
          addChatMessage(message.data);
        }
        break;
      
      case MessageTypeEnum.DOCUMENT_UPDATE:
        if (message.data.document) {
          updateDocument(message.data.document);
        }
        break;
      
      case MessageTypeEnum.USER_ACTIVITY:
        if (message.data.activity) {
          addActivity(message.data.activity);
        }
        break;
    }
  }

  // Add chat message
  const addChatMessage = (messageData: ChatMessage) => {
    setChatMessages(prev => [...prev, messageData]);
  };

  // Update document
  const updateDocument = (updatedDocument: Document) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
  };

  // Add activity
  const addActivity = (activity: WorkspaceActivity) => {
    setActivities(prev => [activity, ...prev.slice(0, 9)]);
  };

  // Send chat message
  const sendChatMessage = () => {
    if (!chatInput.trim() || !connected) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      message: chatInput.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    // Add locally
    addChatMessage(message);

    // Broadcast to other users
    send({
      type: MessageTypeEnum.CHAT_MESSAGE,
      data: { message }
    });

    setChatInput('');
  };

  // Start editing document
  const startEditing = (document: Document) => {
    if (document.locked && document.lockedBy !== currentUser.name) {
      return; // Document is locked by someone else
    }

    setSelectedDocument(document);
    setDocumentContent(document.content);
    setIsEditing(true);

    // Lock document
    const updatedDoc = {
      ...document,
      locked: true,
      lockedBy: currentUser.name
    };
    updateDocument(updatedDoc);

    // Broadcast document lock
    send({
      type: MessageTypeEnum.DOCUMENT_UPDATE,
      data: { document: updatedDoc }
    });
  };

  // Save document
  const saveDocument = () => {
    if (!selectedDocument) return;

    const updatedDoc: Document = {
      ...selectedDocument,
      content: documentContent,
      lastModified: new Date(),
      modifiedBy: currentUser.name,
      version: selectedDocument.version + 1,
      locked: false,
      lockedBy: undefined
    };

    updateDocument(updatedDoc);
    setSelectedDocument(updatedDoc);
    setIsEditing(false);

    // Broadcast update
    send({
      type: MessageTypeEnum.DOCUMENT_UPDATE,
      data: { document: updatedDoc }
    });

    // Add activity
    const activity: WorkspaceActivity = {
      id: `activity-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'updated document',
      target: selectedDocument.title,
      timestamp: new Date()
    };
    addActivity(activity);

    // Broadcast activity
    send({
      type: MessageTypeEnum.USER_ACTIVITY,
      data: { activity }
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    if (!selectedDocument) return;

    // Unlock document
    const updatedDoc = {
      ...selectedDocument,
      locked: false,
      lockedBy: undefined
    };
    updateDocument(updatedDoc);

    // Broadcast unlock
    send({
      type: MessageTypeEnum.DOCUMENT_UPDATE,
      data: { document: updatedDoc }
    });

    setIsEditing(false);
    setSelectedDocument(null);
    setDocumentContent('');
  };

  // Create new document
  const createDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: 'New Document',
      content: 'Start typing your content here...',
      lastModified: new Date(),
      modifiedBy: currentUser.name,
      version: 1,
      locked: false
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocument(newDoc);
    setDocumentContent(newDoc.content);
    setIsEditing(true);
  };

  // Get status color
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workspaceSettings.name}</h1>
          <p className="text-muted-foreground">{workspaceSettings.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Live' : 'Offline'}
          </Badge>
          <Badge variant="outline">
            {activeUsers.filter(u => u.status === 'online').length} Online
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Workspace Documents</h2>
                <Button onClick={createDocument}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </div>

              <div className="grid gap-4">
                {documents.map(doc => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {doc.content.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>Modified by {doc.modifiedBy}</span>
                            <span>{formatRelativeTime(doc.lastModified)}</span>
                            <span>v{doc.version}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {doc.locked && (
                            <Badge variant="secondary" className="text-xs">
                              Locked by {doc.lockedBy}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setDocumentContent(doc.content);
                              setSelectedTab('editor');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startEditing(doc)}
                            disabled={doc.locked && doc.lockedBy !== currentUser.name}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-4">
              {selectedDocument ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedDocument.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button onClick={saveDocument} size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button onClick={cancelEditing} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => startEditing(selectedDocument)} size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        className="min-h-[400px] font-mono"
                        placeholder="Start typing your content..."
                      />
                    ) : (
                      <div className="min-h-[400px] p-4 border rounded-md bg-gray-50">
                        <pre className="whitespace-pre-wrap font-sans">{documentContent}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Document Selected</h3>
                    <p className="text-muted-foreground">
                      Select a document from the Documents tab to view or edit it.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {activity.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.userName}</span>{' '}
                            {activity.action}
                            {activity.target && (
                              <span className="font-medium"> {activity.target}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Workspace Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workspaceName">Workspace Name</Label>
                    <Input
                      id="workspaceName"
                      value={workspaceSettings.name}
                      onChange={(e) => setWorkspaceSettings(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workspaceDescription">Description</Label>
                    <Textarea
                      id="workspaceDescription"
                      value={workspaceSettings.description}
                      onChange={(e) => setWorkspaceSettings(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={workspaceSettings.isPublic}
                        onChange={(e) => setWorkspaceSettings(prev => ({
                          ...prev,
                          isPublic: e.target.checked
                        }))}
                      />
                      Public workspace
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={workspaceSettings.allowGuestAccess}
                        onChange={(e) => setWorkspaceSettings(prev => ({
                          ...prev,
                          allowGuestAccess: e.target.checked
                        }))}
                      />
                      Allow guest access
                    </label>
                  </div>

                  <Button>Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Active Users ({activeUsers.filter(u => u.status === 'online').length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Users
              </Button>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4" />
                Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                {chatMessages.slice(-10).map(message => (
                  <div key={message.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">{message.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="text-sm"
                />
                <Button size="sm" onClick={sendChatMessage} disabled={!chatInput.trim() || !connected}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Workspace Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Documents</span>
                <span className="font-medium">{documents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active Users</span>
                <span className="font-medium">{activeUsers.filter(u => u.status === 'online').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Messages Today</span>
                <span className="font-medium">{chatMessages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Activity</span>
                <span className="font-medium">
                  {activities.length > 0 ? formatRelativeTime(activities[0].timestamp) : 'None'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
