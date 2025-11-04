import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle,
  BarChart4,
  Copy, 
  Download,
  FileText, 
  Key,
  Link,
  Lock,
  LucideProps,
  Search,
  Send,
  Settings,
  Share,
  Shield,
  ShieldAlert,
  ShieldCheck, 
  Upload,
  Users
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface SecureDataSharingProps {
  className?: string;
}

type DataShareStatus = 'active' | 'inactive' | 'expired' | 'revoked';

interface SharingPermission {
  id: string;
  type: 'read' | 'write' | 'admin';
  name: string;
  description: string;
}

interface DataShareRecipient {
  id: string;
  name: string;
  organization: string;
  email: string;
  accessLevel: string;
  status: 'active' | 'pending' | 'revoked';
  lastAccess?: string;
}

interface DataShareItem {
  id: string;
  name: string;
  description: string;
  status: DataShareStatus;
  createdAt: string;
  expiresAt?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  recipients: DataShareRecipient[];
  dataAssets: {
    id: string;
    name: string;
    type: string;
    size?: number;
    recordCount?: number;
  }[];
  permissions: SharingPermission[];
  securitySettings: {
    encryptionEnabled: boolean;
    accessLogging: boolean;
    requiresMfa: boolean;
    downloadEnabled: boolean;
    ipRestrictions?: string[];
    watermarked: boolean;
  };
  analytics: {
    totalViews: number;
    uniqueUsers: number;
    downloads: number;
    lastAccessed?: string;
  };
}

export function SecureDataSharing({ className = '' }: SecureDataSharingProps) {
  const [activeTab, setActiveTab] = useState('shares');
  const [dataShares, setDataShares] = useState<DataShareItem[]>([]);
  const [selectedShare, setSelectedShare] = useState<DataShareItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newShareName, setNewShareName] = useState('');
  const [newShareDescription, setNewShareDescription] = useState('');
  const [newShareExpiry, setNewShareExpiry] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [securitySettings, setSecuritySettings] = useState({
    encryptionEnabled: true,
    accessLogging: true,
    requiresMfa: false,
    downloadEnabled: true,
    watermarked: false
  });
  const [permissions, setPermissions] = useState<string[]>(['read']);
  
  const { toast } = useToast();

  // Available permissions
  const availablePermissions: SharingPermission[] = [
    { id: 'read', type: 'read', name: 'Read', description: 'View data assets and metadata' },
    { id: 'write', type: 'write', name: 'Write', description: 'Edit data assets and add comments' },
    { id: 'admin', type: 'admin', name: 'Admin', description: 'Manage share settings and add recipients' }
  ];
  
  // Available data assets (simulated)
  const availableAssets = [
    { id: 'asset-001', name: 'Q1 2025 Permit Database', type: 'Database Export', recordCount: 12547 },
    { id: 'asset-002', name: 'Building Code Violation Reports', type: 'Spreadsheet', recordCount: 843 },
    { id: 'asset-003', name: 'Zoning Maps - Downtown Area', type: 'GIS Data', size: 156000000 },
    { id: 'asset-004', name: 'Permit Processing Analytics', type: 'Dashboard', size: 2500000 }
  ];
  
  // Available recipients (simulated)
  const availableRecipients = [
    { id: 'rec-001', name: 'Jane Smith', organization: 'City Planning Department', email: 'j.smith@cityplanning.gov' },
    { id: 'rec-002', name: 'Robert Johnson', organization: 'Building Inspection Division', email: 'r.johnson@buildings.gov' },
    { id: 'rec-003', name: 'Maria Garcia', organization: 'Public Works Department', email: 'm.garcia@publicworks.gov' },
    { id: 'rec-004', name: 'Ahmed Patel', organization: 'Transportation Authority', email: 'a.patel@transport.gov' }
  ];

  // Initialize with demo data
  useEffect(() => {
    // Simulate loading data shares from API
    const demoShares: DataShareItem[] = [
      {
        id: 'share-001',
        name: 'Quarterly Permit Data Exchange',
        description: 'Secure sharing of permit data with partner agencies for quarterly review',
        status: 'active',
        createdAt: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
        expiresAt: new Date(Date.now() + 7776000000).toISOString(), // 90 days in future
        creator: {
          id: 'user-001',
          name: 'Alex Morgan',
          email: 'a.morgan@organization.com'
        },
        recipients: [
          {
            id: 'rec-001',
            name: 'Jane Smith',
            organization: 'City Planning Department',
            email: 'j.smith@cityplanning.gov',
            accessLevel: 'read',
            status: 'active',
            lastAccess: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            id: 'rec-002',
            name: 'Robert Johnson',
            organization: 'Building Inspection Division',
            email: 'r.johnson@buildings.gov',
            accessLevel: 'read',
            status: 'pending'
          }
        ],
        dataAssets: [
          {
            id: 'asset-001',
            name: 'Q1 2025 Permit Database',
            type: 'Database Export',
            recordCount: 12547
          },
          {
            id: 'asset-004',
            name: 'Permit Processing Analytics',
            type: 'Dashboard',
            size: 2500000
          }
        ],
        permissions: [
          availablePermissions[0] // read
        ],
        securitySettings: {
          encryptionEnabled: true,
          accessLogging: true,
          requiresMfa: false,
          downloadEnabled: true,
          watermarked: true
        },
        analytics: {
          totalViews: 24,
          uniqueUsers: 1,
          downloads: 3,
          lastAccessed: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      },
      {
        id: 'share-002',
        name: 'Zoning Map Collaboration',
        description: 'Secure access to zoning maps for cross-department planning purposes',
        status: 'active',
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        expiresAt: new Date(Date.now() + 5184000000).toISOString(), // 60 days in future
        creator: {
          id: 'user-001',
          name: 'Alex Morgan',
          email: 'a.morgan@organization.com'
        },
        recipients: [
          {
            id: 'rec-003',
            name: 'Maria Garcia',
            organization: 'Public Works Department',
            email: 'm.garcia@publicworks.gov',
            accessLevel: 'write',
            status: 'active',
            lastAccess: new Date(Date.now() - 172800000).toISOString() // 2 days ago
          },
          {
            id: 'rec-004',
            name: 'Ahmed Patel',
            organization: 'Transportation Authority',
            email: 'a.patel@transport.gov',
            accessLevel: 'read',
            status: 'active',
            lastAccess: new Date(Date.now() - 259200000).toISOString() // 3 days ago
          }
        ],
        dataAssets: [
          {
            id: 'asset-003',
            name: 'Zoning Maps - Downtown Area',
            type: 'GIS Data',
            size: 156000000
          }
        ],
        permissions: [
          availablePermissions[0], // read
          availablePermissions[1]  // write
        ],
        securitySettings: {
          encryptionEnabled: true,
          accessLogging: true,
          requiresMfa: true,
          downloadEnabled: false,
          watermarked: true
        },
        analytics: {
          totalViews: 18,
          uniqueUsers: 2,
          downloads: 0,
          lastAccessed: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        }
      },
      {
        id: 'share-003',
        name: 'Building Code Violations Report',
        description: 'Monthly report of building code violations for review by inspection team',
        status: 'expired',
        createdAt: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago (expired)
        creator: {
          id: 'user-001',
          name: 'Alex Morgan',
          email: 'a.morgan@organization.com'
        },
        recipients: [
          {
            id: 'rec-002',
            name: 'Robert Johnson',
            organization: 'Building Inspection Division',
            email: 'r.johnson@buildings.gov',
            accessLevel: 'read',
            status: 'active',
            lastAccess: new Date(Date.now() - 1209600000).toISOString() // 14 days ago
          }
        ],
        dataAssets: [
          {
            id: 'asset-002',
            name: 'Building Code Violation Reports',
            type: 'Spreadsheet',
            recordCount: 843
          }
        ],
        permissions: [
          availablePermissions[0] // read
        ],
        securitySettings: {
          encryptionEnabled: true,
          accessLogging: true,
          requiresMfa: false,
          downloadEnabled: true,
          watermarked: false
        },
        analytics: {
          totalViews: 8,
          uniqueUsers: 1,
          downloads: 2,
          lastAccessed: new Date(Date.now() - 1209600000).toISOString() // 14 days ago
        }
      }
    ];

    setDataShares(demoShares);
    setLoading(false);
  }, []);

  const handleCreateShare = () => {
    setIsCreating(true);
    setNewShareName('');
    setNewShareDescription('');
    setNewShareExpiry('');
    setSelectedAssets([]);
    setSelectedRecipients([]);
    setPermissions(['read']);
    setSecuritySettings({
      encryptionEnabled: true,
      accessLogging: true,
      requiresMfa: false,
      downloadEnabled: true,
      watermarked: false
    });
  };

  const handleManageShare = (share: DataShareItem) => {
    setSelectedShare(share);
    setIsManaging(true);
    setSelectedRecipients(share.recipients.map(r => r.id));
    setPermissions(share.permissions.map(p => p.id));
    setSecuritySettings(share.securitySettings);
  };

  const handleCopyShareLink = (shareId: string) => {
    // In a real implementation, this would generate a secure link
    const dummyShareLink = `https://permits.example.com/share/${shareId}`;
    navigator.clipboard.writeText(dummyShareLink);
    
    toast({
      title: 'Share Link Copied',
      description: 'The secure sharing link has been copied to clipboard.',
    });
  };

  const handleSaveNewShare = () => {
    if (!newShareName.trim() || selectedAssets.length === 0 || selectedRecipients.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name, select at least one data asset, and add at least one recipient.',
        variant: 'destructive',
      });
      return;
    }
    
    // Calculate expiry date based on input
    const expiryDate = newShareExpiry 
      ? new Date(newShareExpiry).toISOString()
      : new Date(Date.now() + 7776000000).toISOString(); // Default: 90 days
    
    const selectedPerms = availablePermissions.filter(p => permissions.includes(p.id));
    
    const newShare: DataShareItem = {
      id: `share-${Math.random().toString(36).substring(2, 8)}`,
      name: newShareName,
      description: newShareDescription,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate,
      creator: {
        id: 'user-001',
        name: 'Alex Morgan',
        email: 'a.morgan@organization.com'
      },
      recipients: selectedRecipients.map(recId => {
        const recipient = availableRecipients.find(r => r.id === recId)!;
        return {
          id: recipient.id,
          name: recipient.name,
          organization: recipient.organization,
          email: recipient.email,
          accessLevel: permissions.includes('write') ? 'write' : 'read',
          status: 'pending'
        };
      }),
      dataAssets: selectedAssets.map(assetId => 
        availableAssets.find(a => a.id === assetId)!
      ),
      permissions: selectedPerms,
      securitySettings,
      analytics: {
        totalViews: 0,
        uniqueUsers: 0,
        downloads: 0
      }
    };
    
    setDataShares(prev => [...prev, newShare]);
    setIsCreating(false);
    
    toast({
      title: 'Data Share Created',
      description: `"${newShareName}" has been created and notifications sent to recipients.`,
    });
  };

  const handleUpdateShare = () => {
    if (!selectedShare) return;
    
    setDataShares(prev => prev.map(share => {
      if (share.id !== selectedShare.id) return share;
      
      // Type safe recipient mapping
      const updatedRecipients: DataShareRecipient[] = selectedRecipients.map(recId => {
        // Keep existing recipients if they're still selected
        const existingRecipient = share.recipients.find(r => r.id === recId);
        if (existingRecipient) return existingRecipient;
        
        // Add new recipients with proper typing
        const recipient = availableRecipients.find(r => r.id === recId)!;
        const status: 'active' | 'pending' | 'revoked' = 'pending';
        return {
          id: recipient.id,
          name: recipient.name,
          organization: recipient.organization,
          email: recipient.email,
          accessLevel: permissions.includes('write') ? 'write' : 'read',
          status
        };
      });
      
      return {
        ...share,
        recipients: updatedRecipients,
        permissions: availablePermissions.filter(p => permissions.includes(p.id)),
        securitySettings
      };
    }));
    
    setIsManaging(false);
    
    toast({
      title: 'Share Updated',
      description: `"${selectedShare.name}" has been updated successfully.`,
    });
  };

  const handleRevokeShare = (shareId: string) => {
    setDataShares(prev => prev.map(share => 
      share.id === shareId 
        ? { ...share, status: 'revoked' }
        : share
    ));
    
    toast({
      title: 'Share Revoked',
      description: 'The data share has been revoked. Recipients can no longer access shared data.',
    });
  };

  const handleDeleteRecipient = (shareId: string, recipientId: string) => {
    setDataShares(prev => prev.map(share => {
      if (share.id !== shareId) return share;
      
      return {
        ...share,
        recipients: share.recipients.filter(r => r.id !== recipientId)
      };
    }));
    
    toast({
      title: 'Recipient Removed',
      description: 'The recipient has been removed from this data share.',
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatSize = (sizeInBytes?: number) => {
    if (!sizeInBytes) return 'N/A';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusBadge = (status: DataShareStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSecurityIcon = (name: string, props: LucideProps = { className: "h-4 w-4" }) => {
    switch (name) {
      case 'encryption':
        return <Lock {...props} />;
      case 'logging':
        return <FileText {...props} />;
      case 'mfa':
        return <Shield {...props} />;
      case 'download':
        return <Download {...props} />;
      case 'watermark':
        return <FileText {...props} />;
      default:
        return <ShieldCheck {...props} />;
    }
  };

  // Filter shares based on search query
  const filteredShares = dataShares.filter(share => 
    share.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    share.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader><>

          <CardTitle>Secure Data Sharing</CardTitle>
          <CardDescription
</>>Securely share permit data with external organizations</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center"><>

            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p
</>>Loading data shares...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader><>

          <CardTitle>Secure Data Sharing</CardTitle>
          <CardDescription
</>>Securely share permit data with external organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>Secure Data Sharing</CardTitle>
            <CardDescription
</>>Securely share permit data with external organizations</CardDescription>
          </div>
          {!isCreating && !isManaging && (
            <Button onClick={handleCreateShare}>
              <Share className="mr-2 h-4 w-4" />
              New Share
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="space-y-4"><>

            <h3 className="text-lg font-medium">Create New Data Share</h3>
            <div
</> className="grid gap-4">
              <div className="grid gap-2"><>

                <Label htmlFor="share-name">Share Name</Label>
                <Input
</>
                  id="share-name"
                  placeholder="Enter a descriptive name"
                  value={newShareName}
                  onChange={(e) => setNewShareName(e.target.value)}
                />
              </div>
              <div className="grid gap-2"><>

                <Label htmlFor="share-description">Description</Label>
                <Textarea
</>
                  id="share-description"
                  placeholder="Describe the purpose of this share"
                  value={newShareDescription}
                  onChange={(e) => setNewShareDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2"><>

                <Label htmlFor="share-expiry">Expiration Date (Optional)</Label>
                <Input
</>
                  id="share-expiry"
                  type="date"
                  value={newShareExpiry}
                  onChange={(e) => setNewShareExpiry(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave blank for 90 day default expiration</p>
              </div>
              
              <Separator /><>

              
              <h4 className="text-sm font-medium">Select Data Assets</h4>
              <div
</> className="space-y-2">
                {availableAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`asset-${asset.id}`}
                      checked={selectedAssets.includes(asset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets(prev => [...prev, asset.id]);
                        } else {
                          setSelectedAssets(prev => prev.filter(id => id !== asset.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`asset-${asset.id}`} className="text-sm">
                      {asset.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {asset.type} {asset.recordCount ? `(${asset.recordCount} records)` : asset.size ? `(${formatSize(asset.size)})` : ''}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              <Separator /><>

              
              <h4 className="text-sm font-medium">Add Recipients</h4>
              <div
</> className="space-y-2">
                {availableRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`recipient-${recipient.id}`}
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipients(prev => [...prev, recipient.id]);
                        } else {
                          setSelectedRecipients(prev => prev.filter(id => id !== recipient.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`recipient-${recipient.id}`} className="text-sm">
                      {recipient.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {recipient.organization} ({recipient.email})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              <Separator /><>

              
              <h4 className="text-sm font-medium">Permissions</h4>
              <div
</> className="space-y-2">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`permission-${permission.id}`}
                      checked={permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPermissions(prev => [...prev, permission.id]);
                        } else {
                          setPermissions(prev => prev.filter(id => id !== permission.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`permission-${permission.id}`} className="text-sm">
                      {permission.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({permission.description})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              
              <Separator /><>

              
              <h4 className="text-sm font-medium">Security Settings</h4>
              <div
</> className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="security-encryption" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Enable Encryption</span>
                  </Label><>

                  <Switch
                    id="security-encryption"
                    checked={securitySettings.encryptionEnabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, encryptionEnabled: checked }))}
                  />
                </div>
                <div
</> className="flex items-center justify-between">
                  <Label htmlFor="security-logging" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Access Logging</span>
                  </Label><>

                  <Switch
                    id="security-logging"
                    checked={securitySettings.accessLogging}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, accessLogging: checked }))}
                  />
                </div>
                <div
</> className="flex items-center justify-between">
                  <Label htmlFor="security-mfa" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Require MFA</span>
                  </Label><>

                  <Switch
                    id="security-mfa"
                    checked={securitySettings.requiresMfa}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requiresMfa: checked }))}
                  />
                </div>
                <div
</> className="flex items-center justify-between">
                  <Label htmlFor="security-download" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>Allow Downloads</span>
                  </Label><>

                  <Switch
                    id="security-download"
                    checked={securitySettings.downloadEnabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, downloadEnabled: checked }))}
                  />
                </div>
                <div
</> className="flex items-center justify-between">
                  <Label htmlFor="security-watermark" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Watermark</span>
                  </Label>
                  <Switch
                    id="security-watermark"
                    checked={securitySettings.watermarked}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, watermarked: checked }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4"><>

              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button
</> onClick={handleSaveNewShare}>Create Share</Button>
            </div>
          </div>
        )}

        {isManaging && selectedShare && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><>

              <h3 className="text-lg font-medium">Manage Data Share</h3>
              <Badge
</> className="ml-2">{getStatusBadge(selectedShare.status)}</Badge>
            </div>
            <div className="text-sm"><>

              <p className="font-medium">{selectedShare.name}</p>
              <p
</> className="text-muted-foreground">{selectedShare.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span> {formatDate(selectedShare.createdAt)}
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span> {formatDate(selectedShare.expiresAt)}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2"><>

              <h4 className="text-sm font-medium">Shared Data Assets</h4>
              <div
</> className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Name</TableHead>
                      <TableHead
</>>Type</TableHead>
                      <TableHead>Size/Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedShare.dataAssets.map((asset) => (
                      <TableRow key={asset.id}><>

                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell
</>>{asset.type}</TableCell>
                        <TableCell>
                          {asset.recordCount ? `${asset.recordCount} records` : asset.size ? formatSize(asset.size) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2"><>

              <h4 className="text-sm font-medium">Recipients</h4>
              <div
</> className="space-y-2">
                {availableRecipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`manage-recipient-${recipient.id}`}
                      checked={selectedRecipients.includes(recipient.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecipients(prev => [...prev, recipient.id]);
                        } else {
                          setSelectedRecipients(prev => prev.filter(id => id !== recipient.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor={`manage-recipient-${recipient.id}`} className="text-sm">
                      {recipient.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {recipient.organization} ({recipient.email})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator /><>

            
            <h4 className="text-sm font-medium">Permissions</h4>
            <div
</> className="space-y-2">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`manage-permission-${permission.id}`}
                    checked={permissions.includes(permission.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPermissions(prev => [...prev, permission.id]);
                      } else {
                        setPermissions(prev => prev.filter(id => id !== permission.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor={`manage-permission-${permission.id}`} className="text-sm">
                    {permission.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({permission.description})
                    </span>
                  </label>
                </div>
              ))}
            </div>
            
            <Separator /><>

            
            <h4 className="text-sm font-medium">Security Settings</h4>
            <div
</> className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="manage-security-encryption" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Enable Encryption</span>
                </Label><>

                <Switch
                  id="manage-security-encryption"
                  checked={securitySettings.encryptionEnabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, encryptionEnabled: checked }))}
                />
              </div>
              <div
</> className="flex items-center justify-between">
                <Label htmlFor="manage-security-logging" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Access Logging</span>
                </Label><>

                <Switch
                  id="manage-security-logging"
                  checked={securitySettings.accessLogging}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, accessLogging: checked }))}
                />
              </div>
              <div
</> className="flex items-center justify-between">
                <Label htmlFor="manage-security-mfa" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Require MFA</span>
                </Label><>

                <Switch
                  id="manage-security-mfa"
                  checked={securitySettings.requiresMfa}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, requiresMfa: checked }))}
                />
              </div>
              <div
</> className="flex items-center justify-between">
                <Label htmlFor="manage-security-download" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Allow Downloads</span>
                </Label><>

                <Switch
                  id="manage-security-download"
                  checked={securitySettings.downloadEnabled}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, downloadEnabled: checked }))}
                />
              </div>
              <div
</> className="flex items-center justify-between">
                <Label htmlFor="manage-security-watermark" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Watermark</span>
                </Label>
                <Switch
                  id="manage-security-watermark"
                  checked={securitySettings.watermarked}
                  onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, watermarked: checked }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4"><>

              <Button variant="outline" onClick={() => setIsManaging(false)}>Cancel</Button>
              <Button
</> onClick={handleUpdateShare}>Update Share</Button>
            </div>
          </div>
        )}

        {!isCreating && !isManaging && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList><>

                <TabsTrigger value="shares">All Shares</TabsTrigger>
                <TabsTrigger
</> value="active">Active</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search shares..."
                  className="w-[200px] pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="shares" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Name</TableHead>
                      <TableHead
</>>Status</TableHead><>

                      <TableHead>Recipients</TableHead>
                      <TableHead
</>>Created</TableHead><>

                      <TableHead>Expires</TableHead>
                      <TableHead
</> className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShares.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No data shares found {searchQuery && `matching "${searchQuery}"`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShares.map((share) => (
                        <TableRow key={share.id}>
                          <TableCell className="font-medium">
                            <div>
                              {share.name}
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {share.description}
                              </p>
                            </div>
                          </TableCell><>

                          <TableCell>{getStatusBadge(share.status)}</TableCell>
                          <TableCell
</>>
                            <div className="flex flex-col space-y-1"><>

                              <span>{share.recipients.length}</span>
                              <div
</> className="flex -space-x-2">
                                {share.recipients.slice(0, 3).map((recipient /* , index */) => (
                                  <div
                                    key={recipient.id}
                                    className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border border-background"
                                    title={recipient.name}
                                  >
                                    {recipient.name.charAt(0)}
                                  </div>
                                ))}
                                {share.recipients.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border border-background">
                                    +{share.recipients.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell><>

                          <TableCell>{formatDate(share.createdAt)}</TableCell>
                          <TableCell
</>>{formatDate(share.expiresAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyShareLink(share.id)}
                                title="Copy sharing link"
                              ><>

                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
</>
                                variant="ghost"
                                size="icon"
                                onClick={() => handleManageShare(share)}
                                title="Manage share"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              {share.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRevokeShare(share.id)}
                                  title="Revoke share"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="active" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Name</TableHead>
                      <TableHead
</>>Recipients</TableHead><>

                      <TableHead>Data Assets</TableHead>
                      <TableHead
</>>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShares.filter(share => share.status === 'active').length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No active data shares found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShares
                        .filter(share => share.status === 'active')
                        .map((share) => (
                          <TableRow key={share.id}>
                            <TableCell className="font-medium">
                              <div>
                                {share.name}
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {share.description}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-h-20 overflow-y-auto text-sm">
                                {share.recipients.map((recipient) => (
                                  <div key={recipient.id} className="flex items-center justify-between"><>

                                    <span>{recipient.name}</span>
                                    <Badge
</> variant="outline" className="ml-2">
                                      {recipient.accessLevel}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-h-20 overflow-y-auto text-sm">
                                {share.dataAssets.map((asset) => (
                                  <div key={asset.id}>{asset.name}</div>
                                ))}
                              </div>
                            </TableCell><>

                            <TableCell>{formatDate(share.expiresAt)}</TableCell>
                            <TableCell
</> className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyShareLink(share.id)}
                                  title="Copy sharing link"
                                ><>

                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
</>
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManageShare(share)}
                                  title="Manage share"
                                ><>

                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
</>
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRevokeShare(share.id)}
                                  title="Revoke share"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {filteredShares.map((share) => (
                  <Card key={share.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        <div className="flex items-center justify-between">
                          <span>{share.name}</span>
                          {getStatusBadge(share.status)}
                        </div>
                      </CardTitle>
                      <CardDescription>{share.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1"><>

                            <div className="text-2xl font-bold">{share.analytics.totalViews}</div>
                            <div
</> className="text-xs text-muted-foreground">Total Views</div>
                          </div>
                          <div className="space-y-1"><>

                            <div className="text-2xl font-bold">{share.analytics.uniqueUsers}</div>
                            <div
</> className="text-xs text-muted-foreground">Unique Users</div>
                          </div>
                          <div className="space-y-1"><>

                            <div className="text-2xl font-bold">{share.analytics.downloads}</div>
                            <div
</> className="text-xs text-muted-foreground">Downloads</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm"><>

                            <span className="text-muted-foreground">Security score</span>
                            <span
</> className="font-medium">
                              {Object.values(share.securitySettings).filter(Boolean).length} / 5
                            </span>
                          </div><>

                          <Progress 
                            value={(Object.values(share.securitySettings).filter(Boolean).length / 5) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div
</> className="flex flex-wrap gap-2 text-xs">
                          {share.securitySettings.encryptionEnabled && (
                            <Badge variant="outline" className="bg-blue-50">
                              <Lock className="h-3 w-3 mr-1" />
                              Encryption
                            </Badge>
                          )}
                          {share.securitySettings.accessLogging && (
                            <Badge variant="outline" className="bg-green-50">
                              <FileText className="h-3 w-3 mr-1" />
                              Logging
                            </Badge>
                          )}
                          {share.securitySettings.requiresMfa && (
                            <Badge variant="outline" className="bg-purple-50">
                              <Shield className="h-3 w-3 mr-1" />
                              MFA
                            </Badge>
                          )}
                          {share.securitySettings.watermarked && (
                            <Badge variant="outline" className="bg-yellow-50">
                              <FileText className="h-3 w-3 mr-1" />
                              Watermarked
                            </Badge>
                          )}
                          {!share.securitySettings.downloadEnabled && (
                            <Badge variant="outline" className="bg-red-50">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              No Downloads
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {share.analytics.lastAccessed ? (
                            <div>Last accessed: {formatDate(share.analytics.lastAccessed)}</div>
                          ) : (
                            <div>Not accessed yet</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
          <span>All shared data is encrypted in transit and at rest</span>
        </div>
      </CardFooter>
    </Card>
  );
}