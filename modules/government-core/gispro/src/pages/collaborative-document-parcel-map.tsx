import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Map, 
  Link2,
  CheckCircle,
  Clock,
  UserPlus,
  Share2,
  Eye,
  Download,
  Upload,
  Settings,
  Activity,
  MapPin,
  Layers,
  Search,
  Filter,
  Zap,
  Info,
  Play,
  Pause
} from 'lucide-react';

// Types
interface ParcelDocument {
  id: string;
  title: string;
  type: 'deed' | 'survey' | 'legal-description' | 'plat' | 'easement';
  status: 'active' | 'pending' | 'archived';
  parcelId: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  linkedFeatures: number;
}

interface CollaborativeSession {
  id: string;
  name: string;
  participants: string[];
  status: 'active' | 'paused' | 'completed';
  documentsCount: number;
  parcelsCount: number;
  lastActivity: string;
}

interface MapFeature {
  id: string;
  type: 'parcel' | 'boundary' | 'easement' | 'landmark';
  title: string;
  documentLinks: string[];
  coordinates: [number, number];
  status: 'verified' | 'pending' | 'disputed';
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  }
};

export default function CollaborativeDocumentParcelMap() {
  // Component state
  const [isJoined, setIsJoined] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedSession, setSelectedSession] = useState<CollaborativeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample data
  const [sessions] = useState<CollaborativeSession[]>([
    {
      id: 'sess-001',
      name: 'Downtown Redevelopment Project',
      participants: ['John Smith', 'Sarah Johnson', 'Mike Davis'],
      status: 'active',
      documentsCount: 24,
      parcelsCount: 8,
      lastActivity: '2024-01-15T10:30:00Z'
    },
    {
      id: 'sess-002',
      name: 'Heritage District Survey',
      participants: ['Lisa Chen', 'David Brown', 'Emma Wilson'],
      status: 'paused',
      documentsCount: 16,
      parcelsCount: 12,
      lastActivity: '2024-01-14T16:45:00Z'
    },
    {
      id: 'sess-003',
      name: 'Commercial Zone Analysis',
      participants: ['Alex Rodriguez', 'Rachel Green'],
      status: 'active',
      documentsCount: 31,
      parcelsCount: 6,
      lastActivity: '2024-01-15T09:15:00Z'
    }
  ]);

  const [documents] = useState<ParcelDocument[]>([
    {
      id: 'doc-001',
      title: 'Property Deed - 123 Main Street',
      type: 'deed',
      status: 'active',
      parcelId: 'PAR-001',
      uploadedBy: 'John Smith',
      uploadedAt: '2024-01-15T08:30:00Z',
      fileSize: '2.4 MB',
      linkedFeatures: 3
    },
    {
      id: 'doc-002',
      title: 'Boundary Survey Report',
      type: 'survey',
      status: 'pending',
      parcelId: 'PAR-002',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: '2024-01-15T09:15:00Z',
      fileSize: '5.1 MB',
      linkedFeatures: 7
    },
    {
      id: 'doc-003',
      title: 'Legal Description Amendment',
      type: 'legal-description',
      status: 'active',
      parcelId: 'PAR-001',
      uploadedBy: 'Mike Davis',
      uploadedAt: '2024-01-15T10:00:00Z',
      fileSize: '1.8 MB',
      linkedFeatures: 2
    },
    {
      id: 'doc-004',
      title: 'Subdivision Plat Map',
      type: 'plat',
      status: 'active',
      parcelId: 'PAR-003',
      uploadedBy: 'Lisa Chen',
      uploadedAt: '2024-01-14T15:30:00Z',
      fileSize: '8.2 MB',
      linkedFeatures: 15
    }
  ]);

  const [mapFeatures] = useState<MapFeature[]>([
    {
      id: 'feat-001',
      type: 'parcel',
      title: 'Residential Lot A-1',
      documentLinks: ['doc-001', 'doc-003'],
      coordinates: [-98.4951, 39.0473],
      status: 'verified'
    },
    {
      id: 'feat-002',
      type: 'boundary',
      title: 'Northern Property Line',
      documentLinks: ['doc-002'],
      coordinates: [-98.4952, 39.0474],
      status: 'pending'
    },
    {
      id: 'feat-003',
      type: 'easement',
      title: 'Utility Easement Corridor',
      documentLinks: ['doc-004'],
      coordinates: [-98.4950, 39.0472],
      status: 'verified'
    }
  ]);

  // Session management
  const handleJoinSession = (session?: CollaborativeSession) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsJoined(true);
      setSelectedSession(session || sessions[0]);
      setIsLoading(false);
    }, 1500);
  };

  const handleLeaveSession = () => {
    setIsJoined(false);
    setSelectedSession(null);
    setSessionCode('');
  };

  // Format utilities
  const getDocumentIcon = (type: ParcelDocument['type']) => {
    switch (type) {
      case 'deed':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'survey':
        return <Map className="h-4 w-4 text-green-600" />;
      case 'legal-description':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'plat':
        return <Layers className="h-4 w-4 text-orange-600" />;
      case 'easement':
        return <MapPin className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (size: string) => size;
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <motion.div 
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="text-center space-y-4"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground">
          Collaborative Document Parcel Mapping
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real-time collaboration on document-parcel relationships with 
          synchronized mapping, version control, and team coordination.
        </p>
      </motion.div>

      {!isJoined ? (
        // Session Join Interface
        <motion.div 
          className="max-w-2xl mx-auto space-y-6"
          variants={cardVariants}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join Collaborative Session
              </CardTitle>
              <CardDescription>
                Connect to an existing session or create a new collaborative workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Code Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter session code (e.g., ABC-123)"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                  />
                  <Button 
                    onClick={() => handleJoinSession()}
                    disabled={!sessionCode || isLoading}
                  >
                    {isLoading ? <Clock className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Join
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t" />
                  <span className="text-sm text-muted-foreground">or</span>
                  <div className="flex-1 border-t" />
                </div>
              </div>

              {/* Available Sessions */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Available Sessions</h3>
                <motion.div 
                  className="space-y-2"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      variants={itemVariants}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{session.name}</h4>
                          <Badge variant="outline" className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.participants.length} members
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {session.documentsCount} docs
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.parcelsCount} parcels
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleJoinSession(session)}
                        disabled={isLoading}
                      >
                        Join
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Create New Session
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        // Active Session Interface
        <motion.div 
          className="space-y-6"
          variants={cardVariants}
        >
          {/* Session Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedSession?.name}</h2>
                <p className="text-muted-foreground">
                  {selectedSession?.participants.length} active collaborators
                </p>
              </div>
              <Badge 
                variant="outline" 
                className={getStatusColor(selectedSession?.status || 'active')}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                Live Session
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLeaveSession}>
                Leave Session
              </Button>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Interactive Map
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Document Links
              </TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Shared Documents</CardTitle>
                      <CardDescription>
                        Real-time document management with parcel associations
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Search className="h-4 w-4 mr-1" />
                        Search
                      </Button>
                      <Button size="sm" variant="outline">
                        <Filter className="h-4 w-4 mr-1" />
                        Filter
                      </Button>
                      <Button size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="space-y-3"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {documents.map((doc) => (
                      <motion.div
                        key={doc.id}
                        variants={itemVariants}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.type)}
                          <div>
                            <h4 className="font-medium">{doc.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Parcel: {doc.parcelId}</span>
                              <span>By: {doc.uploadedBy}</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>{doc.linkedFeatures} map features</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Map Tab */}
            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collaborative Map View</CardTitle>
                  <CardDescription>
                    Real-time parcel mapping with document associations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-gradient-to-br from-green-50 to-blue-50 rounded-lg h-96 border overflow-hidden">
                    {/* Grid background */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '30px 30px'
                      }}
                    />

                    {/* Map Features */}
                    <div className="absolute top-12 left-12 w-24 h-20 bg-blue-200 border-2 border-blue-400 rounded flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-800">Parcel A-1</span>
                    </div>

                    <div className="absolute top-16 right-16 w-20 h-16 bg-green-200 border-2 border-green-400 rounded flex items-center justify-center">
                      <span className="text-xs font-semibold text-green-800">Lot B-2</span>
                    </div>

                    <div className="absolute bottom-16 left-16 w-22 h-18 bg-purple-200 border-2 border-purple-400 rounded flex items-center justify-center">
                      <span className="text-xs font-semibold text-purple-800">Easement</span>
                    </div>

                    {/* Document Links */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="80" y1="80" x2="200" y2="120" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" />
                      <line x1="200" y1="120" x2="120" y2="200" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>

                    {/* Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        {mapFeatures.length} features
                      </Badge>
                      <Badge variant="outline">
                        <Link2 className="h-3 w-3 mr-1" />
                        {documents.length} linked docs
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto-link
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View All
                      </Button>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">Map Features</h4>
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                      variants={listVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {mapFeatures.map((feature) => (
                        <motion.div
                          key={feature.id}
                          variants={itemVariants}
                          className="p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">{feature.title}</h5>
                            <Badge variant="outline" className={getStatusColor(feature.status)}>
                              {feature.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <div>Type: {feature.type}</div>
                            <div>{feature.documentLinks.length} linked documents</div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Document Links Tab */}
            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document-Parcel Relationships</CardTitle>
                  <CardDescription>
                    Manage and visualize connections between documents and map features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Link Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                        <div className="text-sm text-blue-700">Total Documents</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{mapFeatures.length}</div>
                        <div className="text-sm text-green-700">Map Features</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {documents.reduce((sum, doc) => sum + doc.linkedFeatures, 0)}
                        </div>
                        <div className="text-sm text-purple-700">Active Links</div>
                      </div>
                    </div>

                    {/* Link Management */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Recent Link Activities</h4>
                        <Button size="sm" variant="outline">
                          <Activity className="h-3 w-3 mr-1" />
                          View All
                        </Button>
                      </div>

                      <motion.div 
                        className="space-y-2"
                        variants={listVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {[
                          { action: 'Linked Property Deed to Parcel A-1', user: 'John Smith', time: '2 minutes ago' },
                          { action: 'Updated survey boundaries for Lot B-2', user: 'Sarah Johnson', time: '5 minutes ago' },
                          { action: 'Added easement documentation', user: 'Mike Davis', time: '8 minutes ago' }
                        ].map((activity, index) => (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-sm">{activity.action}</div>
                              <div className="text-xs text-muted-foreground">by {activity.user}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {/* Status Information */}
      <motion.div variants={cardVariants}>
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Real-time Collaboration:</strong> All document uploads, parcel associations, 
            and map edits are synchronized across team members instantly. Changes are tracked 
            with version history and user attribution.
          </AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}
