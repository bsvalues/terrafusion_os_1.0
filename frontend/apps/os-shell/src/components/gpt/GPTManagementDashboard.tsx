// TerraFusionGPT Suite: Management Dashboard Component
// Elite Government OS Engineering - GPT Management & Administration

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  BarChart3,
  Download,
  Upload,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Star,
  Settings,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { gptAPI, GPTConfiguration, GPTUsageStatistics } from '@/services/gptAPI';
import { gptHub } from '@/services/gptHub';

interface GPTManagementDashboardProps {
  onCreateGPT?: () => void;
  onEditGPT?: (gpt: GPTConfiguration) => void;
  onChatWithGPT?: (gpt: GPTConfiguration) => void;
}

type TabType = 'my-gpts' | 'installed' | 'all';
type SortBy = 'recent' | 'popular' | 'cost' | 'name';

/**
 * GPT Management Dashboard - Manage created and installed GPTs
 */
export const GPTManagementDashboard: React.FC<GPTManagementDashboardProps> = ({
  onCreateGPT,
  onEditGPT,
  onChatWithGPT,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('my-gpts');
  const [allGPTs, setAllGPTs] = useState<GPTConfiguration[]>([]);
  const [myGPTs, setMyGPTs] = useState<GPTConfiguration[]>([]);
  const [installedGPTs, setInstalledGPTs] = useState<GPTConfiguration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Statistics dialog
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedGPTStats, setSelectedGPTStats] = useState<GPTUsageStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gptToDelete, setGPTToDelete] = useState<GPTConfiguration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Load GPTs on mount
   */
  useEffect(() => {
    loadGPTs();
  }, []);

  /**
   * Connect to SignalR for real-time updates
   */
  useEffect(() => {
    const connectHub = async () => {
      try {
        if (!gptHub.isConnected()) {
          await gptHub.start({
            onGPTUpdate: (update) => {
              // Update GPT in lists
              const updateGPTInList = (gpts: GPTConfiguration[]) =>
                gpts.map((gpt) =>
                  gpt.id === update.gptId ? { ...gpt, ...update.data } : gpt
                );

              setAllGPTs((prev) => updateGPTInList(prev));
              setMyGPTs((prev) => updateGPTInList(prev));
              setInstalledGPTs((prev) => updateGPTInList(prev));
            },
          });
        }
      } catch (err) {
        console.error('Failed to connect to GPT Hub:', err);
      }
    };

    connectHub();
  }, []);

  /**
   * Load all GPTs and categorize
   */
  const loadGPTs = async () => {
    setIsLoading(true);

    try {
      // Get all available GPTs
      const gpts = await gptAPI.getAvailableGPTs();
      setAllGPTs(gpts);

      // TODO: Get current user ID from auth context
      const currentUserId = 'current-user-id'; // Replace with actual user ID

      // Separate my GPTs and installed GPTs
      const myCreatedGPTs = gpts.filter((g) => g.createdByUserId === currentUserId);
      const myInstalledGPTs = gpts.filter(
        (g) => g.createdByUserId !== currentUserId && !g.isSystemGPT
      );

      setMyGPTs(myCreatedGPTs);
      setInstalledGPTs(myInstalledGPTs);

      // Extract categories
      const cats = Array.from(new Set(gpts.map((g) => g.category).filter(Boolean))) as string[];
      setCategories(cats);
    } catch (err) {
      setErrorMessage('Failed to load GPTs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get filtered and sorted GPTs for current tab
   */
  const filteredGPTs = useMemo(() => {
    let gpts: GPTConfiguration[] = [];

    // Select GPTs based on active tab
    switch (activeTab) {
      case 'my-gpts':
        gpts = myGPTs;
        break;
      case 'installed':
        gpts = installedGPTs;
        break;
      case 'all':
        gpts = allGPTs;
        break;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      gpts = gpts.filter(
        (gpt) =>
          gpt.displayName.toLowerCase().includes(query) ||
          gpt.description?.toLowerCase().includes(query) ||
          gpt.category?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      gpts = gpts.filter((gpt) => gpt.category === selectedCategory);
    }

    // Sort GPTs
    gpts = [...gpts].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'popular':
          return b.installCount - a.installCount;
        case 'cost':
          return b.totalCost - a.totalCost;
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });

    return gpts;
  }, [activeTab, myGPTs, installedGPTs, allGPTs, searchQuery, selectedCategory, sortBy]);

  /**
   * Handle view statistics
   */
  const handleViewStats = async (gpt: GPTConfiguration) => {
    setLoadingStats(true);
    setStatsDialogOpen(true);

    try {
      const stats = await gptAPI.getGPTStatistics(gpt.id);
      setSelectedGPTStats(stats);
    } catch (err) {
      setErrorMessage('Failed to load statistics');
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  /**
   * Handle edit GPT
   */
  const handleEdit = (gpt: GPTConfiguration) => {
    onEditGPT?.(gpt);
  };

  /**
   * Handle delete GPT
   */
  const handleDeleteClick = (gpt: GPTConfiguration) => {
    setGPTToDelete(gpt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gptToDelete) return;

    setIsDeleting(true);

    try {
      await gptAPI.deleteGPT(gptToDelete.id);
      setSuccessMessage(`GPT "${gptToDelete.displayName}" deleted successfully`);
      setDeleteDialogOpen(false);
      setGPTToDelete(null);

      // Reload GPTs
      await loadGPTs();
    } catch (err) {
      setErrorMessage('Failed to delete GPT');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle chat with GPT
   */
  const handleChat = (gpt: GPTConfiguration) => {
    onChatWithGPT?.(gpt);
  };

  /**
   * Handle duplicate GPT
   */
  const handleDuplicate = async (gpt: GPTConfiguration) => {
    try {
      const duplicate = await gptAPI.createGPT({
        ...gpt,
        id: undefined,
        name: `${gpt.name}-copy`,
        displayName: `${gpt.displayName} (Copy)`,
        createdAt: undefined,
        updatedAt: undefined,
      });

      setSuccessMessage(`GPT duplicated as "${duplicate.displayName}"`);
      await loadGPTs();
    } catch (err) {
      setErrorMessage('Failed to duplicate GPT');
      console.error(err);
    }
  };

  /**
   * Handle toggle GPT visibility
   */
  const handleToggleVisibility = async (gpt: GPTConfiguration) => {
    try {
      await gptAPI.updateGPT(gpt.id, { isPublic: !gpt.isPublic });
      setSuccessMessage(
        `GPT is now ${!gpt.isPublic ? 'public' : 'private'}`
      );
      await loadGPTs();
    } catch (err) {
      setErrorMessage('Failed to update visibility');
      console.error(err);
    }
  };

  /**
   * Format cost display
   */
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };

  /**
   * Format number display
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  /**
   * Render GPT card
   */
  const renderGPTCard = (gpt: GPTConfiguration) => {
    const isMyGPT = myGPTs.some((g) => g.id === gpt.id);

    return (
      <Card key={gpt.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {gpt.iconUrl ? (
                <img src={gpt.iconUrl} alt={gpt.displayName} className="h-12 w-12 rounded-lg" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {gpt.displayName.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{gpt.displayName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {gpt.category && <Badge variant="secondary">{gpt.category}</Badge>}
                  {gpt.isSystemGPT && <Badge variant="outline">System</Badge>}
                  {isMyGPT && <Badge>Created by Me</Badge>}
                </div>
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleChat(gpt)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleViewStats(gpt)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Statistics
                </DropdownMenuItem>
                {isMyGPT && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEdit(gpt)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(gpt)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleVisibility(gpt)}>
                      {gpt.isPublic ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(gpt)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="line-clamp-2 mb-4">{gpt.description}</CardDescription>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatNumber(gpt.totalConversations)} conversations
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatCost(gpt.totalCost)} spent
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatNumber(gpt.installCount)} installs
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {gpt.averageRating?.toFixed(1) || 'N/A'} ({gpt.ratingCount})
              </span>
            </div>
          </div>

          {/* Model Info */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {gpt.modelProvider}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {gpt.modelName}
            </Badge>
            {gpt.enableRAG && (
              <Badge variant="outline" className="text-xs">
                RAG
              </Badge>
            )}
            {gpt.enableFunctions && (
              <Badge variant="outline" className="text-xs">
                Functions
              </Badge>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Updated {new Date(gpt.updatedAt).toLocaleDateString()}</span>
            <Badge variant={gpt.status === 'Active' ? 'default' : 'secondary'}>
              {gpt.status}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button className="flex-1" onClick={() => handleChat(gpt)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button variant="outline" onClick={() => handleViewStats(gpt)}>
            <BarChart3 className="h-4 w-4" />
          </Button>
          {isMyGPT && (
            <Button variant="outline" onClick={() => handleEdit(gpt)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  /**
   * Render statistics dialog
   */
  const renderStatsDialog = () => {
    if (!selectedGPTStats) return null;

    return (
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GPT Statistics: {selectedGPTStats.gptName}</DialogTitle>
            <DialogDescription>
              Usage statistics from {new Date(selectedGPTStats.periodStart).toLocaleDateString()}{' '}
              to {new Date(selectedGPTStats.periodEnd).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalConversations)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalMessages)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalTokens)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Total Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCost(selectedGPTStats.totalCost)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Unique Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <p className="text-xl font-semibold">{selectedGPTStats.uniqueUsers}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <p className="text-xl font-semibold">
                        {selectedGPTStats.averageRating.toFixed(1)}/5.0
                      </p>
                      <span className="text-sm text-gray-500">
                        ({selectedGPTStats.ratingCount} ratings)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cost Per Conversation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Per Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    {formatCost(
                      selectedGPTStats.totalCost / Math.max(selectedGPTStats.totalConversations, 1)
                    )}
                  </p>
                  <Progress
                    value={(selectedGPTStats.totalCost / 100) * 100}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  /**
   * Render delete confirmation dialog
   */
  const renderDeleteDialog = () => {
    return (
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete GPT</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{gptToDelete?.displayName}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All conversations and usage data for this GPT will be permanently deleted.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete GPT'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">My GPTs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your created and installed GPTs
            </p>
          </div>

          <Button onClick={onCreateGPT}>
            <Plus className="h-4 w-4 mr-2" />
            Create GPT
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search GPTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="cost">Highest Cost</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="m-6 mb-0">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="m-6 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="my-gpts">
              My GPTs ({myGPTs.length})
            </TabsTrigger>
            <TabsTrigger value="installed">
              Installed ({installedGPTs.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Available ({allGPTs.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading GPTs...</p>
                </div>
              ) : filteredGPTs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'my-gpts'
                      ? "You haven't created any GPTs yet"
                      : "No GPTs found"}
                  </p>
                  {activeTab === 'my-gpts' && (
                    <Button onClick={onCreateGPT}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First GPT
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGPTs.map(renderGPTCard)}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Tabs>

      {/* Statistics Dialog */}
      {renderStatsDialog()}

      {/* Delete Confirmation Dialog */}
      {renderDeleteDialog()}
    </div>
  );
};

export default GPTManagementDashboard;
