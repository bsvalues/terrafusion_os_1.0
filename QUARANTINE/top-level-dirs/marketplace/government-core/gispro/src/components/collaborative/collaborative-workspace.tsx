import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  Share, 
  Video, 
  MessageSquare,
  FileText,
  Map,
  BarChart3,
  Settings,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Hand,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  History,
  Clock,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Layers,
  Target,
  Navigation
} from '@mui/icons-material';

import CollaborativeCursors from './collaborative-cursors';
import CollaborativeChat from './collaborative-chat';

interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';
  permissions: string[];
  lastActivity?: Date;
}

interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'analysis' | 'annotation';
  visible: boolean;
  locked: boolean;
  owner: User;
  collaborators: User[];
  opacity: number;
  lastModified: Date;
  changeHistory: Array<{
    id: string;
    action: string;
    user: User;
    timestamp: Date;
    description: string;
  }>;
}

interface WorkspaceProject {
  id: string;
  name: string;
  description?: string;
  owner: User;
  collaborators: User[];
  layers: Layer[];
  permissions: {
    canEdit: string[];
    canView: string[];
    canComment: string[];
    canShare: string[];
  };
  settings: {
    allowPublicView: boolean;
    requireApproval: boolean;
    enableChat: boolean;
    enableCursors: boolean;
    autoSave: boolean;
    versionControl: boolean;
  };
  lastModified: Date;
  version: number;
}

interface CollaborativeWorkspaceProps {
  currentUser: User;
  project?: WorkspaceProject;
  onUserInvite?: (email: string, role: User['role']) => void;
  onUserRemove?: (userId: string) => void;
  onRoleChange?: (userId: string, role: User['role']) => void;
  onLayerUpdate?: (layerId: string, updates: Partial<Layer>) => void;
  onProjectSave?: (project: WorkspaceProject) => void;
  className?: string;
}

const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  currentUser,
  project,
  onUserInvite,
  onUserRemove,
  onRoleChange,
  onLayerUpdate,
  onProjectSave,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('workspace');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showCursors, setShowCursors] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('viewer');
  const [activityFeed, setActivityFeed] = useState<Array<{
    id: string;
    user: User;
    action: string;
    timestamp: Date;
    details?: string;
  }>>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Sample project data
  const sampleProject: WorkspaceProject = {
    id: 'project-1',
    name: 'TerraFusion Environmental Study',
    description: 'Collaborative GIS analysis of environmental impact zones',
    owner: currentUser,
    collaborators: [
      {
        id: 'user-1',
        name: 'Dr. Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        color: '#3B82F6',
        status: 'online',
        role: 'admin',
        permissions: ['edit', 'view', 'comment', 'share'],
        lastActivity: new Date()
      },
      {
        id: 'user-2',
        name: 'Michael Rodriguez',
        avatar: '/avatars/michael.jpg',
        color: '#EF4444',
        status: 'online',
        role: 'editor',
        permissions: ['edit', 'view', 'comment'],
        lastActivity: new Date(Date.now() - 300000)
      },
      {
        id: 'user-3',
        name: 'Emily Johnson',
        color: '#10B981',
        status: 'away',
        role: 'editor',
        permissions: ['edit', 'view', 'comment'],
        lastActivity: new Date(Date.now() - 1800000)
      },
      {
        id: 'user-4',
        name: 'James Wilson',
        color: '#F59E0B',
        status: 'busy',
        role: 'viewer',
        permissions: ['view', 'comment'],
        lastActivity: new Date(Date.now() - 3600000)
      }
    ],
    layers: [
      {
        id: 'layer-1',
        name: 'Study Area Boundaries',
        type: 'vector',
        visible: true,
        locked: false,
        owner: currentUser,
        collaborators: [],
        opacity: 0.8,
        lastModified: new Date(),
        changeHistory: []
      },
      {
        id: 'layer-2',
        name: 'Environmental Sensors',
        type: 'vector',
        visible: true,
        locked: true,
        owner: currentUser,
        collaborators: [],
        opacity: 1.0,
        lastModified: new Date(Date.now() - 3600000),
        changeHistory: []
      },
      {
        id: 'layer-3',
        name: 'Analysis Results',
        type: 'analysis',
        visible: false,
        locked: false,
        owner: currentUser,
        collaborators: [],
        opacity: 0.7,
        lastModified: new Date(Date.now() - 7200000),
        changeHistory: []
      }
    ],
    permissions: {
      canEdit: ['user-1', 'user-2', 'user-3'],
      canView: ['user-1', 'user-2', 'user-3', 'user-4'],
      canComment: ['user-1', 'user-2', 'user-3', 'user-4'],
      canShare: ['user-1', 'user-2']
    },
    settings: {
      allowPublicView: false,
      requireApproval: true,
      enableChat: true,
      enableCursors: true,
      autoSave: true,
      versionControl: true
    },
    lastModified: new Date(),
    version: 1
  };

  const currentProject = project || sampleProject;

  // Initialize activity feed
  useEffect(() => {
    const initialActivity = [
      {
        id: 'activity-1',
        user: currentProject.collaborators[0],
        action: 'joined the workspace',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: 'activity-2',
        user: currentProject.collaborators[1],
        action: 'updated layer "Environmental Sensors"',
        timestamp: new Date(Date.now() - 2700000),
        details: 'Added 15 new sensor locations'
      },
      {
        id: 'activity-3',
        user: currentProject.collaborators[2],
        action: 'left a comment',
        timestamp: new Date(Date.now() - 1800000),
        details: 'Suggested changes to analysis parameters'
      },
      {
        id: 'activity-4',
        user: currentProject.owner,
        action: 'saved the project',
        timestamp: new Date(Date.now() - 900000)
      }
    ];
    setActivityFeed(initialActivity);
  }, [currentProject]);

  // Auto-save functionality
  useEffect(() => {
    if (currentProject.settings.autoSave) {
      const interval = setInterval(() => {
        setIsAutoSaving(true);
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
          if (onProjectSave) {
            onProjectSave(currentProject);
          }
        }, 1000);
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentProject, onProjectSave]);

  // Handle user invitation
  const handleInviteUser = () => {
    if (inviteEmail && onUserInvite) {
      onUserInvite(inviteEmail, inviteRole);
      setInviteEmail('');
      
      // Add to activity feed
      setActivityFeed(prev => [{
        id: `activity-${Date.now()}`,
        user: currentUser,
        action: 'invited a new user',
        timestamp: new Date(),
        details: `${inviteEmail} as ${inviteRole}`
      }, ...prev]);
    }
  };

  // Handle role change
  const handleRoleChange = (userId: string, newRole: User['role']) => {
    if (onRoleChange) {
      onRoleChange(userId, newRole);
    }
    
    const user = currentProject.collaborators.find(u => u.id === userId);
    if (user) {
      setActivityFeed(prev => [{
        id: `activity-${Date.now()}`,
        user: currentUser,
        action: 'changed user role',
        timestamp: new Date(),
        details: `${user.name} is now ${newRole}`
      }, ...prev]);
    }
  };

  // Handle layer visibility toggle
  const handleLayerVisibility = (layerId: string) => {
    const layer = currentProject.layers.find(l => l.id === layerId);
    if (layer && onLayerUpdate) {
      onLayerUpdate(layerId, { visible: !layer.visible });
      
      setActivityFeed(prev => [{
        id: `activity-${Date.now()}`,
        user: currentUser,
        action: `${layer.visible ? 'hid' : 'showed'} layer`,
        timestamp: new Date(),
        details: layer.name
      }, ...prev]);
    }
  };

  // Get role icon
  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-600" />;
      case 'editor': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'viewer': return <Eye className="h-4 w-4 text-green-600" />;
      default: return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status color
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Get layer type icon
  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'vector': return <Navigation className="h-4 w-4" />;
      case 'raster': return <Map className="h-4 w-4" />;
      case 'analysis': return <BarChart3 className="h-4 w-4" />;
      case 'annotation': return <Edit className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Workspace Header */}
      <div className="flex-shrink-0 border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold">{currentProject.name}</h1>
              <p className="text-sm text-muted-foreground">{currentProject.description}</p>
            </div>
            
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAutoSaving ? (
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Saved {formatTimeAgo(lastSaved)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Collaborator avatars */}
            <div className="flex -space-x-2">
              {currentProject.collaborators.slice(0, 5).map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="relative">
                        <Avatar className="h-8 w-8 border-2 border-white">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white ${getStatusColor(user.status)}`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs opacity-75">{user.role} • {user.status}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {currentProject.collaborators.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{currentProject.collaborators.length - 5}
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </Button>

            <Button size="sm" variant="outline">
              <Share className="h-4 w-4" />
              Share
            </Button>

            <Button size="sm">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="workspace">Layers</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="flex-1 flex flex-col min-h-0 mx-2">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Layers ({currentProject.layers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-2">
                      {currentProject.layers.map(layer => (
                        <div key={layer.id} className="flex items-center gap-2 p-2 rounded border bg-white">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => handleLayerVisibility(layer.id)}
                          >
                            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {getLayerIcon(layer.type)}
                            {layer.locked && <Lock className="h-3 w-3 text-gray-400" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{layer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              by {layer.owner.name}
                            </p>
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            {layer.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="flex-1 flex flex-col min-h-0 mx-2">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaborators ({currentProject.collaborators.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                  {/* Invite section */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Invite Collaborator</h4>
                    <div className="space-y-2">
                      <Input
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as User['role'])}
                          className="flex-1 text-sm border rounded px-2 py-1"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button size="sm" onClick={handleInviteUser}>
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Users list */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-2">
                      {currentProject.collaborators.map(user => (
                        <div key={user.id} className="flex items-center gap-2 p-2 rounded border bg-white">
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white ${getStatusColor(user.status)}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              {getRoleIcon(user.role)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {user.lastActivity ? `Active ${formatTimeAgo(user.lastActivity)}` : user.status}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            {user.id !== currentUser.id && currentUser.role === 'owner' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600"
                                onClick={() => onUserRemove && onUserRemove(user.id)}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 flex flex-col min-h-0 mx-2">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {activityFeed.map(activity => (
                        <div key={activity.id} className="flex gap-3">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={activity.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {activity.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              <span className="font-medium">{activity.user.name}</span>
                              <span className="text-muted-foreground"> {activity.action}</span>
                            </div>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 flex flex-col min-h-0 mx-2">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Workspace Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Collaboration</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.enableChat}
                              onChange={() => {}}
                            />
                            Enable chat
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.enableCursors}
                              onChange={() => setShowCursors(!showCursors)}
                            />
                            Show collaborative cursors
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.requireApproval}
                              onChange={() => {}}
                            />
                            Require approval for edits
                          </label>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Project</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.autoSave}
                              onChange={() => {}}
                            />
                            Auto-save changes
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.versionControl}
                              onChange={() => {}}
                            />
                            Enable version control
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={currentProject.settings.allowPublicView}
                              onChange={() => {}}
                            />
                            Allow public viewing
                          </label>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Project Info</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Created: {currentProject.lastModified.toLocaleDateString()}</p>
                          <p>Version: {currentProject.version}</p>
                          <p>Collaborators: {currentProject.collaborators.length}</p>
                          <p>Layers: {currentProject.layers.length}</p>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main workspace area */}
        <div className="flex-1 relative" ref={workspaceRef}>
          {/* Collaborative cursors overlay */}
          {showCursors && (
            <CollaborativeCursors
              currentUser={currentUser}
              collaborators={currentProject.collaborators}
              className="absolute inset-0 z-10"
            />
          )}

          {/* Map/workspace content */}
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">GIS Workspace</h3>
              <p className="text-gray-500 max-w-md">
                Your collaborative GIS workspace. Layers, analysis tools, and real-time collaboration features will appear here.
              </p>
            </div>
          </div>

          {/* Workspace toolbar */}
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-white rounded-lg shadow-lg border p-2 flex gap-1">
              <Button size="sm" variant="ghost">
                <Hand className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mx-1" />
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Target className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-96 border-l">
            <CollaborativeChat
              currentUser={currentUser}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeWorkspace;
