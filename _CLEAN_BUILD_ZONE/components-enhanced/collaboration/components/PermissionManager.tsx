/**
 * Terrafusion OS 1.0 - Permission Management System
 * Government-Grade Access Control Interface
 * 
 * Comprehensive permission management with role-based access control,
 * granular permissions, audit trails, and government compliance features.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs';
import {
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,
  Switch,
} from '../../ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Users,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Lock,
  Unlock,
  Key,
  Clock,
  Warning,
  CheckCircle,
  XCircle,
  History,
  Calendar,
  FileText,
  Database,
  Globe,
 } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import {
  Permission,
  TeamPermission,
  ProjectPermission,
  CollaborationUser,
  Team,
  Project,
  UserRole,
  PermissionCategory,
  PermissionLevel,
  PermissionScope,
  SecurityClearance,
  AuditEvent,
  AuditEventType,
  CollaborationComponentProps,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface PermissionManagerProps extends CollaborationComponentProps {
  entityType: 'team' | 'project' | 'system';
  entityId?: string;
  entity?: Team | Project;
  showAuditLog?: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  className = '',
  entityType,
  entityId,
  entity,
  currentUser,
  showAuditLog = true,
  onUpdate,
  onError,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('permissions');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PermissionCategory | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<PermissionLevel | 'all'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Mock permissions data - in real implementation, this would come from API
  const availablePermissions: Permission[] = [
    {
      id: 'view_projects',
      name: 'View Projects',
      description: 'Can view project information and details',
      category: PermissionCategory.PROJECT,
      level: PermissionLevel.READ,
      scope: PermissionScope.PROJECT,
      isSystemPermission: false,
    },
    {
      id: 'edit_projects',
      name: 'Edit Projects',
      description: 'Can modify project settings and information',
      category: PermissionCategory.PROJECT,
      level: PermissionLevel.WRITE,
      scope: PermissionScope.PROJECT,
      isSystemPermission: false,
    },
    {
      id: 'manage_team',
      name: 'Manage Team',
      description: 'Can add/remove team members and assign roles',
      category: PermissionCategory.TEAM,
      level: PermissionLevel.ADMIN,
      scope: PermissionScope.TEAM,
      isSystemPermission: false,
    },
    {
      id: 'view_documents',
      name: 'View Documents',
      description: 'Can access and view project documents',
      category: PermissionCategory.DOCUMENT,
      level: PermissionLevel.READ,
      scope: PermissionScope.PROJECT,
      isSystemPermission: false,
    },
    {
      id: 'edit_documents',
      name: 'Edit Documents',
      description: 'Can modify and update project documents',
      category: PermissionCategory.DOCUMENT,
      level: PermissionLevel.WRITE,
      scope: PermissionScope.PROJECT,
      isSystemPermission: false,
    },
    {
      id: 'system_admin',
      name: 'System Administrator',
      description: 'Full system access and administrative privileges',
      category: PermissionCategory.SYSTEM,
      level: PermissionLevel.OWNER,
      scope: PermissionScope.GLOBAL,
      isSystemPermission: true,
    },
  ];

  // Mock user permissions - in real implementation, this would come from API
  const userPermissions = useMemo(() => {
    if (entityType === 'team' && entity) {
      return (entity as Team).members.map(member => ({
        user: member,
        permissions: availablePermissions.filter(p => 
          p.category === PermissionCategory.TEAM || p.category === PermissionCategory.PROJECT
        ).slice(0, Math.floor(Math.random() * 3) + 1),
        grantedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        grantedBy: currentUser || member,
      }));
    }
    
    if (entityType === 'project' && entity) {
      return (entity as Project).participants.map(participant => ({
        user: participant.user,
        permissions: availablePermissions.filter(p => 
          p.category === PermissionCategory.PROJECT || p.category === PermissionCategory.DOCUMENT
        ).slice(0, Math.floor(Math.random() * 4) + 1),
        grantedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        grantedBy: currentUser || participant.user,
      }));
    }
    
    return [];
  }, [entityType, entity, currentUser, availablePermissions]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    let filtered = availablePermissions;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(p => p.level === levelFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [availablePermissions, categoryFilter, levelFilter, searchQuery]);

  // Filter user permissions
  const filteredUserPermissions = useMemo(() => {
    if (!searchQuery) return userPermissions;
    
    const query = searchQuery.toLowerCase();
    return userPermissions.filter(up => 
      up.user.name.toLowerCase().includes(query) ||
      up.user.email.toLowerCase().includes(query) ||
      up.permissions.some(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    );
  }, [userPermissions, searchQuery]);

  // Mock audit events
  const auditEvents: AuditEvent[] = useMemo(() => [
    {
      id: '1',
      type: AuditEventType.PERMISSION_CHANGE,
      entity: entityType,
      entityId: entityId || '',
      user: currentUser!,
      action: 'Permission granted',
      details: { permission: 'view_projects', target: 'john.doe@gov.com' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      sessionId: 'session123',
    },
    {
      id: '2',
      type: AuditEventType.PERMISSION_CHANGE,
      entity: entityType,
      entityId: entityId || '',
      user: currentUser!,
      action: 'Permission revoked',
      details: { permission: 'edit_documents', target: 'jane.smith@gov.com' },
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0...',
      sessionId: 'session124',
    },
  ], [entityType, entityId, currentUser]);

  // Grant permission mutation
  const grantPermissionMutation = useMutation({
    mutationFn: async ({ userId, permissionId }: { userId: string; permissionId: string }) => {
      // In real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { userId, permissionId };
    },
    onSuccess: ({ userId, permissionId }) => {
      const permission = availablePermissions.find(p => p.id === permissionId);
      const user = userPermissions.find(up => up.user.id === userId)?.user;
      
      toast({
        title: 'Permission Granted',
        description: `${permission?.name} granted to ${user?.name}`,
      });
      
      queryClient.invalidateQueries(['permissions', entityType, entityId]);
      onUpdate?.({ action: 'grant', userId, permissionId });
    },
    onError: (error) => {
      console.error('Failed to grant permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grant permission.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    },
  });

  // Revoke permission mutation
  const revokePermissionMutation = useMutation({
    mutationFn: async ({ userId, permissionId }: { userId: string; permissionId: string }) => {
      // In real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { userId, permissionId };
    },
    onSuccess: ({ userId, permissionId }) => {
      const permission = availablePermissions.find(p => p.id === permissionId);
      const user = userPermissions.find(up => up.user.id === userId)?.user;
      
      toast({
        title: 'Permission Revoked',
        description: `${permission?.name} revoked from ${user?.name}`,
      });
      
      queryClient.invalidateQueries(['permissions', entityType, entityId]);
      onUpdate?.({ action: 'revoke', userId, permissionId });
    },
    onError: (error) => {
      console.error('Failed to revoke permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke permission.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    },
  });

  const getPermissionIcon = (category: PermissionCategory) => {
    switch (category) {
      case PermissionCategory.SYSTEM:
        return Settings;
      case PermissionCategory.PROJECT:
        return FileText;
      case PermissionCategory.TEAM:
        return Users;
      case PermissionCategory.DOCUMENT:
        return FileText;
      case PermissionCategory.COLLABORATION:
        return Globe;
      default:
        return Shield;
    }
  };

  const getPermissionLevelIcon = (level: PermissionLevel) => {
    switch (level) {
      case PermissionLevel.OWNER:
        return ShieldCheck;
      case PermissionLevel.ADMIN:
        return ShieldAlert;
      case PermissionLevel.WRITE:
        return Edit;
      case PermissionLevel.READ:
        return Eye;
      default:
        return ShieldX;
    }
  };

  const getPermissionLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case PermissionLevel.OWNER:
        return 'text-purple-600';
      case PermissionLevel.ADMIN:
        return 'text-red-600';
      case PermissionLevel.WRITE:
        return 'text-orange-600';
      case PermissionLevel.READ:
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getClearanceBadge = (clearance?: SecurityClearance) => {
    if (!clearance) return null;
    
    const colors: Record<SecurityClearance, string> = {
      [SecurityClearance.PUBLIC]: 'bg-green-100 text-green-800',
      [SecurityClearance.INTERNAL]: 'bg-blue-100 text-blue-800',
      [SecurityClearance.CONFIDENTIAL]: 'bg-orange-100 text-orange-800',
      [SecurityClearance.SECRET]: 'bg-red-100 text-red-800',
      [SecurityClearance.TOP_SECRET]: 'bg-purple-100 text-purple-800',
    };
    
    return (
      <Badge className={`text-xs ${colors[clearance]}`}>
        {clearance.replace('_', ' ')}
      </Badge>
    );
  };

  const hasPermission = (userId: string, permissionId: string) => {
    const userPerms = userPermissions.find(up => up.user.id === userId);
    return userPerms?.permissions.some(p => p.id === permissionId) || false;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <div><>

                <CardTitle>Permission Management</CardTitle>
                <CardDescription
</>
</>>
                  Manage access permissions and security settings for{' '}
                  {entity ? (entity as any).name : `this ${entityType}`}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Permissions
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><>

                    <DialogTitle>Assign Permissions</DialogTitle>
                    <DialogDescription
</>
</>>
                      Grant permissions to users for this {entityType}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Permission assignment form would go here */}
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select users and permissions to assign. This would contain
                      a full permission assignment interface in the real implementation.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        {/* Search and Filters */}
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users or permissions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={(value: any) => setCategoryFilter(value)}>
                <SelectTrigger className="w-40"><>

                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent
</>
</>>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(PermissionCategory).map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={levelFilter} onValueChange={(value: any) => setLevelFilter(value)}>
                <SelectTrigger className="w-32"><>

                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent
</>
</>>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Object.values(PermissionLevel).map(level => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="permissions">User Permissions</TabsTrigger>
          <TabsTrigger
</>
value="available">Available Permissions</TabsTrigger>
          {showAuditLog && <TabsTrigger value="audit">Audit Log</TabsTrigger>}
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle className="text-sm">User Permissions Overview</CardTitle>
              <CardDescription
</>
</>>
                Manage individual user permissions and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUserPermissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><>

                  <p className="text-lg font-medium mb-2">No users found</p>
                  <p
</>
className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'No users have permissions yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUserPermissions.map((userPerm) => (
                    <Card key={userPerm.user.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userPerm.user.avatar} />
                          <AvatarFallback>
                            {userPerm.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div><>

                              <h4 className="font-medium">{userPerm.user.name}</h4>
                              <p
</>
className="text-sm text-muted-foreground">{userPerm.user.email}</p>
                              <div className="flex items-center gap-2 mt-1"><>

                                <Badge variant="outline" className="text-xs">
                                  {userPerm.user.role.replace('_', ' ')}
                                </Badge>
                                <Badge
</>
variant="secondary" className="text-xs">
                                  {userPerm.user.department}
                                </Badge>
                                {getClearanceBadge(userPerm.user.governmentClearance)}
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent><>

                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
</>
</>><>

                                  <Plus className="h-4 w-4 mr-2" />
                                  Grant Permission
                                </DropdownMenuItem>
                                <DropdownMenuItem
</>
</>><>

                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator
</>
/>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove All Permissions
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-2"><>

                            <p className="text-xs text-muted-foreground">Permissions:</p>
                            <div
</>
className="flex flex-wrap gap-2">
                              {userPerm.permissions.map((permission) => {
                                const PermissionIcon = getPermissionLevelIcon(permission.level);
                                
                                return (
                                  <div
                                    key={permission.id}
                                    className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg text-xs"
                                  >
                                    <PermissionIcon className={`h-3 w-3 ${getPermissionLevelColor(permission.level)}`} /><>

                                    <span>{permission.name}</span>
                                    <Button
</>

                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 hover:bg-red-100"
                                      onClick={() => revokePermissionMutation.mutate({
                                        userId: userPerm.user.id,
                                        permissionId: permission.id
                                      })}
                                    >
                                      <X className="h-2 w-2" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              <span>
                                Last updated {formatDistanceToNow(userPerm.grantedAt, { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle className="text-sm">Available Permissions</CardTitle>
              <CardDescription
</>
</>>
                Browse and manage all available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><>

                    <TableHead>Permission</TableHead>
                    <TableHead
</>
</>>Category</TableHead><>

                    <TableHead>Level</TableHead>
                    <TableHead
</>
</>>Scope</TableHead><>

                    <TableHead>Users</TableHead>
                    <TableHead
</>
</>>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => {
                    const PermissionIcon = getPermissionIcon(permission.category);
                    const LevelIcon = getPermissionLevelIcon(permission.level);
                    const usersWithPermission = userPermissions.filter(up => 
                      up.permissions.some(p => p.id === permission.id)
                    );
                    
                    return (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <PermissionIcon className="h-4 w-4 text-muted-foreground" />
                            <div><>

                              <p className="font-medium text-sm">{permission.name}</p>
                              <p
</>
className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {permission.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <LevelIcon className={`h-4 w-4 ${getPermissionLevelColor(permission.level)}`} />
                            <span className="text-sm">{permission.level}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {permission.scope.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{usersWithPermission.length}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm"><>

                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
</>
variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!permission.isSystemPermission && (
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {showAuditLog && (
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><>

                  <History className="h-4 w-4" />
                  Permission Audit Log
                </CardTitle>
                <CardDescription
</>
</>>
                  Track all permission changes and security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><>

                      <p className="text-lg font-medium mb-2">No audit events</p>
                      <p
</>
className="text-muted-foreground">
                        No permission changes have been recorded yet
                      </p>
                    </div>
                  ) : (
                    auditEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {event.type === AuditEventType.PERMISSION_CHANGE ? (
                            <Shield className="h-5 w-5 text-blue-500" />
                          ) : (<>

                            <Warning className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        
                        <div
</>
className="flex-1">
                          <div className="flex items-center justify-between mb-2"><>

                            <p className="font-medium text-sm">{event.action}</p>
                            <div
</>
className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(event.timestamp, 'MMM dd, yyyy HH:mm')}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">{event.user.name}</span> {event.action.toLowerCase()}
                            </p>
                            {event.details && (
                              <p>
                                Permission: <span className="font-mono">{event.details.permission}</span>
                                {event.details.target && (
                                  <> for <span className="font-medium">{event.details.target}</span><div )}
                              </p>
                            )}
                            <p>IP: {event.ipAddress} • Session: {event.sessionId}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PermissionManager;